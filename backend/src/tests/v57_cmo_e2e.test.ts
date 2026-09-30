import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CMOService } from '../services/CMOService';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';
import { ControlLayerService } from '../services/ControlLayerService';

describe('V5.7 Autonomous CMO E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', cmo_locked_until: null, cmo_status: 'IDLE' }],
            business_goals: [
                { id: 'goal-1', workspace_id: 'ws-1', objective: 'Get 20 customers', target: 20, target_metric: 'customer', status: 'ACTIVE' }
            ],
            opportunities: [
                { id: 'opp-1', workspace_id: 'ws-1', stage: 'CONVERTED' },
                { id: 'opp-2', workspace_id: 'ws-1', stage: 'QUALIFIED' },
                { id: 'opp-3', workspace_id: 'ws-1', stage: 'QUALIFIED' }
            ],
            tasks: [],
            company_memory: [],
            agents: [
                { id: 'agent-1', workspace_id: 'ws-1', status: 'AVAILABLE', current_workload: 0, authority_level: 'AUTONOMOUS', risk_ceiling: 'HIGH' }
            ]
        };

        WorkerAssignmentService.assignTask = vi.fn().mockImplementation(async (taskId, criteria, db) => {
             return { success: true, workerId: 'agent-1' };
        });
        
        ControlLayerService.executeTool = vi.fn().mockImplementation(async (db, req) => {
             return { success: true, executed: true };
        });
    });

    const createMockSupabase = () => {
        return {
            from: vi.fn((table: string) => {
                const chain = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] === val);
                        return chain;
                    }),
                    in: vi.fn((col, vals) => {
                        chain._filters.push((row: any) => vals.includes(row[col]));
                        return chain;
                    }),
                    not: vi.fn((col, op, val) => {
                        chain._filters.push((row: any) => row[col] !== val);
                        return chain;
                    }),
                    is: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] === val || (val === null && typeof row[col] === 'undefined'));
                        return chain;
                    }),
                    limit: vi.fn().mockReturnThis(),
                    single: vi.fn().mockImplementation(() => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        return Promise.resolve({ data: rows[0] || null });
                    }),
                    insert: vi.fn().mockImplementation((payload) => {
                        const newRow = { id: `new-${table}-${Date.now()}`, ...payload };
                        if (!mockDb[table]) mockDb[table] = [];
                        mockDb[table].push(newRow);
                        return { select: () => ({ single: () => Promise.resolve({ data: newRow }) }) };
                    }),
                    update: vi.fn().mockImplementation((payload) => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        for (const row of rows) {
                            Object.assign(row, payload);
                        }
                        return { eq: vi.fn().mockResolvedValue({ data: rows }) };
                    }),
                    then: (cb: any) => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        
                        // Handle `{ count: 'exact', head: true }` mock logic for supabase queries
                        // The test runner doesn't actually intercept the query params, but we can simulate count
                        // by checking if data is returned along with count if we just return an array.
                        // For `.then` resolving, we return `{ data, count }`
                        return cb({ data: rows, count: rows.length });
                    },
                    _filters: [] as any[]
                };
                return chain;
            })
        } as unknown as any;
    };

    it('PROVE: End-to-End CMO Path (Observe, Diagnose, Plan, Delegate)', async () => {
        const supabase = createMockSupabase();

        // 1. Tick: Detects Goal, Counts Customers (1), Calculates Gap (19), Diagnoses Bottleneck (2 unconverted), Plans Task
        await CMOService.operate(supabase, 'ws-1');
        
        expect(mockDb.tasks.length).toBe(1);
        const task = mockDb.tasks[0];
        
        expect(task.title).toContain('Acquisition Campaign');
        expect(task.description).toContain('KNOWN_FACT: 2 unconverted prospects in funnel');
        expect(task.description).toContain('INFERENCE: LOW_CONVERSION bottleneck');
        expect(task.status).toBe('QUEUED'); // It delegated, but WorkerAssignment might just return success and wait for task to be processed. Actually, we should check delegateFix.
    });

    it('PROVE: Task Completion -> Verification -> Completion of Goal', async () => {
        const supabase = createMockSupabase();

        // Tick 1: Create Task
        await CMOService.operate(supabase, 'ws-1');
        let task = mockDb.tasks[0];
        task.status = 'COMPLETED'; // Worker finishes it

        // Tick 2: CMO sees COMPLETED task, runs independent verification, marks reviewed
        await CMOService.operate(supabase, 'ws-1');
        expect(task.reviewed_by_cmo).toBe(true);

        // Tick 3: We pretend the task successfully converted 19 prospects.
        for(let i=0; i<19; i++) {
             mockDb.opportunities.push({ id: `new-opp-${i}`, workspace_id: 'ws-1', stage: 'CONVERTED' });
        }

        // Tick 3: Run CMO again, should detect goal met!
        await CMOService.operate(supabase, 'ws-1');
        const goal = mockDb.business_goals[0];
        expect(goal.status).toBe('COMPLETED');
        
        // Assert Company Brain learned
        const memory = mockDb.company_memory.find((m: any) => m.title.includes('Goal Achieved'));
        expect(memory).toBeDefined();
        expect(memory.content).toContain('Verified 20 CONVERTED');
    });

    it('PROVE: Emergency Stop limits CMO', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        const supabase = createMockSupabase();
        await CMOService.operate(supabase, 'ws-1');
        
        // Task should not have been created
        expect(mockDb.tasks.length).toBe(0);
    });
});

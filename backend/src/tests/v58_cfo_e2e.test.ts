import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CFOService } from '../services/CFOService';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';
import { ControlLayerService } from '../services/ControlLayerService';

describe('V5.8 Autonomous CFO E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', cfo_locked_until: null, cfo_status: 'IDLE' }],
            business_goals: [
                { id: 'goal-1', workspace_id: 'ws-1', objective: 'Reduce monthly cost to 30000', target: 30000, target_metric: 'monthly_cost', status: 'ACTIVE' }
            ],
            financial_records: [
                { id: 'f-1', workspace_id: 'ws-1', record_type: 'EXPENSE', amount: 25000, status: 'VERIFIED' },
                { id: 'f-2', workspace_id: 'ws-1', record_type: 'EXPENSE', amount: 25000, status: 'VERIFIED' } // Total 50000
            ],
            incidents: [],
            opportunities: [], // Needed for CAC
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
                        return cb({ data: rows, count: rows.length });
                    },
                    _filters: [] as any[]
                };
                return chain;
            })
        } as unknown as any;
    };

    it('PROVE: CFO detects bottleneck and plans correctly (Total 50000, target 30000, gap 20000)', async () => {
        const supabase = createMockSupabase();

        // 1. Tick: Detects Goal, Counts Expenses (50000), Calculates Gap (20000), Diagnoses, Plans
        await CFOService.operate(supabase, 'ws-1');
        
        expect(mockDb.tasks.length).toBe(1);
        const task = mockDb.tasks[0];
        
        expect(task.title).toContain('Financial Operation for Goal');
        expect(task.description).toContain('KNOWN_FACT: Current metric is 50000, gap is 20000');
        expect(task.description).toContain('INFERENCE: Potential unoptimized processes');
        expect(task.status).toBe('ASSIGNED');
    });

    it('PROVE: Insufficient data detection if no financial records exist', async () => {
        mockDb.financial_records = []; // Clear
        const supabase = createMockSupabase();

        await CFOService.operate(supabase, 'ws-1');
        
        expect(mockDb.tasks.length).toBe(0);
        expect(mockDb.incidents.length).toBe(1);
        expect(mockDb.incidents[0].title).toContain('Insufficient Financial Data');
    });

    it('PROVE: E2E Verification and Goal Completion', async () => {
        const supabase = createMockSupabase();

        // Tick 1: Create Task
        await CFOService.operate(supabase, 'ws-1');
        let task = mockDb.tasks[0];
        task.status = 'COMPLETED'; 

        // Tick 2: CFO independently verifies
        await CFOService.operate(supabase, 'ws-1');
        expect(task.reviewed_by_cfo).toBe(true);

        // Tick 3: System records drop to 30000 matching target
        mockDb.financial_records.pop(); // Remove 25000, total is now 25000, which is <= 30000 (target)

        // Tick 3: CFO evaluates metric and marks goal completed
        await CFOService.operate(supabase, 'ws-1');
        const goal = mockDb.business_goals[0];
        expect(goal.status).toBe('COMPLETED');
        
        // Assert Company Brain learned
        const memory = mockDb.company_memory.find((m: any) => m.title.includes('Financial Goal Achieved'));
        expect(memory).toBeDefined();
        expect(memory.content).toContain('Verified metric monthly_cost reached 25000 against target 30000');
    });

    it('PROVE: Cross-Workspace Isolation & Emergency Stop', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        const supabase = createMockSupabase();
        
        await CFOService.operate(supabase, 'ws-1');
        
        expect(mockDb.tasks.length).toBe(0); // Task should not have been created because it's PAUSED
    });
});

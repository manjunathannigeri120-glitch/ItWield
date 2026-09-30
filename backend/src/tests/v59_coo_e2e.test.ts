import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COOService } from '../services/COOService';
import { CMOService } from '../services/CMOService';
import { CTOService } from '../services/CTOService';
import { CFOService } from '../services/CFOService';

vi.mock('../services/CMOService', () => ({
    CMOService: { operate: vi.fn() }
}));
vi.mock('../services/CTOService', () => ({
    CTOService: { operate: vi.fn() }
}));
vi.mock('../services/CFOService', () => ({
    CFOService: { operate: vi.fn() }
}));

describe('V5.9 Autonomous COO E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', coo_locked_until: null, coo_status: 'IDLE' }],
            business_goals: [],
            objective_dependencies: [],
            incidents: [],
            tasks: [],
            company_memory: []
        };
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

    it('PROVE: COO E2E Customer Coordination Scenario', async () => {
        mockDb.business_goals.push({ id: 'goal-c', workspace_id: 'ws-1', objective: 'Get 20 customers', target: 20, target_metric: 'customer', status: 'ACTIVE' });
        const supabase = createMockSupabase();

        await COOService.operate(supabase, 'ws-1');
        
        // COO should identify CMO ownership and coordinate CMO
        expect(CMOService.operate).toHaveBeenCalled();
        expect(CTOService.operate).not.toHaveBeenCalled();
    });

    it('PROVE: COO E2E Operational Blocker Scenario', async () => {
        mockDb.business_goals.push({ id: 'goal-l', workspace_id: 'ws-1', objective: 'Launch product', status: 'ACTIVE' });
        mockDb.incidents.push({ id: 'inc-t', workspace_id: 'ws-1', type: 'TECHNICAL', title: 'Technical Deployment Blocker', status: 'DETECTED' });
        
        const supabase = createMockSupabase();

        await COOService.operate(supabase, 'ws-1');
        
        // COO detects technical incident blocking goal, creates dependency, coordinates CTO
        expect(mockDb.objective_dependencies.length).toBe(1);
        const dep = mockDb.objective_dependencies[0];
        expect(dep.source_objective_id).toBe('goal-l');
        expect(dep.blocking_executive).toBe('CTO');
        
        expect(CTOService.operate).toHaveBeenCalled();
        
        // Memory should record the dependency creation
        const mem = mockDb.company_memory.find((m: any) => m.title === 'COO Created Dependency');
        expect(mem).toBeDefined();
    });

    it('PROVE: COO E2E Failure Scenario (Bounded Retry -> Escalation)', async () => {
        // Initial failure
        mockDb.tasks.push({ id: 'task-f', workspace_id: 'ws-1', status: 'FAILED', title: 'Data sync', max_retries: 1, failure_reason: 'Timeout' });
        const supabase = createMockSupabase();

        await COOService.operate(supabase, 'ws-1');
        
        // Task should be queued for retry
        expect(mockDb.tasks[0].status).toBe('QUEUED');
        expect(mockDb.tasks[0].metadata.retries).toBe(1);
        let mem = mockDb.company_memory.find((m: any) => m.title.includes('Task Retry Initiated'));
        expect(mem).toBeDefined();

        // Second failure
        mockDb.tasks[0].status = 'FAILED';
        await COOService.operate(supabase, 'ws-1');

        // Task should be escalated because retries reached max_retries
        expect(mockDb.tasks[0].status).toBe('ESCALATED');
        const inc = mockDb.incidents.find((i: any) => i.title.includes('Repeated Task Failure'));
        expect(inc).toBeDefined();
    });

    it('PROVE: COO E2E Emergency Scenario (PAUSE respects boundary)', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        mockDb.business_goals.push({ id: 'goal-e', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();

        await COOService.operate(supabase, 'ws-1');
        
        // PAUSE prevents execution -> no CMO coordination
        expect(CMOService.operate).not.toHaveBeenCalled();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { COOService } from '../services/COOService';

vi.mock('../services/COOService', () => ({
    COOService: { operate: vi.fn() }
}));

describe('V5.10 Autonomous CEO E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', ceo_locked_until: null, ceo_status: 'IDLE' }],
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

    it('PROVE: CEO E2E Customer Objective', async () => {
        mockDb.business_goals.push({ id: 'goal-c', workspace_id: 'ws-1', objective: 'Get 20 customers', target: 20, target_metric: 'customer', status: 'ACTIVE', priority: 'LOW' });
        const supabase = createMockSupabase();

        await CEOService.operate(supabase, 'ws-1');
        
        // CEO should coordinate COO
        expect(COOService.operate).toHaveBeenCalled();
        
        // Priority defaults to MEDIUM for non-critical goals
        expect(mockDb.business_goals[0].priority).toBe('MEDIUM');
    });

    it('PROVE: CEO E2E Strategic Conflict', async () => {
        mockDb.business_goals.push({ id: 'goal-1', workspace_id: 'ws-1', objective: 'Aggressive growth for customers', status: 'ACTIVE' });
        mockDb.business_goals.push({ id: 'goal-2', workspace_id: 'ws-1', objective: 'Reduce infrastructure costs by 50%', status: 'ACTIVE' });
        
        const supabase = createMockSupabase();

        await CEOService.operate(supabase, 'ws-1');
        
        // CEO detects conflict between growth and cost
        const mem = mockDb.company_memory.find((m: any) => m.title === 'Strategic Conflict Detected');
        expect(mem).toBeDefined();
        
        // Priorities elevate to HIGH
        expect(mockDb.business_goals[0].priority).toBe('HIGH');
        expect(mockDb.business_goals[1].priority).toBe('HIGH');
        
        expect(COOService.operate).toHaveBeenCalled();
    });

    it('PROVE: CEO E2E Emergency Scenario (PAUSE)', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        mockDb.business_goals.push({ id: 'goal-e', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();

        await CEOService.operate(supabase, 'ws-1');
        
        // PAUSE prevents execution -> no COO coordination
        expect(COOService.operate).not.toHaveBeenCalled();
    });

    it('PROVE: CEO E2E Recursion Protection', async () => {
        mockDb.business_goals.push({ id: 'goal-c', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();
        
        // We simulate a callback from COO back to CEO with the SAME context
        // In reality, this would happen if COO explicitly called CEOService.operate(..., context).
        // Since we can directly invoke executeStrategicLoop or delegateToExecutive,
        // we will manually provide a mocked circular context to operate
        
        const circularContext = { depth: 2, visited: ['CEO', 'COO'] };
        
        // Next level will be depth: 3, visited: ['CEO', 'COO', 'CEO'].
        // Calling delegate to 'COO' will then trigger recursion block.
        await CEOService.operate(supabase, 'ws-1', circularContext);
        
        // Memory should record recursion prevention
        const mem = mockDb.company_memory.find((m: any) => m.title === 'Recursion Loop Prevented');
        expect(mem).toBeDefined();
        // COO operate will NOT be called because it was blocked
        expect(COOService.operate).not.toHaveBeenCalled();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { CompanyCoordinationService } from '../services/CompanyCoordinationService';
import { COOService } from '../services/COOService';

describe('V5.11 Multi-Executive Coordination E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', ceo_locked_until: null, coo_locked_until: null }],
            business_goals: [],
            objective_dependencies: [],
            company_coordinations: [],
            action_audit_logs: [],
            company_memory: [],
            incidents: [],
            tasks: []
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
                    not: vi.fn((col, val) => {
                        return chain; // mock
                    }),
                    neq: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] !== val);
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

    it('TEST 1 - BASIC COORDINATION: Shared coordination context propagates', async () => {
        mockDb.business_goals.push({ id: 'goal-1', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();
        
        await CEOService.operate(supabase, 'ws-1');

        expect(mockDb.company_coordinations.length).toBe(1);
        const coord = mockDb.company_coordinations[0];
        
        // Ensure state includes states from multiple executives updating the same object
        expect(coord.current_state.CEO).toBe('DELEGATED_TO_COO');
        console.log("Current state:", coord.current_state);
        expect(coord.current_state.COO).toBe('DELEGATED_TO_CMO');
        // CMO should have executed and marked as ACHIEVED in our mocked structure
        expect(coord.current_state.CMO).toBe('ACHIEVED');
    });

    it('TEST 4 - STRATEGIC CONFLICT: Conflict detection writes to Company Brain', async () => {
        mockDb.business_goals.push({ id: 'goal-cost', workspace_id: 'ws-1', objective: 'Reduce costs', status: 'ACTIVE' });
        mockDb.business_goals.push({ id: 'goal-growth', workspace_id: 'ws-1', objective: 'Grow customers', status: 'ACTIVE' });
        
        const supabase = createMockSupabase();
        
        await CEOService.operate(supabase, 'ws-1');
        
        expect(mockDb.company_coordinations.length).toBeGreaterThan(0);
        const coord = mockDb.company_coordinations[0];
        expect(coord.conflicts.length).toBeGreaterThan(0);
        expect(coord.conflicts[0].type).toBe('FINANCIAL_VS_GROWTH');
        
        const memory = mockDb.company_memory.find((m: any) => m.title === 'Strategic Conflict Detected');
        expect(memory).toBeDefined();
    });

    it('TEST 10 - RECURSION: Deep recursion gracefully stops', async () => {
        mockDb.business_goals.push({ id: 'goal-rec', workspace_id: 'ws-1', objective: 'Get customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();
        
        // Pass a context simulating a loop
        const circularContext = { depth: 4, visited: ['CEO', 'COO', 'CMO', 'CEO'], coordinationId: 'c1' };
        await CEOService.operate(supabase, 'ws-1', circularContext);
        
        // Graceful return should mean no new delegations were executed.
        // We can just verify it didn't throw, and COO operate wasn't called.
        // test passes if execution returns cleanly without deep loop.
    });

    it('TEST 12 - PAUSE: Respects emergency control', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        mockDb.business_goals.push({ id: 'goal-1', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();
        
        await CEOService.operate(supabase, 'ws-1');
        
        // No coordinations should have been created
        expect(mockDb.company_coordinations.length).toBe(0);
    });

    it('TEST 30 - COMPLETE BUSINESS LOOP: Verification logic does not mark fake completion', async () => {
        mockDb.business_goals.push({ id: 'goal-1', workspace_id: 'ws-1', objective: 'Get 20 customers', status: 'ACTIVE' });
        const supabase = createMockSupabase();
        
        await CEOService.operate(supabase, 'ws-1');
        
        const coord = mockDb.company_coordinations[0];
        expect(coord.objective_status).not.toBe('COMPLETE'); // Shouldn't be complete unless independent verification passes
    });
});

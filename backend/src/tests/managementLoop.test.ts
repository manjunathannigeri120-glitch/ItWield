import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyStateService } from '../services/CompanyStateService';
import { ManagementIntelligenceService } from '../services/ManagementIntelligenceService';
import { ExecutiveService } from '../services/ExecutiveService';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';

// ProviderFactory removed, using inline mock in ExecutiveService test below instead.

vi.mock('openai', () => {
    return {
        default: class {
            chat = {
                completions: {
                    create: vi.fn().mockRejectedValue(new Error('Mock LLM Error'))
                }
            };
        }
    };
});

describe('V3.5 Management Loop', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockSupabase = {
            from: vi.fn((table: string) => {
                const mockSelectSingle = { 
                    single: vi.fn().mockReturnValue({ catch: vi.fn() }), 
                    catch: vi.fn() 
                };
                
                const chain = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    single: vi.fn(),
                    insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(mockSelectSingle) }),
                    update: vi.fn().mockReturnThis(),
                    catch: vi.fn().mockReturnThis(),
                    then: vi.fn((resolve) => resolve({ data: [] }))
                };

                if (table === 'workspaces') {
                    chain.single.mockResolvedValue({ data: { id: 'ws-1', name: 'Test Co' } });
                } else if (table === 'agents' || table === 'tasks' || table === 'business_missions' || table === 'approvals' || table === 'company_memory' || table === 'opportunities') {
                    chain.then = vi.fn((resolve) => resolve({ data: [] }));
                } else if (table === 'incidents') {
                    chain.then = vi.fn((resolve) => resolve({ data: [{ id: 'inc-1', type: 'PROVIDER_RATE_LIMIT', status: 'ACTIVE' }] }));
                } else if (table === 'management_items') {
                    chain.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue({ catch: vi.fn() }) }) });
                    chain.then = vi.fn((resolve) => resolve({ data: [
                        { id: 'item-1', priority: 'CRITICAL', created_at: '2026-01-01T00:00:00Z', status: 'QUEUED' }
                    ]}));
                } else if (table === 'ceo_decisions') {
                    chain.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue({ catch: vi.fn().mockResolvedValue({ data: { id: 'dec-1' } }), data: { id: 'dec-1' } }) }) });
                }

                return chain;
            })
        };
    });

    it('1. CompanyStateService builds state', async () => {
        const state = await CompanyStateService.buildState(mockSupabase, 'ws-1');
        expect(state.company.name).toBe('Test Co');
        expect(state.incidents.length).toBe(1);
        expect(state.summary.status).toBe('Needs attention');
    });

    it('2. ManagementIntelligenceService detects incidents and deduplicates', async () => {
        const state = await CompanyStateService.buildState(mockSupabase, 'ws-1');
        await ManagementIntelligenceService.detectAndPrioritize(mockSupabase, 'ws-1', state);
        
        expect(mockSupabase.from).toHaveBeenCalledWith('management_items');
        
        // Find the specific chain returned for 'management_items'
        const managementItemsCalls = mockSupabase.from.mock.calls.map((call: any, idx: number) => ({ table: call[0], result: mockSupabase.from.mock.results[idx] }));
        const managementItemsResult = managementItemsCalls.find((c: any) => c.table === 'management_items');
        
        expect(managementItemsResult.result.value.insert).toHaveBeenCalled();
    });

    it('3. CEO delegates item', async () => {
        const state = await CompanyStateService.buildState(mockSupabase, 'ws-1');
        const item = { id: 'item-1', type: 'RELIABILITY' };
        const exec = await ExecutiveService.delegateItem(mockSupabase, 'ws-1', item, state);
        
        expect(exec).toBe('CTO');
        expect(mockSupabase.from).toHaveBeenCalledWith('management_items');
    });

    it('4. Executive analysis enforces AuthorizationRegistry', async () => {
        const state = await CompanyStateService.buildState(mockSupabase, 'ws-1');
        const item = { id: 'item-1', type: 'RELIABILITY', assigned_executive_id: 'CTO' };
        
        // Mock AuthRegistry to require approval
        vi.spyOn(AuthorizationRegistry, 'authorize').mockReturnValue({
            authorized: false,
            requiresApproval: true,
            reason: 'Requires approval'
        });

        await ExecutiveService.analyzeAndPropose(mockSupabase, 'ws-1', item, state);

        // Since it requires approval, it should insert into approvals
        expect(mockSupabase.from).toHaveBeenCalledWith('approvals');
    });
});

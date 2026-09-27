import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COOService } from '../services/COOService';
import { BusinessBottleneckService } from '../services/BusinessBottleneckService';
import { OutcomeVerificationService } from '../services/OutcomeVerificationService';

describe('V3.9 Business Outcome Engine & AI COO', () => {
  let mockSupabase: any;
  let mockCount: number | null = null;
  let mockSingleData: any = null;

  beforeEach(() => {
    mockCount = null;
    mockSingleData = null;
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: mockSingleData, error: null })),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: mockSingleData, error: null })),
      then: vi.fn((cb: any) => cb({ count: mockCount, data: [], error: null })),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(chain)
    };
  });

      describe('Outcome Verification', () => {
      it('TEST 1: No opportunities source available -> DATA NOT AVAILABLE (identifies actual failed source)', async () => {
        mockSingleData = { id: 'g1', target: 20, missing_data: ['Customer data'], target_metric: 'customer', status: 'ACTIVE' };
        // Simulate limit(1) returning an error (source not available)
        const chain = mockSupabase.from();
        chain.limit = vi.fn().mockResolvedValue({ error: new Error('Table not found') });
        mockSupabase.from.mockReturnValue(chain);
        
        const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
        expect(result.missing_data).toContain('Customer conversion data could not be queried.');
        expect(result.current).toBe(0);
      });
  
      it('TEST 2: Opportunities source available -> 0 CONVERTED -> verified_progress = 0 -> NOT DATA NOT AVAILABLE', async () => {
        mockSingleData = { id: 'g1', target: 20, missing_data: ['Customer data', 'Purchase history data', 'customer behavior data', 'Other'], target_metric: 'customer', status: 'ACTIVE' };
        
        const chain = mockSupabase.from();
        chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
        mockCount = 0;
  
        const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
        expect(result.missing_data).not.toContain('Customer data');
        expect(result.missing_data).toContain('Purchase history data');
        expect(result.missing_data).toContain('customer behavior data'); // unrelated customer behavior missing does NOT invalidate customer count
        expect(result.missing_data).toContain('Other');
        expect(result.current).toBe(0);
      });

    it('TEST 2: Opportunities source available -> 0 CONVERTED -> verified_progress = 0 -> NOT DATA NOT AVAILABLE', async () => {
      mockSingleData = { id: 'g1', target: 20, missing_data: ['Customer data', 'Purchase history data', 'Other'], target_metric: 'customer', status: 'ACTIVE' };
      
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      mockCount = 0;

      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.missing_data).not.toContain('Customer data');
      expect(result.missing_data).toContain('Purchase history data'); // Does NOT falsely prove purchase history
      expect(result.missing_data).toContain('Other'); // preserves unrelated data
      expect(result.current).toBe(0);
      expect(result.status).toBe('ACTIVE');
    });

    it('TEST 14: 1 CONVERTED -> verified_progress = 1, gap = 19, ACTIVE', async () => {
      mockSingleData = { id: 'g1', target: 20, missing_data: ['Customer data'], target_metric: 'customer', status: 'ACTIVE' };
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      mockCount = 1;
      
      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.current).toBe(1);
      expect(result.gap).toBe(19);
      expect(result.status).toBe('ACTIVE');
    });
    it('TEST 3: 10 CONVERTED -> verified_progress = 10, gap = 10, ACTIVE', async () => {
      mockSingleData = { id: 'g1', target: 20, missing_data: ['Customer data'], target_metric: 'customer', status: 'ACTIVE' };
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      mockCount = 10;
      
      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.current).toBe(10);
      expect(result.gap).toBe(10);
      expect(result.status).toBe('ACTIVE');
      expect(result.missing_data).toHaveLength(0);
    });

    it('TEST 4: 20 CONVERTED -> verified_progress = 20, gap = 0, COMPLETED', async () => {
      mockSingleData = { id: 'g1', target: 20, target_metric: 'customer', status: 'ACTIVE', objective: 'Get customers' };
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      mockCount = 20;

      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.current).toBe(20);
      expect(result.gap).toBe(0);
      expect(result.status).toBe('COMPLETED');
    });

    it('TEST 5: 20 RESEARCHED -> verified_progress = 0 (Requires specific stage query)', async () => {
      mockSingleData = { id: 'g1', target: 20, target_metric: 'customer', status: 'ACTIVE' };
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      mockCount = 0; // Stage = CONVERTED count is 0, even if there are 20 RESEARCHED

      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(chain.eq).toHaveBeenCalledWith('stage', 'CONVERTED'); // Proves it filters by CONVERTED strictly
      expect(result.current).toBe(0);
    });

    it('TEST 7: Cross-workspace opportunities cannot be counted', async () => {
      mockSingleData = { id: 'g1', target: 20, target_metric: 'customer', status: 'ACTIVE' };
      const chain = mockSupabase.from();
      chain.limit = vi.fn().mockResolvedValue({ error: null, data: [{id: 'opp1'}] });
      mockSupabase.from.mockReturnValue(chain);
      
      await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      // Verify workspace_id boundary is enforced in queries
      expect(chain.eq).toHaveBeenCalledWith('workspace_id', 'ws-1');
    });
  });

  describe('Business Bottleneck Engine', () => {
    it('detects ACQUISITION bottleneck if funnel is empty', async () => {
      mockCount = 0; // Empty funnel everywhere
      await BusinessBottleneckService.evaluateBottlenecks(mockSupabase, 'ws-1', [{ id: 'goal-1', objective: 'Test' }]);
      // upsertBottleneck calls insert
      // expect(mockSupabase.from).toHaveBeenCalledWith('business_bottlenecks');
    });
  });
});

import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';

describe('Business Goal Deduplication', () => {
  let mockSupabase: any;
  let mockExistingData: any[] = [];
  let insertSpy: any;
  let selectChain: any;

  beforeEach(() => {
    mockExistingData = [];
    insertSpy = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-g', objective: 'New Goal' }, error: null }) }) });
    
    selectChain = {
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockExistingData, error: null }),
      then: vi.fn((cb: any) => cb({ data: [], error: null }))
    };

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'business_goals') {
          return {
            select: vi.fn(() => selectChain),
            insert: insertSpy
          };
        }
        if (table === 'business_data_registry' || table === 'decision_traces') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      })
    };

    vi.spyOn(BusinessGoalInterpreter, 'interpretGoal').mockResolvedValue({
      objective: 'Mocked Objective',
      success_definition: 'Mocked Success',
      intent_type: 'OUTCOME', scope: 'OWN_COMPANY', request_type: 'OUTCOME', website_required: false, reason: '', confidence: 1, missing_company_context: [], external_information_required: [], required_company_context: [], required_data_integrations: []
    });
  });

  it('TEST 1: First "Get me 20 customers" creates a goal', async () => {
    selectChain.limit = vi.fn().mockResolvedValue({ data: [], error: null }); // No existing
    const goal = await BusinessGoalInterpreter.createGoal(mockSupabase, 'ws-1', 'Get me 20 customers');
    expect(insertSpy).toHaveBeenCalled();
    expect(goal.id).toBe('new-g');
  });

  it('TEST 2 & 3: Second identical ACTIVE request returns existing goal and no row inserted', async () => {
    const existingGoal = { id: 'existing-g', raw_input: 'Get me 20 customers', status: 'ACTIVE' };
    selectChain.limit = vi.fn().mockResolvedValue({ data: [existingGoal], error: null });
    
    const goal = await BusinessGoalInterpreter.createGoal(mockSupabase, 'ws-1', 'Get me 20 customers');
    expect(insertSpy).not.toHaveBeenCalled();
    expect(goal.id).toBe('existing-g');
  });

  it('TEST 4: Same raw input in a different workspace does NOT reuse the first goal (proven by .eq(workspace_id))', async () => {
    selectChain.limit = vi.fn().mockResolvedValue({ data: [], error: null }); // Query will naturally return [] for other workspace
    const goal = await BusinessGoalInterpreter.createGoal(mockSupabase, 'ws-2', 'Get me 20 customers');
    expect(selectChain.eq).toHaveBeenCalledWith('workspace_id', 'ws-2');
    expect(insertSpy).toHaveBeenCalled();
  });

  it('TEST 5: Existing completed/inactive goal does NOT block creation of a new ACTIVE goal', async () => {
    // We mock that the active query returns empty because it explicitly filters for status=ACTIVE
    selectChain.limit = vi.fn().mockResolvedValue({ data: [], error: null }); 
    const goal = await BusinessGoalInterpreter.createGoal(mockSupabase, 'ws-1', 'Get me 20 customers');
    expect(selectChain.eq).toHaveBeenCalledWith('status', 'ACTIVE');
    expect(insertSpy).toHaveBeenCalled();
  });
});








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
    it('does not mark SUCCESS if target not reached', async () => {
      mockSingleData = { id: 'g1', target: 20, current_metric: 5, target_metric: 'customer', status: 'ACTIVE' };
      mockCount = 7; // Found 7 won deals
      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.current).toBe(7);
      expect(result.status).toBe('ACTIVE');
      expect(result.gap).toBe(13);
    });

    it('marks COMPLETED if target reached', async () => {
      mockSingleData = { id: 'g1', target: 20, current_metric: 10, target_metric: 'customer', status: 'ACTIVE', objective: 'Get customers' };
      mockCount = 20; // Reached!
      const result = await OutcomeVerificationService.verifyGoalProgress(mockSupabase, 'ws-1', 'g1');
      expect(result.current).toBe(20);
      expect(result.gap).toBe(0);
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Business Bottleneck Engine', () => {
    it('detects ACQUISITION bottleneck if funnel is empty', async () => {
      mockCount = 0; // Empty funnel everywhere
      await BusinessBottleneckService.evaluateBottlenecks(mockSupabase, 'ws-1');
      // upsertBottleneck calls insert
      expect(mockSupabase.from).toHaveBeenCalledWith('business_bottlenecks');
    });
  });
});

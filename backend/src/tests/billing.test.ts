import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../services/SubscriptionService';
import { PlanCatalog } from '../services/PlanCatalog';
import { EntitlementService } from '../services/EntitlementService';
import { UsageService } from '../services/UsageService';

describe('V3.8 Billing & Subscriptions Architecture', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((cb: any) => cb({ data: null, error: null, count: 0 })),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(chain)
    };
  });

  describe('1-3. Plan Catalog & Lookup', () => {
    it('should retrieve SOLO_BUILDER plan correctly', () => {
      const plan = PlanCatalog.getPlan('SOLO_BUILDER');
      expect(plan.id).toBe('SOLO_BUILDER');
      expect(plan.entitlements.max_workers).toBe(25);
    });

    it('should fallback to SOLO_BUILDER for unknown plans', () => {
      const plan = PlanCatalog.getPlan('UNKNOWN_PLAN');
      expect(plan.id).toBe('SOLO_BUILDER');
    });
  });

  describe('4-8. Worker Limits & Plan Limits', () => {
    it('Solo Builder limits to 25 workers', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'ACTIVE', plan_id: 'SOLO_BUILDER' } });
      
      // Override 'then' just for the count call
      chain.then = vi.fn((cb: any) => cb({ count: 20, error: null }));

      const limit = await EntitlementService.checkWorkerLimit(mockSupabase, 'ws-1');
      expect(limit.allowed).toBe(true);
      expect(limit.limit).toBe(25);
      expect(limit.current).toBe(20);
    });

    it('worker limit exceeded', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'ACTIVE', plan_id: 'SOLO_BUILDER' } });
      chain.then = vi.fn((cb: any) => cb({ count: 25, error: null }));

      const limit = await EntitlementService.checkWorkerLimit(mockSupabase, 'ws-1');
      expect(limit.allowed).toBe(false);
    });
  });

  describe('9-14. Subscription States & Transitions', () => {
    it('should provision default subscription if none exists', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: null });
      chain.single.mockResolvedValue({ data: { id: 'sub-1', plan_id: 'SOLO_BUILDER', status: 'ACTIVE' } });

      const sub = await SubscriptionService.getWorkspaceSubscription(mockSupabase, 'ws-new');
      expect(sub.status).toBe('ACTIVE');
      expect(sub.plan_id).toBe('SOLO_BUILDER');
    });

    it('cancellation sets cancel_at_period_end', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { id: 'sub-1', status: 'ACTIVE', plan_id: 'SOLO_BUILDER' } });
      chain.single.mockResolvedValue({ data: { id: 'sub-1', cancel_at_period_end: true } });

      const sub = await SubscriptionService.cancelSubscription(mockSupabase, 'ws-1', 'user-1');
      expect(sub.cancel_at_period_end).toBe(true);
    });

    it('reactivation unsets cancel_at_period_end', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { id: 'sub-1', status: 'ACTIVE', cancel_at_period_end: true, plan_id: 'SOLO_BUILDER' } });
      chain.single.mockResolvedValue({ data: { id: 'sub-1', cancel_at_period_end: false } });

      const sub = await SubscriptionService.reactivateSubscription(mockSupabase, 'ws-1', 'user-1');
      expect(sub.cancel_at_period_end).toBe(false);
    });
  });

  describe('17-22. Usage Service & Idempotency', () => {
    it('getUsageSnapshot combines worker count and missions count', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'ACTIVE', plan_id: 'SOLO_BUILDER', current_period_start: '2026-01-01', current_period_end: '2026-02-01' } });
      
      // Simulate counts returning 10
      chain.then = vi.fn((cb: any) => cb({ count: 10, error: null }));

      const usage = await UsageService.getUsageSnapshot(mockSupabase, 'ws-1');
      expect(usage.metrics.workers.limit).toBe(25);
      expect(usage.metrics.workers.current).toBe(10);
      expect(usage.metrics.missions.current).toBe(10);
    });

    it('records usage idempotently', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'ACTIVE', plan_id: 'SOLO_BUILDER' } });
      // Supabase insert returns an object that can be awaited directly
      chain.insert.mockResolvedValue({ error: null });

      const result = await UsageService.recordUsage(mockSupabase, 'ws-1', 'AI_USAGE', 100, 'req-id-123');
      expect(result).toBe(true);
    });

    it('handles duplicate idempotency keys safely', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'ACTIVE', plan_id: 'SOLO_BUILDER' } });
      chain.insert.mockResolvedValue({ error: { code: '23505' } });

      const result = await UsageService.recordUsage(mockSupabase, 'ws-1', 'AI_USAGE', 100, 'req-id-123');
      expect(result).toBe(true);
    });
  });

  describe('26-27. Expired and Past Due Behavior', () => {
    it('PAST_DUE allows access with reason', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'PAST_DUE' } });
      const access = await SubscriptionService.checkAccessPolicy(mockSupabase, 'ws-1');
      expect(access.allowed).toBe(true);
      expect(access.reason).toContain('past due');
    });

    it('EXPIRED denies access', async () => {
      const chain = mockSupabase.from();
      chain.maybeSingle.mockResolvedValue({ data: { status: 'EXPIRED' } });
      const access = await SubscriptionService.checkAccessPolicy(mockSupabase, 'ws-1');
      expect(access.allowed).toBe(false);
    });
  });
});

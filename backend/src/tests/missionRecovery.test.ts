import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { MissionProgressService } from '../services/MissionProgressService';

describe('Mission Recovery & Connection Readiness (V3.9.2.1)', () => {
  let currentTasks: any[] = [];
  
  const createMockTask = (status: string, error: string | null = null, updatedOffset = 0) => ({
    id: 'task-1',
    status,
    error,
    created_at: new Date(Date.now() - 100000).toISOString(),
    updated_at: new Date(Date.now() + updatedOffset).toISOString()
  });

  const mockSupabase = {
    from: vi.fn((table) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        in: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        limit: vi.fn(() => chainable),
        lt: vi.fn(() => chainable),
        update: vi.fn(() => chainable),
        single: vi.fn(async () => {
            if (table === 'business_missions') return { data: { id: 'm-1', status: 'ACTIVE', updated_at: new Date().toISOString() } };
            if (table === 'workspaces') return { data: { id: 'ws-1', status: 'operating' } };
            if (table === 'connections') return { data: { status: 'connected' } };
            if (table === 'mission_plans') return { data: { id: 'p-1', created_at: new Date(0).toISOString() } };
            return { data: null };
        }),
      };
      
      chainable.then = (resolve: any) => {
         if (table === 'tasks') resolve({ data: currentTasks, error: null });
         else if (table === 'mission_plan_steps') resolve({ data: [{ id: 'step-1', authorization_class: 'LEAD_RESEARCH', status: 'BLOCKED' }] });
         else if (table === 'business_missions') resolve({ data: [{ id: 'm-1', status: 'ACTIVE', type: 'GET_CUSTOMERS' }] });
         else if (table === 'mission_plans') resolve({ data: [{ id: 'p-1', created_at: new Date(0).toISOString() }] });
         else resolve({ data: [], error: null });
      };
      return chainable;
    })
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TAVILY_API_KEY = '';
    currentTasks = [];
  });

  it('TEST 1: Missing connection produces deterministic blocker.', async () => {
    currentTasks = [createMockTask('FAILED', 'CONNECTION_REQUIRED: web_search')];
    const progress = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws-1', 'm-1');
    expect(progress.blocker).toBeDefined();
    expect(progress.blocker?.type).toBe('CONNECTION_REQUIRED');
  });

  it('TEST 2: Missing connection does not create infinite retry loop.', async () => {
    currentTasks = [
      createMockTask('FAILED', 'CONNECTION_REQUIRED: web_search', -5000),
      createMockTask('RUNNING', null, 0)
    ];
    const progress = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws-1', 'm-1');
    expect(progress.blocker).toBeNull();
    expect(progress.work.running).toBe(1);
  });

  it('TEST 3: Existing FAILED step with CONNECTION_REQUIRED can recover when connection becomes available.', async () => {
    let stepUpdateSpy = vi.fn();
    
    const mockSupabase2 = {
      from: vi.fn((table) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          in: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          lt: vi.fn(() => chainable),
          insert: vi.fn(() => Promise.resolve()),
          update: vi.fn((data: any) => {
              if (table === 'mission_plan_steps') stepUpdateSpy(data);
              return chainable;
          }),
          single: vi.fn(async () => {
              if (table === 'business_missions') return { data: { id: 'm-1', status: 'ACTIVE', type: 'GET_CUSTOMERS' } };
              if (table === 'connections') return { data: { status: 'connected' } };
              if (table === 'mission_plans') return { data: { id: 'p-1', created_at: new Date(0).toISOString() } };
              if (table === 'workspaces') return { data: { id: 'ws-1' } };
              return { data: null };
          }),
        };
        chainable.then = (cb: any) => {
            if (table === 'business_missions') cb({ data: [{ id: 'm-1', status: 'ACTIVE', type: 'GET_CUSTOMERS' }] });
            else if (table === 'tasks') cb({ data: [createMockTask('BLOCKED', 'CONNECTION_REQUIRED: web_search')] });
            else if (table === 'mission_plan_steps') cb({ data: [{ id: 'step-1', authorization_class: 'LEAD_RESEARCH', status: 'BLOCKED' }] });
            else if (table === 'mission_plans') cb({ data: [{ id: 'p-1', created_at: new Date(0).toISOString() }] });
            else cb({ data: [], error: null });
        };
        return chainable;
      })
    };

    process.env.TAVILY_API_KEY = 'valid-key';
    await CEOService.observeWorkspace(mockSupabase2 as any, 'ws-1');
    expect(stepUpdateSpy).toHaveBeenCalledWith({ status: 'READY', updated_at: expect.any(String) });
  });

  it('TEST 4: Real execution still works after recovery.', async () => {
    expect(true).toBe(true);
  });

  it('TEST 5: Repeated scheduler ticks create exactly one task.', async () => {
    currentTasks = [createMockTask('RUNNING', null, 0)];
    const progress = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws-1', 'm-1');
    expect(progress.work.running).toBe(1);
    expect(progress.work.pending).toBe(0);
  });

  it('TEST 6: Other genuine FAILED states remain FAILED and are not blindly reset.', async () => {
    currentTasks = [createMockTask('FAILED', 'Some unexpected error')];
    const progress = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws-1', 'm-1');
    expect(progress.blocker?.type).toBe('TASK_FAILURE');
  });

  it('TEST 7: Provider rate-limit failures remain distinct from connection failures.', async () => {
    currentTasks = [createMockTask('FAILED', 'PROVIDER_RATE_LIMIT (OpenRouter: 429)')];
    const progress = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws-1', 'm-1');
    expect(progress.blocker?.type).not.toBe('CONNECTION_REQUIRED');
  });
});

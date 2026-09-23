import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CEOService } from '../services/CEOService';

describe('CEOService Mission Orchestration Hook-in', () => {
  let mockSupabase: any;
  let updateCalls: any[] = [];
  let insertCalls: any[] = [];
  let runCalls: any[] = [];

  beforeEach(() => {
    updateCalls = [];
    insertCalls = [];
    runCalls = [];
    
    // Mock CEOService.run to track bounded work creation
    vi.spyOn(CEOService, 'run').mockImplementation(async (...args: any[]) => {
       runCalls.push(args);
       return {} as any;
    });

    const createQueryChain = (dataToReturn: any) => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        neq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: Array.isArray(dataToReturn) ? dataToReturn[0] : dataToReturn, error: null })),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        update: vi.fn((args: any) => {
          updateCalls.push(args);
          return chain;
        }),
        insert: vi.fn((args: any) => {
          insertCalls.push(args);
          return chain;
        }),
        then: (resolve: any) => resolve({ data: dataToReturn, error: null })
      };
      return chain;
    };

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ id: 'ws1', status: 'operating' });
        if (table === 'business_missions') {
           // We will override this per test
           return createQueryChain([]);
        }
        if (table === 'tasks') return createQueryChain([]);
        if (table === 'mission_results') return createQueryChain([]);
        if (table === 'approvals') return createQueryChain([]);
        return createQueryChain(null);
      })
    };
  });

  const setupState = (mission: any, tasks: any[], results: any[], approvals: any[] = []) => {
    mockSupabase.from = vi.fn((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
           select: vi.fn(() => chain),
           eq: vi.fn(() => chain),
           neq: vi.fn(() => chain),
           in: vi.fn(() => chain),
           single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
           order: vi.fn(() => chain),
           limit: vi.fn(() => chain),
           update: vi.fn((args: any) => { updateCalls.push({table, args}); return chain; }),
           insert: vi.fn((args: any) => { insertCalls.push({table, args}); return chain; }),
           then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };

      if (table === 'workspaces') return createChain([{ id: 'ws1', status: 'operating' }]);
      if (table === 'business_missions') return createChain([mission]);
      if (table === 'tasks') return createChain(tasks);
      if (table === 'mission_results') return createChain(results);
      if (table === 'approvals') return createChain(approvals); if (table === 'mission_plans') return createChain([{id: 'p1', status: 'ACTIVE'}]); if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: 'PENDING'}]);
      return createChain([]);
    });
  };

  test('ACTIVE mission with 0/25 verified -> creates ONE bounded LEAD_RESEARCH task', async () => {
    setupState({ id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 }, [], []);
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    
    expect(runCalls.length).toBe(1);
    expect(runCalls[0][2]).toBe('SCHEDULED_OBSERVATION:LEAD_RESEARCH');
    expect(runCalls[0][6]).toBe('m1'); // missionId
  });

  test('ACTIVE mission with pending/running task -> prevents duplicate work', async () => {
    setupState(
      { id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [{ id: 't1', status: 'RUNNING', mission_id: 'm1' }],
      []
    );
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    
    expect(runCalls.length).toBe(0); // No duplicate tasks!
  });

  test('completionEligible (25/25 verified) prevents new work and marks mission COMPLETED', async () => {
    setupState(
      { id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      Array(25).fill({ verification_status: 'VERIFIED' })
    );
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    
    expect(runCalls.length).toBe(0); // No new work
    // Ensure mission was updated to COMPLETED
    const missionUpdate = updateCalls.find(c => c.table === 'business_missions' && c.args.status === 'COMPLETED');
    expect(missionUpdate).toBeDefined();
    
    // Ensure event was logged
    const eventInsert = insertCalls.find(c => c.table === 'mission_events' && c.args.event_type === 'STATUS_CHANGED');
    expect(eventInsert).toBeDefined();
  });

  test('Blocked mission (CONNECTION_REQUIRED) receives no new work', async () => {
    setupState(
      { id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [{ id: 't1', status: 'FAILED', mission_id: 'm1', error: 'CONNECTION_NOT_FOUND', updated_at: new Date().toISOString() }],
      []
    );
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    expect(runCalls.length).toBe(0); // Blocked, no new tasks
  });

  test('Paused mission receives no new work', async () => {
    setupState({ id: 'm1', workspace_id: 'ws1', status: 'PAUSED', type: 'GET_CUSTOMERS', target_count: 25 }, [], []);
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    expect(runCalls.length).toBe(0);
  });
  
  test('Integration Loop Scenario: Rapid scheduler ticks are idempotent', async () => {
    // 1st tick: 0 verified, no tasks -> creates task
    setupState({ id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 }, [], []);
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    expect(runCalls.length).toBe(1);

    // 2nd tick (simulating rapid tick where task is now PENDING)
    setupState({ id: 'm1', workspace_id: 'ws1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 }, [{ id: 't1', status: 'PENDING', mission_id: 'm1' }], []);
    await CEOService.observeWorkspace(mockSupabase, 'ws1');
    expect(runCalls.length).toBe(1); // STILL 1 (no new task created)
  });
});


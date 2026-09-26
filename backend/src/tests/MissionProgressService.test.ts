import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MissionProgressService } from '../services/MissionProgressService';

describe('MissionProgressService', () => {
  let mockSupabase: any;
  let currentMission: any;
  let currentTasks: any;
  let currentResults: any;
  let currentApprovals: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn((table: string) => {
        const queryObj: any = {
          select: vi.fn(() => queryObj),
          eq: vi.fn(() => queryObj),
          in: vi.fn(() => queryObj),
          order: vi.fn(() => queryObj),
          limit: vi.fn(() => queryObj),
          single: vi.fn(async () => {
             if (table === 'business_missions') return { data: currentMission, error: null };
             if (table === 'mission_plans') return { data: { created_at: new Date(0).toISOString() }, error: null };
             return { data: null };
          }),
          then: (resolve: any) => {
             if (table === 'tasks') resolve({ data: currentTasks, error: null });
             else if (table === 'mission_results') resolve({ data: currentResults, error: null });
             else if (table === 'approvals') resolve({ data: currentApprovals, error: null });
             else resolve({ data: [], error: null });
          }
        };
        return queryObj;
      })
    };
  });

  const setupMockData = (missionData: any, tasksData: any[], resultsData: any[], approvalsData: any[] = []) => {
     currentMission = missionData;
     currentTasks = tasksData.map(t => ({ ...t, created_at: t.created_at || new Date().toISOString() }));
     currentResults = resultsData;
     currentApprovals = approvalsData;
  };

  test('No target -> progress not measurable', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'CUSTOM', target_count: null },
      [], []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.measurable).toBe(false);
    expect(res.progress.percent).toBeNull();
  });

  test('Target 25 / verified 0 -> 0%', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [], []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.percent).toBe(0);
  });

  test('Target 25 / verified 8 -> 32%', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      Array(8).fill({ verification_status: 'VERIFIED' })
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.percent).toBe(32);
    expect(res.completionEligible).toBe(false);
  });

  test('Target 25 / verified 25 -> 100%', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      Array(25).fill({ verification_status: 'VERIFIED' })
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.percent).toBe(100);
    expect(res.completionEligible).toBe(true);
  });

  test('Target 25 / verified 30 -> 100% (clamped)', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      Array(30).fill({ verification_status: 'VERIFIED' })
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.percent).toBe(100);
    expect(res.completionEligible).toBe(true);
  });

  test('Unverified results do not count', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      [ { verification_status: 'UNVERIFIED' }, { verification_status: 'REJECTED' } ]
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.progress.percent).toBe(0);
    expect(res.results.unverified).toBe(1);
    expect(res.results.rejected).toBe(1);
  });

  test('Running task produces truthful next action', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'RUNNING' } ],
      []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.nextAction).toBe('Waiting for current work to finish.');
  });

  test('Pending approval produces approval blocker', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'PENDING' } ],
      [],
      [ { id: 'a1', status: 'PENDING_APPROVAL', task_id: 't1' } ]
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.blocker?.type).toBe('OWNER_APPROVAL_REQUIRED');
    expect(res.nextAction).toBe('Review pending approvals.');
  });

  test('Connection requirement produces connection blocker', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'FAILED', error: 'CONNECTION_NOT_FOUND: no google token' } ],
      []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.blocker?.type).toBe('CONNECTION_REQUIRED');
    expect(res.nextAction).toBe('Connect required integration.');
  });
  
  test('Completed mission reports final state', async () => {
    setupMockData(
      { status: 'COMPLETED', type: 'GET_CUSTOMERS', target_count: 25 },
      [],
      Array(25).fill({ verification_status: 'VERIFIED' })
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.nextAction).toBe('Mission is completed.');
    expect(res.completionEligible).toBe(true);
  });

  test('Blocked tasks are treated as mostRecentErrorTask and surface a blocker', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'BLOCKED', error: 'No executable capability configured.', updated_at: new Date().toISOString() } ],
      []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.work.blocked).toBe(1);
    expect(res.blocker).not.toBeNull();
    expect(res.blocker?.type).toBe('TASK_FAILURE');
    expect(res.nextAction).toBe('Resolve blocker to continue.');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { WorkforceIntegrityService } from '../services/WorkforceIntegrityService';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';
import { TransformDataAction } from '../workflows/actions/TransformDataAction';
import { CapabilityRegistry } from '../services/CapabilityRegistry';

describe('Mission Orchestrator Stall Regression', () => {
  const createMockSupabase = (captureFns: any = {}, agentsMock: any[] = []) => {
    const chainable = {
      eq: vi.fn(() => chainable),
      neq: vi.fn(() => chainable),
      in: vi.fn(() => chainable),
      order: vi.fn(() => chainable),
      limit: vi.fn(() => chainable),
      single: vi.fn(() => Promise.resolve({ data: { id: 'ws-1' } })),
      select: vi.fn(() => chainable),
      update: vi.fn(() => chainable),
      then: vi.fn((cb) => cb({ data: [] }))
    };

    return {
      from: vi.fn((table) => {
        if (table === 'agents') {
           return {
             select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: agentsMock })) })),
             update: vi.fn(() => chainable)
           };
        }
        return {
          insert: vi.fn((data) => {
            if (table === 'tasks' && captureFns.onTaskInsert) captureFns.onTaskInsert(data);
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'mock-id', ...data } })) })) };
          }),
          update: vi.fn((data) => chainable),
          select: vi.fn(() => chainable)
        };
      })
    } as any;
  };

  beforeEach(() => {
    ActionRegistry.register(new TransformDataAction());
  });

  it('TEST 1 — NO CAPABLE WORKER', async () => {
    let insertedTask: any = null;
    const mockSupabase = createMockSupabase({ onTaskInsert: (t: any) => insertedTask = t }, [{ id: 'a1', name: 'AI CEO' }]);

    vi.spyOn(WorkforceIntegrityService, 'findCapableWorker').mockResolvedValue(null);
    vi.spyOn(WorkforceIntegrityService, 'validateAssignment').mockResolvedValue({
      valid: false,
      status: 'MISSING_CAPABILITY',
      reason: 'No agent has DATA_TRANSFORMATION'
    });

    try {
      await CEOService.run(mockSupabase, 'ws-1', 'SCHEDULED_OBSERVATION:DATA_TRANSFORMATION', 'service_role', undefined, undefined, 'mission-1');
    } catch (e) {}
    
    expect(insertedTask).toBeDefined();
    expect(insertedTask.status).toBe('BLOCKED');
    expect(insertedTask.error).toContain('No agent has DATA_TRANSFORMATION');
  });

  it('TEST 2 — CAPABLE WORKER EXISTS', async () => {
    let insertedTask: any = null;
    
    const mockWorker = { id: 'worker-1', name: 'Builder Analyst', capabilities: ['DATA_TRANSFORMATION'] };
    const mockSupabase = createMockSupabase({ onTaskInsert: (t: any) => insertedTask = t }, [mockWorker]);

    vi.spyOn(WorkforceIntegrityService, 'findCapableWorker').mockResolvedValue(mockWorker);
    vi.spyOn(WorkforceIntegrityService, 'validateAssignment').mockResolvedValue({ valid: true, status: 'VALID', reason: 'ok' } as any);
    vi.spyOn(AuthorizationRegistry, 'authorize').mockReturnValue({ authorized: true, reason: 'ok' } as any);
    
    const executeSpy = vi.spyOn(CEOService, 'executeInlineTask').mockResolvedValue(undefined);

    await CEOService.run(mockSupabase, 'ws-1', 'SCHEDULED_OBSERVATION:DATA_TRANSFORMATION', 'service_role', undefined, undefined, 'mission-1');

    expect(executeSpy).toHaveBeenCalled();
    expect(insertedTask).toBeDefined();
    expect(insertedTask.status).toBe('PENDING'); // Initially pending
    expect(insertedTask.title).toContain('DATA TRANSFORMATION');
  });

  it('TEST 3 — REAL ACTION EXECUTION', async () => {
    const action = ActionRegistry.get('DATA_TRANSFORMATION');
    expect(action).toBeDefined();
    expect(action).toBeInstanceOf(TransformDataAction);

    const result = await action!.execute({
      input: 'hello world',
      operations: [{ type: 'uppercase' }]
    }, {} as any);

    if (!result.success) {
      console.error(result.error);
    }

    expect(result.success).toBe(true);
    expect(result.transformed).toBe('HELLO WORLD');
  });

  it('TEST 4 — CAPABILITY PRESERVATION', () => {
    // Assert that COMPETITIVE_ANALYSIS is still a canonical capability
    expect(CapabilityRegistry.get('COMPETITIVE_ANALYSIS')).toBeDefined();
    // And DATA_TRANSFORMATION is canonical
    expect(CapabilityRegistry.get('DATA_TRANSFORMATION')).toBeDefined();
  });

  it('TEST 5 — DUPLICATE PROTECTION', async () => {
    let insertCount = 0;
    
    const chainable = {
      eq: vi.fn(() => chainable),
      neq: vi.fn(() => chainable),
      in: vi.fn(() => chainable),
      order: vi.fn(() => chainable),
      limit: vi.fn(() => chainable),
      single: vi.fn(() => Promise.resolve({ data: { id: 'ws-1' } })),
      select: vi.fn(() => chainable),
      update: vi.fn(() => chainable),
      then: vi.fn((cb) => cb({ data: [] }))
    };

    // Simulate Postgres throwing unique constraint violation (23505) on second insert
    const insertMock = vi.fn()
      .mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: { id: 'task-1' } }) }) })
      .mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ error: { code: '23505' } }) }) });

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'agents') {
           return {
             select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [{ id: 'worker-1' }] })) })),
             update: vi.fn(() => chainable)
           };
        }
        if (table === 'tasks') return { insert: insertMock, update: vi.fn(() => chainable), select: vi.fn(() => chainable) };
        return { insert: vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: {} }) }) })), update: vi.fn(() => chainable), select: vi.fn(() => chainable) };
      })
    } as any;

    vi.spyOn(WorkforceIntegrityService, 'findCapableWorker').mockResolvedValue({ id: 'worker-1' });
    vi.spyOn(WorkforceIntegrityService, 'validateAssignment').mockResolvedValue({ valid: true, status: 'VALID', reason: 'ok' } as any);
    vi.spyOn(AuthorizationRegistry, 'authorize').mockReturnValue({ authorized: true, reason: 'ok' } as any);
    vi.spyOn(CEOService, 'executeInlineTask').mockResolvedValue(undefined);

    await CEOService.run(mockSupabase, 'ws-1', 'SCHEDULED_OBSERVATION:DATA_TRANSFORMATION', 'service_role', undefined, undefined, 'mission-1');
    await CEOService.run(mockSupabase, 'ws-1', 'SCHEDULED_OBSERVATION:DATA_TRANSFORMATION', 'service_role', undefined, undefined, 'mission-1');

    expect(insertMock).toHaveBeenCalledTimes(2);
  });
});

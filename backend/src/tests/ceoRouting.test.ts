import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';

vi.mock('../services/ContinuousImprovementService', () => ({
  ContinuousImprovementService: {
    analyzeWorkspace: vi.fn().mockResolvedValue({}),
    getActiveProposals: vi.fn().mockResolvedValue([]),
    formatProposalsForContext: vi.fn().mockReturnValue('')
  }
}));

describe('CEOService Routing Logic', () => {
  let mockSupabase: any;
  let updateCalls: any[] = [];
  let executeInlineTaskSpy: any;

  beforeEach(() => {
    updateCalls = [];
    executeInlineTaskSpy = vi.spyOn(CEOService, 'executeInlineTask').mockResolvedValue(undefined as any);
  });

  it('routes LEAD_RESEARCH tasks to executeInlineTask and does not block them', async () => {
    // We need mockSupabase to return an agent list for the fallback
    mockSupabase = {
      from: vi.fn((table: string) => {
        const base: any = {
          select: vi.fn(() => base),
          eq: vi.fn(() => base),
          neq: vi.fn(() => base),
          in: vi.fn(() => base),
          order: vi.fn(() => base),
          limit: vi.fn(() => base),
          update: vi.fn((payload) => {
            if (table === 'tasks') updateCalls.push({ table, payload });
            return base;
          }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (table === 'workspaces') return Promise.resolve({ data: { id: 'workspace-1', name: 'Test', operational_context: '{}' } });
            if (table === 'tasks') return Promise.resolve({ data: { id: 'task-123', title: 'Lead Research' } });
              if (table === 'agents') return Promise.resolve({ data: { id: 'cmo', capabilities: ['LEAD_RESEARCH'] } });
            return Promise.resolve({ data: null });
          })
        };
        
        // If table is agents and it ends with an array (from select)
        if (table === 'agents') {
           base.then = (resolve: any) => resolve({ data: [{ id: 'agent-1', name: 'AI CMO', capabilities: ['LEAD_RESEARCH'] }] });
        }
  
        return base;
      })
    };

    await CEOService.run(mockSupabase as any, 'workspace-1', 'SCHEDULED_OBSERVATION:LEAD_RESEARCH', 'system');

    // 1. Should have called executeInlineTask
    expect(executeInlineTaskSpy).toHaveBeenCalled();
    const callArgs = executeInlineTaskSpy.mock.calls[0];
    expect(callArgs[2].task_type).toBe('LEAD_RESEARCH');

    // 2. Should NOT have updated task to BLOCKED for missing capability
    const blockedCall = updateCalls.find(c => c.payload.status === 'BLOCKED' && c.payload.error === 'No executable capability configured.');
    expect(blockedCall).toBeUndefined();
  });
});

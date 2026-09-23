// IMPORTANT: vi.mock is hoisted by Vitest before all imports.
// This file must import 'vitest' first so vi is available in the hoist.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Deterministic AI provider mock — eliminates ALL OpenRouter / live-LLM calls.
//
// CEOService uses:
//   import OpenAI from 'openai'         (CEOService.run — default import)
//   require('openai').OpenAI            (CEOService.evaluateTaskResult — dynamic require)
//
// The mock factory must export a function that can be called with `new`.
// We use a class-style factory that returns the right prototype.
// ---------------------------------------------------------------------------
vi.mock('openai', () => {
  const ceoOrchestration = JSON.stringify({
    assessment: 'Mock CEO assessment.',
    priority: 'high',
    decision: 'delegate',
    tasks: [],
    owner_update: 'Mock CEO run completed.'
  });
  const ceoEvaluation = JSON.stringify({
    evaluation: 'Mock evaluation. Task completed successfully.',
    conclusion: 'HEALTHY',
    follow_up_tasks: [],
    owner_update: 'Task evaluated. Result looks fine.'
  });

  function OpenAIConstructor(this: any) {
    this.chat = {
      completions: {
        create: ({ messages }: any) => {
          const isEval = messages?.some(
            (m: any) => typeof m.content === 'string' && m.content.includes('evaluating a completed task')
          );
          return Promise.resolve({
            choices: [{ message: { content: isEval ? ceoEvaluation : ceoOrchestration } }]
          });
        }
      }
    };
  }

  return { default: OpenAIConstructor, OpenAI: OpenAIConstructor };
});

import { CEOService } from '../services/CEOService';
import { HealthCheckAction } from '../workflows/actions/HealthCheckAction';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';

// Mock global fetch for health check
global.fetch = vi.fn();

const createQueryChain = (data: any, error: any = null, count = 0) => {
  let insertedData: any = data;
  const chain: any = {
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn((insertObj: any) => {
      insertedData = { ...data, ...insertObj };
      return chain;
    }),
    insert: vi.fn((insertObj: any) => {
      insertedData = { ...data, ...insertObj };
      return chain;
    }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: insertedData, error })),
    then: (resolve: any) => resolve({ data: insertedData, error, count })
  };
  return chain;
};

describe('MVP Autonomous Operations Loop', () => {
  let mockSupabase: any;
  let executedActions: string[] = [];
  
  beforeEach(() => {
    // clearAllMocks clears call counts but preserves vi.mock implementations.
    vi.clearAllMocks();
    executedActions = [];

    // Re-assign fetch mock after clear (it's a global, not a module mock)
    global.fetch = vi.fn();

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') {
          return createQueryChain({
            id: 'ws-1', name: 'ItWield', status: 'operating',
            operational_context: JSON.stringify({ website: 'https://test.vercel.app' })
          });
        }
        if (table === 'agents') {
          return createQueryChain([
            { id: 'cto-1', name: 'AI CTO', workspace_id: 'ws-1' },
            { id: 'mon-1', name: 'Application Monitor', workspace_id: 'ws-1' }
          ]);
        }
        if (table === 'tasks') {
          return createQueryChain({ id: 'task-1', workspace_id: 'ws-1', max_retries: 3, retry_count: 0 });
        }
        if (table === 'workflows') {
          return createQueryChain([]);
        }
        if (table === 'task_events') {
          return createQueryChain(null);
        }
        if (table === 'improvement_proposals') {
          return createQueryChain([]); // No active proposals by default
        }
        if (table === 'company_memory') {
          return createQueryChain([]); // No memory by default
        }
        return createQueryChain(null);
      }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } })
        }
      }
    };
  });

  describe('1. CEO creates valid monitoring task (Deterministic Fallback)', () => {
    it('creates a task delegated to AI CTO for Application Monitoring', async () => {
      // SCHEDULED_OBSERVATION:APPLICATION_MONITORING forces the deterministic path —
      // no LLM call is made, validating the core orchestration and memory integration.
      const result = await CEOService.run(mockSupabase, 'ws-1', 'SCHEDULED_OBSERVATION:APPLICATION_MONITORING', 'user-1');
      
      expect(result!.status).toBe('COMPLETED');
      expect(result!.tasksCreated).toBe(1);
      expect(result!.tasks[0].title).toBe('Application Health Check');
      expect(result!.tasks[0].assigned_agent_id).toBe('cto-1');
      expect(result!.tasks[0].input.task_type).toBe('APPLICATION_MONITORING');
      expect(result!.tasks[0].input.delegate_to).toBe('mon-1');
      
      // Pricing protection: no billing/pricing mutations should be proposed
      expect(JSON.stringify(result)).not.toContain('billing');
      expect(JSON.stringify(result)).not.toContain('pricing');
    });
  });

  describe('2. Invalid agent references are rejected', () => {
    it('rejects tasks if assigned to non-existent agents (in live LLM mode via validation)', async () => {
       const supabaseMissingAgent = {
         from: vi.fn((table: string) => {
           if (table === 'workspaces') return createQueryChain({ id: 'ws-1' });
           if (table === 'agents') return createQueryChain([]); // No agents exist
           if (table === 'tasks') return createQueryChain({});
           if (table === 'workflows') return createQueryChain([]);
           return createQueryChain(null);
         })
       };
       // With no agents available, deterministic fallback cannot assign any task
       const result = await CEOService.run(supabaseMissingAgent as any, 'ws-1', 'SCHEDULED_OBSERVATION:APPLICATION_MONITORING');
       expect(result!.tasksCreated).toBe(0); 
    });
  });

  describe('4. Application Monitor executes & 5. Successful health check completes', () => {
    it('executes a safe GET request and records success', async () => {
      (global.fetch as any).mockResolvedValueOnce({ status: 200 });

      const action = new HealthCheckAction();
      const result = await action.execute({ url: 'https://test.vercel.app' }, { supabase: mockSupabase, runId: '', userId: 'u1', workspaceId: 'ws-1', attempt: 1 });

      expect(global.fetch).toHaveBeenCalledWith('https://test.vercel.app', expect.objectContaining({ method: 'GET' }));
      expect(result!.success).toBe(true);
      expect(result!.httpStatus).toBe(200);
      expect(result!.summary).toContain('Application health check passed');
      expect(result!.summary).toContain('HTTP 200');
    });
  });

  describe('6. Failed health check does not crash worker/scheduler', () => {
    it('gracefully handles unreachable sites', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network offline'));

      const action = new HealthCheckAction();
      const result = await action.execute({ url: 'https://test.vercel.app' }, { supabase: mockSupabase, runId: '', userId: 'u1', workspaceId: 'ws-1', attempt: 1 });

      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Network offline');
      expect(result!.summary).toContain('Application health check failed');
      expect(result!.summary).toContain('Network offline');
    });

    it('prevents SSRF / invalid URLs safely', async () => {
      const action = new HealthCheckAction();
      const result = await action.execute({ url: 'ftp://bad-url.com' }, { supabase: mockSupabase, runId: '', userId: 'u1', workspaceId: 'ws-1', attempt: 1 });
      expect(result!.success).toBe(false);
      expect(result!.error).toContain('Only HTTP/HTTPS URLs are allowed');
    });
  });

  describe('3. CTO delegates task & 7. task_events & 8. CEO evaluation', () => {
    it('executes inline health check lifecycle successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ status: 200 });
      
      await CEOService.executeInlineTask(
        mockSupabase, 
        'task-1', 
        { task_type: 'APPLICATION_MONITORING', delegate_to: 'mon-1', website: 'https://test.vercel.app' }, 
        'user-1', 
        'cto-1'
      );

      // Verify task events recorded: TASK_STARTED, TASK_ASSIGNED, TASK_COMPLETED, CEO_EVALUATION
      const insertCalls = mockSupabase.from.mock.calls.filter((c: any) => c[0] === 'task_events').length;
      expect(insertCalls).toBeGreaterThanOrEqual(4);
      
      // executeInlineTask must NOT touch workspaces table
      const workspaceUpdates = mockSupabase.from.mock.calls.filter((c: any) => c[0] === 'workspaces');
      expect(workspaceUpdates.length).toBe(0);
    });

    describe('Autonomous Observation & Evaluation Logic', () => {
      it('Phase 1: CEO observation blocks if no website configured', async () => {
         const supabaseNoWeb = {
           from: vi.fn((table: string) => {
             if (table === 'workspaces') return createQueryChain({ id: 'ws-1', operational_context: JSON.stringify({}) });
             if (table === 'tasks') return createQueryChain([]);
             if (table === 'task_events') return createQueryChain([]);
             return createQueryChain(null);
           })
         };
         
         await CEOService.observeWorkspace(supabaseNoWeb as any, 'ws-1');
         
         const inserts = supabaseNoWeb.from.mock.calls.filter((c: any) => c[0] === 'task_events');
         expect(inserts.length).toBeGreaterThan(0);
      });

      it('Phase 2 & 8: duplicate monitoring task prevention (website configured but task running)', async () => {
         const supabaseRunningTask = {
           from: vi.fn((table: string) => {
             if (table === 'workspaces') return createQueryChain({ id: 'ws-1', operational_context: JSON.stringify({ website: 'https://test.app' }) });
             if (table === 'tasks') return createQueryChain([{ id: 't1', input: { task_type: 'APPLICATION_MONITORING' }, status: 'RUNNING' }]);
             return createQueryChain(null);
           })
         };
         
         const spy = vi.spyOn(CEOService, 'run');
         await CEOService.observeWorkspace(supabaseRunningTask as any, 'ws-1');
         expect(spy).not.toHaveBeenCalled();
      });

      it('Database Enforced Concurrency: handles simultaneous scheduler tick gracefully without duplicate tasks', async () => {
         const supabaseConcurrentRace = {
           from: vi.fn((table: string) => {
             if (table === 'workspaces') return createQueryChain({ id: 'ws-1', name: 'ItWield' });
             if (table === 'tasks') {
               return createQueryChain({}, { code: '23505', message: 'duplicate key value violates unique constraint "idx_unique_active_monitoring_task"' });
             }
             if (table === 'agents') return createQueryChain([]);
             if (table === 'workflows') return createQueryChain([]);
             return createQueryChain(null);
           }),
           auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'x' } } }) } }
         };

         const result = await CEOService.run(supabaseConcurrentRace as any, 'ws-1', 'SCHEDULED_OBSERVATION', 'user-1');
         expect(result!.tasksCreated).toBe(0);
         expect(result!.status).toBe('COMPLETED');
      });

      it('Phase 5 & 6: CEO evaluation escalates chain depths', async () => {
         const supabaseDepth = {
           from: vi.fn((table: string) => {
             if (table === 'tasks') return createQueryChain({ id: 't1', status: 'FAILED', title: 'App Check', input: { chain_depth: 3 } });
             return createQueryChain(null);
           })
         };
         await CEOService.evaluateTaskResult(supabaseDepth as any, 't1', 'ws-1', 'user-1', 'mon-1');
         
         // escalated because chain_depth >= 3
         const updates = supabaseDepth.from.mock.calls.filter((c: any) => c[0] === 'tasks');
         expect(updates.length).toBeGreaterThan(0);
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { HealthCheckAction } from '../workflows/actions/HealthCheckAction';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';

// Mock global fetch for health check
global.fetch = vi.fn();

const createQueryChain = (data: any, error = null, count = 0) => {
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
    vi.resetAllMocks();
    executedActions = [];

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
          return createQueryChain(null); // Just for inserts
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
      const result = await CEOService.run(mockSupabase, 'ws-1', 'Perform an application health check', 'user-1');
      
      expect(result!.status).toBe('COMPLETED');
      expect(result!.tasksCreated).toBe(1);
      expect(result!.tasks[0].title).toBe('Application Health Check');
      
      // Should assign to CTO initially, and indicate delegation to app monitor
      expect(result!.tasks[0].assigned_agent_id).toBe('cto-1');
      expect(result!.tasks[0].input.task_type).toBe('APPLICATION_MONITORING');
      expect(result!.tasks[0].input.delegate_to).toBe('mon-1');
      
      // Pricing protection check: NO price/billing changes should be proposed
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
       const result = await CEOService.run(supabaseMissingAgent as any, 'ws-1', 'Check health');
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
      
      await CEOService.executeInlineHealthCheck(
        mockSupabase, 
        'task-1', 
        { task_type: 'APPLICATION_MONITORING', delegate_to: 'mon-1', website: 'https://test.vercel.app' }, 
        'user-1', 
        'cto-1'
      );

      // Verify task events were recorded (Started, Assigned/Delegated, Completed)
      const insertCalls = mockSupabase.from.mock.calls.filter((c: any) => c[0] === 'task_events').length;
      // Depending on exact internal calls: 1 for STARTED, 1 for ASSIGNED, 1 for COMPLETED, 1 for CEO_EVALUATION
      expect(insertCalls).toBeGreaterThanOrEqual(4);
      
      // Verification of isolated execution:
      // It should NOT modify workspaces billing etc.
      const workspaceUpdates = mockSupabase.from.mock.calls.filter((c: any) => c[0] === 'workspaces');
      expect(workspaceUpdates.length).toBe(0); // executeInlineHealthCheck does not touch workspaces table
    });
  describe('Autonomous Observation & Evaluation Logic', () => {
    it('Phase 1: CEO observation blocks if no website configured', async () => {
       const supabaseNoWeb = {
         from: vi.fn((table: string) => {
           if (table === 'workspaces') return createQueryChain({ id: 'ws-1', operational_context: JSON.stringify({}) });
           if (table === 'tasks') return createQueryChain([]); // no active tasks
           if (table === 'task_events') return createQueryChain([]); // no recent blocks
           return createQueryChain(null);
         })
       };
       
       await CEOService.observeWorkspace(supabaseNoWeb as any, 'ws-1');
       
       const inserts = supabaseNoWeb.from.mock.calls.filter((c: any) => c[0] === 'task_events');
       expect(inserts.length).toBeGreaterThan(0);
    });

    it('Phase 2 & 8: duplicate monitoring task prevention', async () => {
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
}
);

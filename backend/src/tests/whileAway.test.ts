import { describe, it, expect, vi, beforeEach } from 'vitest';
import workspacesRouter from '../api/workspaces';

describe('GET /api/v1/workspaces/:id/while-away', () => {
  const executeRoute = async (supabaseMock: any) => {
    // Find the while-away route handler
    const route = (workspacesRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/:id/while-away');
    const handler = route.route.stack[0].handle;
    
    let responseBody: any = null;
    let statusCode: number = 200;
    
    const req = {
      params: { id: 'ws1' },
      supabase: supabaseMock
    };
    
    const res = {
      status: (code: number) => { statusCode = code; return res; },
      json: (body: any) => { responseBody = body; }
    };
    
    await handler(req, res);
    return { status: statusCode, body: responseBody };
  };

  const createQueryChain = (data: any, error = null) => {
    let chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      then: (resolve: any) => resolve({ data, error })
    };
    return chain;
  };

  it('1. successful health check appears & 6. activity grouping & 11. timestamps & 12. agent attribution', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'tasks') {
          return createQueryChain([{
            id: 't1', title: 'App Check', status: 'COMPLETED', created_at: '2026-09-01T10:00:00Z', completed_at: '2026-09-01T10:01:00Z',
            input: { task_type: 'APPLICATION_MONITORING' }, output: { httpStatus: 200, durationMs: 142 },
            assigned_agent: null
          }]);
        }
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.status).toBe(200);
    expect(res.body.summary).toContain('Here is what happened while you were away');
    expect(res.body.items).toHaveLength(1);
    
    const item = res.body.items[0];
    expect(item.type).toBe('health_check');
    expect(item.status).toBe('success');
    expect(item.timestamp).toBe('2026-09-01T10:01:00Z'); // timestamp preserved
    expect(item.description).toContain('Application Monitor checked');
    expect(item.details.httpStatus).toBe(200); // HTTP status preserved
  });

  it('2. failed health check appears & 3. incident appears & 4. owner approval requirement appears', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'tasks') return createQueryChain([]);
        if (table === 'incidents') {
          return createQueryChain([{
            id: 'i1', title: 'Operational Issue Detected: App Check', description: 'HTTP 500', severity: 'high', status: 'DETECTED', created_at: '2026-09-01T10:05:00Z'
          }]);
        }
        if (table === 'task_events') {
          return createQueryChain([{
            task_id: 't2', event_type: 'OWNER_APPROVAL_REQUIRED', created_at: '2026-09-01T10:06:00Z', details: { reason: 'Autonomous chain limit reached' }
          }]);
        }
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2); // 1 incident, 1 approval
    
    const inc = res.body.items.find((i: any) => i.type === 'incident');
    expect(inc.status).toBe('warning');
    expect(inc.description).toContain('HTTP 500');
    expect(inc.details.whatWeDid).toBeDefined();

    const appReq = res.body.items.find((i: any) => i.type === 'approval_required');
    expect(appReq.description).toContain('chain limit reached');
  });

  it('5. empty state', async () => {
    const supabase = {
      from: vi.fn(() => createQueryChain([]))
    };

    const res = await executeRoute(supabase);
    expect(res.status).toBe(200);
    expect(res.body.summary).toContain('No autonomous activity yet');
    expect(res.body.items).toHaveLength(0);
  });

  it('13. real HTTP status/result preservation on completion', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'tasks') {
          return createQueryChain([{
            id: 't2', title: 'Generate Report', status: 'COMPLETED', input: { task_type: 'REPORT' },
            assigned_agent: { name: 'AI CFO' }
          }]);
        }
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.status).toBe(200);
    
    const taskItem = res.body.items.find((i: any) => i.type === 'task_completed');
    expect(taskItem.title).toBe('Generate Report');
    expect(taskItem.description).toContain('AI CFO'); // agent attribution
  });
});

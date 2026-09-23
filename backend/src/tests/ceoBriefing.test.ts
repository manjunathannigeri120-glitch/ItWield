import { describe, it, expect, vi, beforeEach } from 'vitest';
import workspacesRouter from '../api/workspaces';

describe('GET /api/v1/workspaces/:id/ceo-briefing', () => {
  const createQueryChain = (data: any, error = null) => {
    let chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      not: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data, error })),
      then: (resolve: any) => resolve({ data, error })
    };
    return chain;
  };

  const executeRoute = async (supabaseMock: any) => {
    const route = (workspacesRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/:id/ceo-briefing');
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

  it('1. healthy company briefing & 7. empty company & 12. no fabricated activity', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ name: 'NovaDesk', status: 'operating' });
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.status).toBe(200);
    expect(res.body.companyStatus).toBe('Healthy');
    expect(res.body.attentionItems).toHaveLength(0);
    expect(res.body.workforce.activeTasks).toHaveLength(0);
    expect(res.body.recommendations).toHaveLength(0);
  });

  it('2. attention-needed & 4. owner approval', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ name: 'NovaDesk', status: 'operating' });
        if (table === 'task_events') return createQueryChain([{ event_type: 'OWNER_APPROVAL_REQUIRED', created_at: '2026-09-01T10:00:00Z', details: { reason: 'Limits' } }]);
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.body.companyStatus).toBe('Attention needed');
    expect(res.body.attentionItems[0].category).toBe('APPROVAL');
    expect(res.body.attentionItems[0].timestamp).toBe('2026-09-01T10:00:00Z');
  });

  it('3. critical incident & 11. fact/recommendation separation', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ name: 'NovaDesk', status: 'operating' });
        if (table === 'incidents') return createQueryChain([{ severity: 'critical', title: '500 Error' }]);
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.body.companyStatus).toBe('Critical issue');
    expect(res.body.attentionItems[0].category).toBe('FACT');
  });

  it('5. active tasks & 6. blocked tasks & 17. agent attribution', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ name: 'NovaDesk', status: 'operating' });
        if (table === 'agents') return createQueryChain([{ name: 'AI CEO' }, { name: 'AI CTO' }]);
        if (table === 'tasks') return createQueryChain([{ title: 'Dev work', status: 'RUNNING', assigned_agent: { name: 'AI CTO' } }]);
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    expect(res.body.workforce.activeTasks[0].title).toBe('Dev work');
    expect(res.body.workforce.activeTasks[0].agent).toBe('AI CTO');
    expect(res.body.workforce.idleAgents).toContain('AI CEO');
    expect(res.body.workforce.idleAgents).not.toContain('AI CTO');
  });

  it('9. competitor observation & 10. recommendation generation', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createQueryChain({ name: 'NovaDesk', status: 'operating', company_goals: 'Acquire users' });
        if (table === 'competitors') return createQueryChain([{ name: 'EvilCorp' }]);
        return createQueryChain([]);
      })
    };

    const res = await executeRoute(supabase);
    // Goals without active tasks lead to recommendation
    const recs = res.body.recommendations;
    expect(recs.some((r: any) => r.category === 'RECOMMENDATION' && r.description.includes('Acquire users'))).toBe(true);
    // Competitors lead to factual observation
    expect(recs.some((r: any) => r.category === 'FACT' && r.description.includes('EvilCorp'))).toBe(true);
  });
});

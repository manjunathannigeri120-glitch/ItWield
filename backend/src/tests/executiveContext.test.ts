import { describe, it, expect, vi } from 'vitest';
import { AgentRuntime } from '../agents/runtime';

describe('Executive Context Injection', () => {
  const mockSupabase: any = {
    from: vi.fn((table: string) => {
      if (table === 'workspaces') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  name: 'TestCorp',
                  operational_context: JSON.stringify({
                    industry: 'Tech',
                    competitors: 'RivalInc'
                  })
                }
              })
            })
          })
        };
      }
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                order: () => ({
                  limit: () => Promise.resolve({
                    data: [
                      { status: 'RUNNING', title: 'Fix Auth', description: 'Fix auth bug' }
                    ]
                  })
                })
              })
            })
          })
        };
      }
      return { select: vi.fn() };
    })
  };

  it('builds CEO identity correctly', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(mockSupabase, { role: 'CEO', name: 'AI CEO', workspace_id: 'ws-1' });
    expect(prompt).toContain('As AI CEO, your primary responsibility is company-wide coordination');
    expect(prompt).toContain('TestCorp');
    expect(prompt).toContain('RivalInc');
    expect(prompt).toContain('[RUNNING] Fix Auth: Fix auth bug');
    expect(prompt).toContain('PRICING PROTECTION [CRITICAL]');
    expect(prompt).toContain('DO NOT invent completed work');
  });

  it('builds CFO identity correctly', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(null, { role: 'CFO', name: 'AI CFO' });
    expect(prompt).toContain('As AI CFO, your focus is on financial information');
    expect(prompt).toContain('You MUST NOT perform financial actions without owner approval');
    expect(prompt).toContain('No active tasks found');
    expect(prompt).toContain('PRICING PROTECTION [CRITICAL]');
  });

  it('builds CTO identity correctly', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(null, { role: 'CTO', name: 'AI CTO' });
    expect(prompt).toContain('As AI CTO, your focus is on application health, technical issues');
  });

  it('builds CMO identity correctly', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(null, { role: 'CMO', name: 'AI CMO' });
    expect(prompt).toContain('As AI CMO, your focus is on customers, acquisition, marketing');
  });

  it('includes base system prompt if available', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(null, { role: 'CEO', name: 'AI CEO', system_prompt: 'Base prompt.' });
    expect(prompt).toContain('Base prompt.');
  });
});

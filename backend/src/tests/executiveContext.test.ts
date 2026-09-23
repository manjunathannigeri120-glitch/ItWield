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
    expect(prompt).toContain('Do not invent activity');
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

  it('prevents generic refusal for CTO with zero tasks and full company context', async () => {
    const ctoSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    name: 'NovaDesk AI',
                    operational_context: JSON.stringify({
                      industry: 'AI SaaS',
                      competitors: 'Intercom, Zendesk, Freshdesk, Help Scout'
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
                      data: [] // Zero active tasks
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

    const prompt = await AgentRuntime.buildExecutiveContext(ctoSupabase, { role: 'CTO', name: 'AI CTO', workspace_id: 'ws-nova' });
    
    // Explicit directives verification
    expect(prompt).toContain('You are the AI CTO of this specific company.');
    expect(prompt).toContain('You have access to the company context provided below.');
    expect(prompt).toContain('Use only the supplied company/task context when describing current activity.');
    expect(prompt).toContain('If there is no active task listed above, say there is no active task.');
    expect(prompt).toContain('Do not say you lack access to company operations or real-time data');
    expect(prompt).toContain('Do not invent activity');

    // Data verification
    expect(prompt).toContain('NovaDesk AI');
    expect(prompt).toContain('AI SaaS');
    expect(prompt).toContain('Intercom, Zendesk, Freshdesk, Help Scout');
    expect(prompt).toContain('No active tasks found');
  });

  it('includes base system prompt if available at the bottom', async () => {
    const prompt = await AgentRuntime.buildExecutiveContext(null, { role: 'CEO', name: 'AI CEO', system_prompt: 'Base prompt.' });
    expect(prompt).toContain('Base prompt.');
    expect(prompt.endsWith('Base prompt.')).toBe(true);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { CEOService } from '../services/CEOService';

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({
              tasks: [{ agent_id: 'agent1', title: 'Deploy', input: { task_type: 'PRODUCTION_DEPLOYMENT' } }]
            })}}]
          })
        }
      };
    }
  };
});

describe('Authorization Execution Blocks', () => {
  it('13. Approval-required action must NOT become an executable task', async () => {
    let insertedTasks: any[] = [];
    let insertedEvents: any[] = [];
    const supabase = {
      from: vi.fn((table: string) => {
        let chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          update: vi.fn(() => chain),
          upsert: vi.fn(() => chain),
          in: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: table === 'workspaces' ? { name: 'Test', operational_context: '{}' } : (table === 'agents' ? { id: 'agent1', capabilities: ['PRODUCTION_DEPLOYMENT', 'APPLICATION_MONITORING'] } : null) })),
          insert: vi.fn((data: any) => {
            if (table === 'tasks') insertedTasks.push(data);
            if (table === 'task_events') insertedEvents.push(data);
            return { select: () => ({ single: () => Promise.resolve({ data: { id: 'task-1', title: data.title } }) }) };
          }),
          then: (resolve: any) => resolve({ data: [{id: 'agent1'}] }) // Return agent1 so agent exists check passes
        };
        return chain;
      })
    };

    process.env.OPENROUTER_API_KEY = 'test_key';
    const res = await CEOService.run(supabase as any, 'ws-1', 'DEPLOYMENT', 'user-1');
    process.env.OPENROUTER_API_KEY = '';
    
    // Because PRODUCTION_DEPLOYMENT is approval required, it should block.
    expect(insertedTasks.length).toBe(1); // Task SHOULD be created as BLOCKED
    expect(insertedTasks[0].status).toBe('BLOCKED');
    
    const blockEvent = insertedEvents.find(e => e.event_type === 'OWNER_APPROVAL_REQUIRED');
    expect(blockEvent).toBeDefined();
    expect(blockEvent.details.action).toBe('PRODUCTION_DEPLOYMENT');
  });

  it('12. Valid application monitoring -> task created', async () => {
    let insertedTasks: any[] = [];
    let insertedEvents: any[] = [];
    const supabase = {
      from: vi.fn((table: string) => {
        let chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          update: vi.fn(() => chain),
          upsert: vi.fn(() => chain),
          in: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: table === 'workspaces' ? { name: 'Test', operational_context: '{}' } : (table === 'agents' ? { id: 'agent1', capabilities: ['PRODUCTION_DEPLOYMENT', 'APPLICATION_MONITORING'] } : null) })),
          insert: vi.fn((data: any) => {
            if (table === 'tasks') insertedTasks.push(data);
            if (table === 'task_events') insertedEvents.push(data);
            return { select: () => ({ single: () => Promise.resolve({ data: { id: 'task-1', title: data.title } }) }) };
          }),
          then: (resolve: any) => resolve({ data: [{id: 'agent1'}] })
        };
        return chain;
      })
    };

    await CEOService.run(supabase as any, 'ws-1', 'SCHEDULED_OBSERVATION:APPLICATION_MONITORING', 'user-1');
    expect(insertedTasks.length).toBe(1); // Task should be created
    expect(insertedEvents.find(e => e.event_type === 'ACTION_AUTHORIZED')).toBeDefined();
  });
});

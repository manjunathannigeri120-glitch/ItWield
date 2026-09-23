import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';

vi.mock('openai', () => {
  return {
    default: function() {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify({}) } }]
            })
          }
        }
      };
    }
  };
});

describe('Business Actions Execution Framework', () => {
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate = vi.fn().mockReturnThis();
  });

  const getMockSupabase = (agentCapabilities: string[], workspaceIntegrations: any = {}) => {
    return {
      from: vi.fn((table: string) => {
        const chain: any = {
          update: mockUpdate,
          eq: vi.fn(() => chain),
          select: vi.fn(() => chain),
          single: vi.fn(() => {
            if (table === 'tasks') return Promise.resolve({ data: { workspace_id: 'ws-1' } });
            if (table === 'agents') return Promise.resolve({ data: { capabilities: agentCapabilities } });
            if (table === 'workspaces') return Promise.resolve({ data: { integrations: workspaceIntegrations } });
            return Promise.resolve({ data: {} });
          }),
          insert: vi.fn(() => chain)
        };
        return chain;
      })
    };
  };

  it('fails execution if worker lacks required capability', async () => {
    const supabase = getMockSupabase(['APPLICATION_MONITORING']); // Lacks WEB_RESEARCH
    
    await CEOService.executeInlineTask(supabase as any, 'task-1', { task_type: 'WEB_RESEARCH' }, 'user-1', 'agent-1');

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'FAILED',
      error: expect.stringContaining('Worker missing required capability')
    }));
  });

  it('fails execution if required connection is missing', async () => {
    // Agent has capability, but process.env.TAVILY_API_KEY is null (and we pretend it's not test env)
    const supabase = getMockSupabase(['WEB_RESEARCH']);
    
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; // Force connection check
    
    await CEOService.executeInlineTask(supabase as any, 'task-1', { task_type: 'WEB_RESEARCH' }, 'user-1', 'agent-1');
    
    process.env.NODE_ENV = originalEnv;

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'FAILED',
      error: expect.stringContaining('CONNECTION_REQUIRED: web_search')
    }));
  });

  it('allows execution if agent has capability and connection exists', async () => {
    const supabase = getMockSupabase(['WEB_RESEARCH']);
    const mockAction = {
      id: 'WEB_RESEARCH',
      execute: vi.fn().mockResolvedValue({ success: true, verification: { verified: true } })
    };
    ActionRegistry.register(mockAction as any);
    
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; // Force connection check
    process.env.TAVILY_API_KEY = 'mock_key';
    
    await CEOService.executeInlineTask(supabase as any, 'task-1', { task_type: 'WEB_RESEARCH' }, 'user-1', 'agent-1');
    
    process.env.NODE_ENV = originalEnv;
    delete process.env.TAVILY_API_KEY;

    expect(mockAction.execute).toHaveBeenCalled();
    // Should be completed
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'COMPLETED'
    }));
  });
});

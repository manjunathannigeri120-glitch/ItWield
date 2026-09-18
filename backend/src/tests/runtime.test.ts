import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRuntime, AgentConfig } from '../agents/runtime';
import { MockProvider } from '../ai/mockProvider';

describe('AgentRuntime', () => {
  const agentConfig: AgentConfig = {
    id: 'agent-123',
    workspace_id: 'ws-123',
    system_prompt: 'You are a test agent.',
    model: 'mock-model-v1',
    temperature: 0.7
  };

  const createQueryBuilder = () => {
    const builder: any = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'mock-run', tool_name: 'web_search' }, error: null }),
      then: function(resolve: any) {
        resolve({ data: [], error: null });
      }
    };
    return builder;
  };
  
  const mockSupabase: any = createQueryBuilder();
  // Override specific calls for test needs
  mockSupabase.from = vi.fn(() => mockSupabase);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AgentRuntime, 'getProvider').mockReturnValue(new MockProvider());
  });

  it('runs successfully without tools', async () => {
    // Override db returns to have no authorized tools
    
    const result = await AgentRuntime.runChat(mockSupabase, agentConfig, 'conv-123', 'Hello', 'user-123');
    expect(result).toContain('Mock AI Response');
  });

  it('terminates after MAX_AGENT_STEPS', async () => {
    // We mock AI provider to infinitely return tool calls
    const infiniteProvider = {
      generateText: vi.fn().mockResolvedValue({
        text: '',
        tool_calls: [{ function: { name: 'web_search', arguments: '{}' }, id: 't1' }]
      })
    };
    vi.spyOn(AgentRuntime, 'getProvider').mockReturnValue(infiniteProvider as any);

    const result = await AgentRuntime.runChat(mockSupabase, agentConfig, 'conv-123', 'Hello', 'user-123');
    
    expect(result).toBe('Agent reached maximum step limit before finishing the task.');
    expect(infiniteProvider.generateText).toHaveBeenCalledTimes(10);
  });
});

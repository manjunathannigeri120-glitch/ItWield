import { AIProvider, GenerateResult, Message, ToolDefinition } from './provider';

export class MockProvider implements AIProvider {
  async generateText(
    messages: Message[], 
    model: string, 
    temperature?: number,
    tools?: ToolDefinition[]
  ): Promise<GenerateResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // Simulate tool call if user asks about "latest AI developments" and web search tool is available
    if (lastUserMessage.toLowerCase().includes('search') || lastUserMessage.toLowerCase().includes('latest ai')) {
      const hasWebSearch = tools?.find(t => t.function.name === 'web_search');
      
      // Only mock tool call if it hasn't been called already in the recent context
      const alreadyCalled = messages.some(m => m.role === 'tool' && m.content.includes('Mocked search'));

      if (hasWebSearch && !alreadyCalled) {
        return {
          text: '',
          tool_calls: [{
            id: 'mock_call_123',
            type: 'function',
            function: {
              name: 'web_search',
              arguments: JSON.stringify({ query: 'latest AI developments' })
            }
          }],
          model: model || 'mock-model-v1',
          usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 }
        };
      }
    }

    return {
      text: `The AI provider is currently unavailable. Please configure the OPENROUTER_API_KEY to enable chat capabilities. (Received: "${lastUserMessage}")`,
      model: model || 'mock-model-v1',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }
}

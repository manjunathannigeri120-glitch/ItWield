import OpenAI from 'openai';
import { AIProvider, GenerateResult, Message, ToolDefinition } from './provider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  public providerName: 'OPENROUTER' | 'OLLAMA';

  constructor(apiKey: string | undefined, baseURL?: string, defaultHeaders?: any, providerName: 'OPENROUTER' | 'OLLAMA' = 'OPENROUTER') {
    // OpenAI client allows undefined apiKey if baseURL doesn't require it (e.g. local Ollama)
    this.client = new OpenAI({ apiKey: apiKey || 'dummy-key-for-local', baseURL, defaultHeaders });
    this.providerName = providerName;
  }

  async generateText(
    messages: Message[], 
    model: string, 
    temperature?: number,
    tools?: ToolDefinition[],
    responseFormat?: { type: 'json_object' }
  ): Promise<GenerateResult> {
    
    const formattedMessages = messages.map(msg => {
      const base: any = { role: msg.role, content: msg.content || null };
      if (msg.role === 'tool' && msg.tool_call_id) {
        base.tool_call_id = msg.tool_call_id;
      }
      if (msg.role === 'assistant' && msg.tool_calls) {
        base.tool_calls = msg.tool_calls;
      }
      return base;
    });

    const sanitizedMessages: any[] = [];
    for (const msg of formattedMessages) {
      const last = sanitizedMessages[sanitizedMessages.length - 1];
      if (last && last.role === msg.role && msg.role !== 'tool' && !msg.tool_calls && !last.tool_calls) {
        last.content = (last.content || '') + '\n\n' + (msg.content || '');
      } else {
        sanitizedMessages.push(msg);
      }
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: sanitizedMessages,
        temperature: temperature ?? 0.7,
        tools: tools && tools.length > 0 ? tools : undefined,
        response_format: responseFormat,
      });

      const choice = completion.choices[0];
      const message = choice.message;

      return {
        text: message.content || '',
        tool_calls: message.tool_calls as any,
        model: completion.model,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined,
        providerUsed: this.providerName
      };
    } catch (error: any) {
      error.providerName = this.providerName;
      throw error;
    }
  }
}

import OpenAI from 'openai';
import { AIProvider, GenerateResult, Message, ToolDefinition } from './provider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string, defaultHeaders?: any) {
    this.client = new OpenAI({ apiKey, baseURL, defaultHeaders });
  }

  async generateText(
    messages: Message[], 
    model: string, 
    temperature?: number,
    tools?: ToolDefinition[]
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

    const MAX_RETRIES = process.env.OPENAI_MAX_RETRIES ? parseInt(process.env.OPENAI_MAX_RETRIES, 10) : 3;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        const completion = await this.client.chat.completions.create({
          model: model || 'gpt-4o-mini',
          messages: formattedMessages,
          temperature: temperature ?? 0.7,
          tools: tools && tools.length > 0 ? tools : undefined,
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
          } : undefined
        };
      } catch (error: any) {
        const status = error?.status;
        // Retry on rate limits (429) or transient server errors (500+)
        if (status === 429 || (status >= 500 && status < 600)) {
          attempt++;
          if (attempt > MAX_RETRIES) {
            throw new Error(`OpenAI API failed after ${MAX_RETRIES} retries: ${error.message}`);
          }
          // Exponential backoff
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Do not retry 400 (Bad Request), 401 (Unauthorized), etc.
          throw new Error(`OpenAI API error: ${error.message}`);
        }
      }
    }

    throw new Error('Unexpected exit from retry loop');
  }
}

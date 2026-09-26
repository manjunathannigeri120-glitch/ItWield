import { AIProvider, GenerateResult, Message, ToolDefinition } from './provider';
import { OpenAIProvider } from './openaiProvider';

export class ProviderFactory implements AIProvider {
  private primaryProvider: OpenAIProvider;
  private secondaryProvider: OpenAIProvider | null = null;
  private secondaryModelDefault: string | undefined;

  constructor() {
    this.primaryProvider = new OpenAIProvider(
      process.env.OPENROUTER_API_KEY || '',
      'https://openrouter.ai/api/v1',
      { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield CEO' },
      'OPENROUTER'
    );

    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
    const ollamaModel = process.env.OLLAMA_MODEL;
    
    if (ollamaBaseUrl && ollamaModel) {
      this.secondaryModelDefault = ollamaModel;
      this.secondaryProvider = new OpenAIProvider(
        process.env.OLLAMA_API_KEY, 
        ollamaBaseUrl,
        undefined,
        'OLLAMA'
      );
    }
  }

  async generateText(
    messages: Message[],
    model: string,
    temperature?: number,
    tools?: ToolDefinition[],
    responseFormat?: { type: 'json_object' }
  ): Promise<GenerateResult> {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        const result = await this.primaryProvider.generateText(
          messages,
          model,
          temperature,
          tools,
          responseFormat
        );
        result.fallbackUsed = false;
        return result;
      } catch (error: any) {
        const status = error?.status;
        const msg = (error?.message || '').toLowerCase();
        
        const isQuotaExhausted = status === 402 || (status === 429 && (msg.includes('free-models-per-day') || msg.includes('insufficient_quota') || msg.includes('remaining: 0')));
        const isAuthFailure = status === 401;
        const isTransient = status === 429 || (status >= 500 && status < 600);
        const isContextLength = status === 400 && msg.includes('context_length_exceeded');
        const isInvalidRequest = status === 400 && !isContextLength;

        // 1. Fail immediately on invalid request or context length (NO FALLBACK)
        if (isInvalidRequest || isContextLength) {
          throw new Error(`Primary provider rejected request (Status ${status}): ${error.message}`);
        }

        // 2. Immediately fallback on Quota or Auth failure
        if (isQuotaExhausted || isAuthFailure) {
          break; 
        }

        // 3. Transient error (429 temporary, 502, 503)
        if (isTransient) {
          attempt++;
          if (attempt > MAX_RETRIES) {
            break; 
          }
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Unknown error
          break;
        }
      }
    }

    // --- FALLBACK TO OLLAMA ---
    if (this.secondaryProvider && this.secondaryModelDefault) {
      try {
        const result = await this.secondaryProvider.generateText(
          messages,
          this.secondaryModelDefault, // Never send openrouter/free to Ollama
          temperature,
          tools,
          responseFormat
        );
        
        result.fallbackUsed = true;
        return result;
      } catch (fallbackError: any) {
        if (fallbackError?.status === 400) {
           throw new Error(`Fallback provider capability unsupported or invalid request: ${fallbackError.message}`);
        }
        throw new Error(`All AI providers failed. Fallback error: ${fallbackError.message}`);
      }
    }

    throw new Error('OpenRouter API failed and no fallback provider is configured or available.');
  }

  static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }
  private static instance: ProviderFactory;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface GenerateResult {
  text: string;
  tool_calls?: ToolCall[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  providerUsed?: 'OPENROUTER' | 'OLLAMA';
  fallbackUsed?: boolean;
}

export interface AIProvider {
  generateText(
    messages: Message[], 
    model: string, 
    temperature?: number,
    tools?: ToolDefinition[],
    responseFormat?: { type: 'json_object' }
  ): Promise<GenerateResult>;
}

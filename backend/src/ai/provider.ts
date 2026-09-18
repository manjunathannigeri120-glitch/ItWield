export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string; // used if role is 'tool'
  tool_calls?: ToolCall[]; // used if role is 'assistant'
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any; // JSON schema
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
}

export interface AIProvider {
  generateText(
    messages: Message[], 
    model: string, 
    temperature?: number,
    tools?: ToolDefinition[]
  ): Promise<GenerateResult>;
}

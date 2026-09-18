import { AIProvider, ToolCall, Message } from '../ai/provider';
import { MockProvider } from '../ai/mockProvider';
import { OpenAIProvider } from '../ai/openaiProvider';
import { supabase } from '../db/supabase';
import { getTool } from '../tools';

const MAX_AGENT_STEPS = 10;

export interface AgentConfig {
  id: string;
  workspace_id: string;
  system_prompt: string;
  model: string;
  temperature: number;
}

export class AgentRuntime {
  
  static getProvider(): AIProvider {
    const key = process.env.OPENAI_API_KEY;
    if (key) return new OpenAIProvider(key);
    return new MockProvider();
  }

  static async logEvent(supabase: any, runId: string, eventType: string, durationMs?: number, toolName?: string, details?: any) {
    if (!supabase || !runId) return;
    try {
      const { error } = await supabase.from('agent_run_events').insert({
        run_id: runId,
        event_type: eventType,
        tool_name: toolName,
        duration_ms: durationMs,
        details: details || {}
      });
      if (error) {
        console.error(`[AgentRuntime] Failed to log event ${eventType} for run ${runId}:`, error.message);
      }
    } catch (e: any) {
      console.error(`[AgentRuntime] Exception logging event ${eventType} for run ${runId}:`, e.message);
    }
  }

  static async runChat(
    supabase: any,
    agent: AgentConfig,
    conversationId: string,
    userMessage: string,
    userId: string
  ): Promise<string> {
    const startedAt = new Date();
    let runId = '';
    
    // 1. Log Run Started
    if (supabase) {
      const { data: runData } = await supabase
        .from('agent_runs')
        .insert({
          agent_id: agent.id,
          conversation_id: conversationId,
          status: 'running',
          started_at: startedAt.toISOString(),
          model: agent.model
        })
        .select()
        .single();
      if (runData) {
        runId = runData.id;
        await this.logEvent(supabase, runId, 'agent_started');
      }
    }

    try {
      // 2. Fetch recent conversation history
      let messages: Message[] = [];
      if (supabase) {
        const { data: history } = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20);
        
        if (history) {
          messages = history.map((h: any) => ({ role: h.role as any, content: h.content }));
        }
      }

      // 3. Determine authorized tools
      let authorizedToolNames: string[] = [];
      if (supabase) {
        const { data: dbTools } = await supabase
          .from('agent_tools')
          .select('tool_name')
          .eq('agent_id', agent.id);
        if (dbTools) {
          authorizedToolNames = dbTools.map((t: any) => t.tool_name);
        }
      }

      const activeTools = authorizedToolNames
        .map(name => getTool(name))
        .filter(t => t !== undefined)
        .map(t => t!);

      const toolDefinitions = activeTools.map(t => t.definition);

      const contextMessages: Message[] = [
        { role: 'system', content: agent.system_prompt },
        ...messages,
        { role: 'user', content: userMessage }
      ];

      const aiProvider = this.getProvider();
      let iterations = 0;
      let finalResponseText = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      // 4. Execution Loop
      while (iterations < MAX_AGENT_STEPS) {
        iterations++;
        await this.logEvent(supabase, runId, 'model_called', undefined, undefined, { iteration: iterations });
        
        const result = await aiProvider.generateText(contextMessages, agent.model, agent.temperature, toolDefinitions);
        
        if (result.usage) {
          totalInputTokens += result.usage.prompt_tokens;
          totalOutputTokens += result.usage.completion_tokens;
        }

        // Add assistant's message to context
        contextMessages.push({
          role: 'assistant',
          content: result.text,
          tool_calls: result.tool_calls
        });

        // If no tool calls, we are done
        if (!result.tool_calls || result.tool_calls.length === 0) {
          finalResponseText = result.text;
          break;
        }

        // Handle tool calls
        for (const toolCall of result.tool_calls) {
          const toolStart = new Date();
          const toolName = toolCall.function.name;
          const tool = activeTools.find(t => t.name === toolName);

          await this.logEvent(supabase, runId, 'tool_requested', undefined, toolName, { call_id: toolCall.id });

          let toolResultStr = '';
          if (!tool) {
            toolResultStr = JSON.stringify({ error: `Tool ${toolName} not found or not authorized.` });
            await this.logEvent(supabase, runId, 'tool_failed', undefined, toolName, { error: 'Unauthorized/Unknown' });
          } else {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              
              const toolResult = await tool.execute(args, {
                workspaceId: agent.workspace_id,
                userId: userId,
                runId: runId
              });
              
              toolResultStr = JSON.stringify(toolResult);
              
              const duration = new Date().getTime() - toolStart.getTime();
              await this.logEvent(supabase, runId, 'tool_completed', duration, toolName);

            } catch (err: any) {
              toolResultStr = JSON.stringify({ error: err.message });
              const duration = new Date().getTime() - toolStart.getTime();
              await this.logEvent(supabase, runId, 'tool_failed', duration, toolName, { error: err.message });
            }
          }

          contextMessages.push({
            role: 'tool',
            content: toolResultStr,
            tool_call_id: toolCall.id
          });
        }
      }

      if (iterations >= MAX_AGENT_STEPS && !finalResponseText) {
        finalResponseText = "Agent reached maximum step limit before finishing the task.";
      }

      // 5. Save final assistant message
      if (supabase && finalResponseText) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: finalResponseText
        });
      }

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // 6. Update Run Record
      if (supabase && runId) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString(),
            duration_ms: durationMs,
            input_tokens: totalInputTokens,
            output_tokens: totalOutputTokens
          })
          .eq('id', runId);
          
        await this.logEvent(supabase, runId, 'agent_completed', durationMs);
      }

      return finalResponseText;
    } catch (error: any) {
      console.error('Agent runtime error:', error);
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      if (supabase && runId) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            completed_at: completedAt.toISOString(),
            duration_ms: durationMs,
            error: error.message || 'Unknown error'
          })
          .eq('id', runId);
          
        await this.logEvent(supabase, runId, 'agent_failed', durationMs, undefined, { error: error.message });
      }

      throw new Error('Agent execution failed');
    }
  }
}

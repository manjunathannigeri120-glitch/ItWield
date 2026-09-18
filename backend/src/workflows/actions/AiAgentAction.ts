import { Action, ActionContext } from './Action';
import { AgentRuntime } from '../../agents/runtime';

export class AiAgentAction implements Action {
  id = 'action_ai_agent';

  async execute(config: any, context: ActionContext): Promise<any> {
    const agentId = config.agent_id;
    let agent;
    
    if (context.supabase) {
      const { data } = await context.supabase.from('agents').select('*').eq('id', agentId).single();
      agent = data;
    } else {
      agent = { id: agentId, model: 'mock-model', tools: [] };
    }
    
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    
    // Uniquely identify the conversation using runId and attempt
    const convId = context.runId + '_attempt_' + context.attempt; 
    return await AgentRuntime.runChat(context.supabase, agent, convId, config.prompt, context.userId);
  }
}

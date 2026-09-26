import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface BusinessGoalInterpretation {
  objective: string;
  target?: number;
  target_metric?: string;
  timeframe?: string;
  success_definition: string;
  required_data: string[];
  missing_data?: string[];
  constraints?: string[];
}

export class BusinessGoalInterpreter {
  static async interpretGoal(supabase: SupabaseClient, workspaceId: string, rawInput: string): Promise<BusinessGoalInterpretation> {
    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Interpreter' } });
    
    // Fetch available data domains to ground the interpretation
    const { data: registry } = await supabase
      .from('business_data_registry')
      .select('domain, source, availability')
      .eq('workspace_id', workspaceId);
      
    const availableDomains = registry?.map(r => r.domain) || [];
    
    const prompt = `
      You are the ItWield Business Goal Interpreter.
      The founder has entered the following business goal: "${rawInput}"
      
      Available data domains in this workspace: ${availableDomains.length ? availableDomains.join(', ') : 'None yet registered'}
      
      Extract the following information and return ONLY valid JSON matching this schema:
      {
        "objective": "High level business objective (e.g. 'Acquire customers', 'Increase revenue')",
        "target": numeric target (e.g. 20),
        "target_metric": "What is being measured (e.g. 'Verified WON customers', 'MRR in USD')",
        "timeframe": "Any explicit timeframe mentioned (e.g. '60 days')",
        "success_definition": "Precise definition of how success is verified. Note if it REQUIRES CONFIRMATION.",
        "required_data": ["List of data domains needed to track this"],
        "missing_data": ["List of required data domains that are NOT in the available domains list"],
        "constraints": ["Any explicit limits or constraints"]
      }
    `;

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      // Parse JSON from response
      const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      const interpretation = JSON.parse(text) as BusinessGoalInterpretation;
      
      return interpretation;
    } catch (e: any) {
      console.error('[BusinessGoalInterpreter] Failed to interpret goal:', e);
      if (e.status === 429 || e.code === 429 || e.message?.includes('429')) {
        console.warn('[BusinessGoalInterpreter] Rate limit hit. Falling back to basic interpretation.');
        return {
          objective: rawInput,
          success_definition: 'Manual verification required (AI rate limited)',
          required_data: [],
          missing_data: []
        };
      }
      throw new Error('Failed to interpret business goal. Please rephrase or provide more detail.');
    }
  }

  static async createGoal(supabase: SupabaseClient, workspaceId: string, rawInput: string): Promise<any> {
    const interpretation = await this.interpretGoal(supabase, workspaceId, rawInput);
    
    const { data: goal, error } = await supabase
      .from('business_goals')
      .insert({
        workspace_id: workspaceId,
        raw_input: rawInput,
        objective: interpretation.objective,
        target: interpretation.target || null,
        target_metric: interpretation.target_metric || null,
        timeframe: interpretation.timeframe || null,
        success_definition: interpretation.success_definition,
        required_data: interpretation.required_data || [],
        missing_data: interpretation.missing_data || [],
        constraints: interpretation.constraints || [],
        status: 'ACTIVE'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Log Decision Trace
    await supabase.from('decision_traces').insert({
      workspace_id: workspaceId,
      event_name: 'GOAL_CREATED',
      context_data: { rawInput },
      conclusion: `Interpreted goal: ${interpretation.objective}`,
      proposed_action: 'Proceed to Outcome Planning',
      authorization_state: 'OWNER_DIRECTED',
      result: `Goal ID: ${goal.id}`
    });

    return goal;
  }
}

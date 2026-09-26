import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { MissionPlanningService } from './MissionPlanningService';

export class OutcomePlannerService {
  static async planOutcome(supabase: SupabaseClient, workspaceId: string, goalId: string): Promise<any> {
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) throw new Error('Goal not found');

    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Planner' } });
    
    // Check missing data
    if (goal.missing_data && goal.missing_data.length > 0) {
      await supabase.from('decision_traces').insert({
        workspace_id: workspaceId,
        event_name: 'OUTCOME_PLANNING_BLOCKED',
        context_data: { goal: goal.objective, missing: goal.missing_data },
        conclusion: 'Goal requires data sources that are currently UNAVAILABLE.',
        proposed_action: 'Prompt owner to connect required data sources.',
        authorization_state: 'BLOCKED',
        result: 'Planning deferred.'
      });
      return { blocked: true, reason: 'MISSING_DATA', missing: goal.missing_data };
    }

    const prompt = `
      You are the ItWield Outcome Planner.
      Goal: ${goal.objective}
      Target: ${goal.target || 'N/A'} ${goal.target_metric || ''}
      Constraints: ${goal.constraints?.join(', ')}
      
      Produce an execution plan by identifying which core missions need to be created.
      Valid mission types in the current system: GET_CUSTOMERS, UNDERSTAND_COMPETITORS, IMPROVE_PRODUCT.
      
      Respond in JSON:
      {
        "strategy": "Text description of the execution strategy",
        "missions": [
          { "type": "GET_CUSTOMERS", "objective": "Precise mission objective", "contribution_metric": "What this mission contributes to the goal" }
        ]
      }
    `;

    const response = await openai.chat.completions.create({ model: 'openrouter/free', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const plan = JSON.parse(text);

    // Spawn missions
    for (const m of plan.missions) {
      const { data: mission } = await supabase.from('business_missions').insert({
        workspace_id: workspaceId,
        type: m.type,
        objective: m.objective,
        status: 'PENDING',
        parent_goal_id: goalId,
        contribution_metric: m.contribution_metric
      }).select().single();
      
      // Auto-plan the mission if it was created
      if (mission) {
        try {
          await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
        } catch(e) {
          console.error('[OutcomePlanner] Mission planning failed for', mission.id, e);
        }
      }
    }

    await supabase.from('decision_traces').insert({
      workspace_id: workspaceId,
      event_name: 'OUTCOME_PLAN_CREATED',
      context_data: { strategy: plan.strategy, missions: plan.missions },
      conclusion: 'Outcome strategy defined and missions created.',
      proposed_action: 'Dispatch missions to Executives / Workers',
      authorization_state: 'AUTO_AUTHORIZED',
      result: `${plan.missions.length} missions created.`
    });

    return { blocked: false, plan };
  }
}

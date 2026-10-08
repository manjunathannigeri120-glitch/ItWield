import { ensureAIProvider } from '../utils/aiConfig';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { MissionPlanningService } from './MissionPlanningService';

export class OutcomePlannerService {
  static async planOutcome(supabase: SupabaseClient, workspaceId: string, goalId: string): Promise<any> {
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) throw new Error('Goal not found');

    try {
      ensureAIProvider();
    } catch (e) {
      console.warn('[OutcomePlannerService] AI provider check notice:', e);
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined;
    const defaultHeaders = process.env.OPENROUTER_API_KEY ? { 'HTTP-Referer': 'https://itwield.com', 'X-Title': 'ItWield Planner' } : undefined;
    const openai = new OpenAI({ apiKey: apiKey || 'mock', baseURL, defaultHeaders });
    
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
      Mission types can be standard (GET_CUSTOMERS, UNDERSTAND_COMPETITORS, IMPROVE_PRODUCT) OR dynamically created custom types (e.g., COST_REDUCTION, DIAGNOSE_GROWTH).
      
      Respond in JSON:
      {
        "strategy": "Text description of the execution strategy",
        "missions": [
          { "type": "MISSION_TYPE_IDENTIFIER", "objective": "Precise mission objective", "contribution_metric": "What this mission contributes to the goal" }
        ]
      }
    `;

    let plan: any = {
      strategy: `Autonomous execution strategy for: ${goal.objective}`,
      missions: [
        {
          type: 'GET_CUSTOMERS',
          objective: `Execute customer acquisition campaign targeting ${goal.target || 20} verified conversions`,
          contribution_metric: 'VERIFIED_CUSTOMERS'
        },
        {
          type: 'UNDERSTAND_COMPETITORS',
          objective: 'Analyze competitor positioning and market outreach opportunities',
          contribution_metric: 'MARKET_INTELLIGENCE'
        }
      ]
    };

    try {
      const model = process.env.OPENROUTER_MODEL || (process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');
      const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
        plan = parsed;
      }
    } catch (e: any) {
      console.warn('[OutcomePlannerService] Notice: using standard outcome plan due to AI planner response:', e.message || e);
    }

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

  static async replanOutcome(supabase: SupabaseClient, workspaceId: string, goalId: string, bottlenecks: any[]): Promise<any> {
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) throw new Error('Goal not found');

    ensureAIProvider();

    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Planner' } });
    
    const prompt = `
      You are the ItWield Outcome Replanner.
      Goal: ${goal.objective}
      Bottlenecks detected: ${JSON.stringify(bottlenecks.map((b: any) => ({ evidence: b.evidence, explanation: b.explanation, severity: b.severity })))}
      
      The current execution is failing. Produce a REVISED execution plan that addresses the bottlenecks.
      
      Respond in JSON:
      {
        "strategy": "Text description of the revised strategy",
        "missions": [
          { "type": "MISSION_TYPE_IDENTIFIER", "objective": "Precise mission objective" }
        ]
      }
    `;

    let plan: any = null;
    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      plan = JSON.parse(text);
    } catch (e: any) {
      console.error('[OutcomePlannerService] Failed to replan:', e);
      return { blocked: true, reason: 'AI_FAILED' };
    }

    // Cancel existing active missions
    await supabase.from('business_missions').update({ status: 'CANCELLED' })
      .eq('workspace_id', workspaceId)
      .eq('parent_goal_id', goalId)
      .in('status', ['PENDING', 'ACTIVE', 'EXECUTING']);

    // Spawn new missions
    for (const m of plan.missions) {
      const { data: mission } = await supabase.from('business_missions').insert({
        workspace_id: workspaceId,
        type: m.type,
        objective: m.objective,
        status: 'PENDING',
        parent_goal_id: goalId
      }).select().single();
      
      if (mission) {
        try {
          await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
        } catch(e) {}
      }
    }

    await supabase.from('decision_traces').insert({
      workspace_id: workspaceId,
      event_name: 'OUTCOME_REPLANNED',
      context_data: { strategy: plan.strategy, bottlenecks: bottlenecks.map(b=>b.id) },
      conclusion: 'Revised outcome strategy defined.',
      proposed_action: 'Dispatch revised missions to Executives / Workers',
      authorization_state: 'AUTO_AUTHORIZED',
      result: `${plan.missions.length} new missions created.`
    });

    // Mark bottleneck as resolving
    await supabase.from('business_bottlenecks').update({ status: 'RESOLVING' })
      .eq('workspace_id', workspaceId).eq('related_goal_id', goalId).eq('status', 'DETECTED');

    return { blocked: false, plan };
  }
}



import { ensureAIProvider } from '../utils/aiConfig';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { BusinessBottleneckService } from './BusinessBottleneckService';
import { CompanyMemoryService } from './CompanyMemoryService';
import { MissionPlanningService } from './MissionPlanningService';
import { ExecutiveOperatingContract, ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export class CMOService {
  static async operateCustomerAcquisition(supabase: SupabaseClient, workspaceId: string, goalId: string): Promise<ExecutiveOperatingContract> {

    ensureAIProvider();
    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });

    // 1. Load Goal
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) throw new Error('Goal not found');

    // 2. Load Company Brain & Bottlenecks
    const { data: memories } = await supabase.from('company_memory').select('*').eq('workspace_id', workspaceId);
    const { data: bottlenecks } = await supabase.from('business_bottlenecks').select('*').eq('workspace_id', workspaceId).eq('related_goal_id', goalId).eq('status', 'DETECTED');
    
    // 3. Load Verification Metric (CONVERTED opportunities)
    const { count: convertedCount } = await supabase.from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('stage', 'CONVERTED');

    const { count: totalOpps } = await supabase.from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const memoryContext = (memories || []).map((m: any) => m.title + ': ' + m.content);

    const diagnosticPrompt = `
      You are the CMO evaluating customer acquisition.
      Objective: ${goal.objective}
      Current Verified Progress: ${convertedCount || 0} / ${goal.target} CONVERTED opportunities
      Total Opportunities: ${totalOpps || 0}
      Company Context: ${memoryContext.join(', ')}
      Existing Bottlenecks: ${bottlenecks?.map((b: any) => b.explanation).join(', ')}

      Analyze the current state.
      Identify KNOWN_FACTS, INFERENCES, and INSUFFICIENT_DATA.
      Determine the current bottleneck.
      DO NOT fabricate facts.

      Return ONLY valid JSON matching:
      {
        "knownFacts": ["..."],
        "inferences": ["..."],
        "insufficientData": ["..."],
        "currentBottleneck": "..."
      }
    `;

    let diagnostic: ExecutiveDiagnostic = {
      knownFacts: [], inferences: [], insufficientData: [], currentBottleneck: 'Unknown'
    };

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const diagRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: diagnosticPrompt }], response_format: { type: 'json_object' } });
      diagnostic = JSON.parse(diagRes.choices[0].message.content!.trim());
    } catch(e) {
      console.warn('[CMOService] Diagnostic failed, using fallback.');
    }

    // 4. Determine Mission State
    const { data: existingMissions } = await supabase.from('business_missions')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('parent_goal_id', goalId)
      .eq('assigned_executive', 'CMO')
      .order('created_at', { ascending: false });

    let activeMission = existingMissions?.find((m: any) => ['PENDING', 'ACTIVE', 'EXECUTING'].includes(m.status));
    
    if (!activeMission) {
       const { data: newMission } = await supabase.from('business_missions').insert({
         workspace_id: workspaceId,
         type: 'GET_CUSTOMERS',
         objective: 'Acquire customers to meet target',
         status: 'ACTIVE',
         parent_goal_id: goalId,
         assigned_executive: 'CMO'
       }).select().single();
       activeMission = newMission;
    }

    const { data: plans } = await supabase.from('mission_plans')
      .select('*, mission_plan_steps(*)')
      .eq('workspace_id', workspaceId)
      .eq('mission_id', activeMission!.id)
      .eq('status', 'ACTIVE');
      
    let activePlan = (plans && plans.length > 0) ? plans[0] : null;
    let replanRequired = !activePlan;

    if (activePlan) {
       const hasFailed = activePlan.mission_plan_steps?.some((s: any) => s.status === 'FAILED');
       const isComplete = activePlan.mission_plan_steps?.every((s: any) => ['COMPLETED', 'SKIPPED'].includes(s.status));
       if (hasFailed || isComplete) {
         const evalResult: EvaluationResult = {
           status: (convertedCount && convertedCount > (goal.current_metric || 0)) ? 'OUTCOME_IMPROVED' : 'OUTCOME_UNCHANGED',
           evidence: [`Converted moved to ${convertedCount}`],
           reason: hasFailed ? 'Steps failed' : 'Plan exhausted'
         };

         await supabase.from('decision_traces').insert({
           workspace_id: workspaceId,
           event_name: 'CMO_PLAN_EVALUATED',
           context_data: evalResult,
           conclusion: evalResult.status,
           authorization_state: 'SYSTEM',
           result: evalResult.reason
         });
         
         if (evalResult.status !== 'OUTCOME_IMPROVED') {
             await supabase.from('company_memory').insert({
                workspace_id: workspaceId,
                category: 'STRATEGIC_CONTEXT',
                memory_type: 'LESSON',
                title: 'Customer Acquisition Failure',
                content: `Strategy failed: ${activePlan.objective}`,
                source_type: 'AI_AGENT',
                confidence: 'inferred'
             });
         }

         await supabase.from('mission_plans').update({ status: 'COMPLETED' }).eq('id', activePlan.id);
         replanRequired = true;
       }
    }

    let finalPlan: ExecutivePlan | undefined = undefined;

    if (replanRequired) {
      const planPrompt = `
        You are the CMO creating a structured customer acquisition plan.
        Goal: ${goal.objective}
        Current CONVERTED: ${convertedCount || 0}
        Diagnostic: ${JSON.stringify(diagnostic)}
        
        Generate an execution plan. Action types must map to existing capabilities:
        LEAD_RESEARCH, DATA_TRANSFORMATION, OUTREACH_DRAFTING, APPROVAL, EXTERNAL_COMMUNICATION.
        
        Return JSON:
        {
          "objective": "Plan objective",
          "strategy": "Strategy summary",
          "actions": [
            {
              "actionType": "LEAD_RESEARCH | DATA_TRANSFORMATION | OUTREACH_DRAFTING | APPROVAL | OBSERVE",
              "purpose": "Purpose",
              "authorityRequired": "OBSERVE | RECOMMEND | EXECUTE | AUTONOMOUS | EMERGENCY",
              "reversibility": "READ_ONLY | REVERSIBLE | EXTERNAL_COMMUNICATION | FINANCIAL",
              "verificationMethod": "How to verify"
            }
          ]
        }
      `;

      try {
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
        const planRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: planPrompt }], response_format: { type: 'json_object' } });
        const parsedPlan = JSON.parse(planRes.choices[0].message.content!.trim());
        
        const stepDefs = parsedPlan.actions.map((a: any) => ({
           title: a.purpose,
           description: `${a.purpose} (${a.reversibility})`,
           step_type: a.actionType,
           worker_role: 'service_role',
           authorization_class: a.actionType,
           success_criteria: JSON.stringify({ authorityRequired: a.authorityRequired, verificationMethod: a.verificationMethod })
        }));

        await MissionPlanningService.createPlan(supabase, workspaceId, activeMission!.id, parsedPlan.objective, stepDefs);
        finalPlan = parsedPlan as ExecutivePlan;

        await supabase.from('decision_traces').insert({
          workspace_id: workspaceId,
          event_name: 'CMO_PLAN_CREATED',
          context_data: parsedPlan,
          conclusion: 'Created new acquisition plan',
          authorization_state: 'AUTO_AUTHORIZED',
          result: 'Plan activated'
        });

      } catch(e) {
         console.error('[CMOService] Failed to generate plan', e);
      }
    }

    return {
      workspaceId,
      executiveRole: 'CMO',
      goalId,
      missionId: activeMission!.id,
      objective: goal.objective,
      successCriteria: 'COUNT(opportunities WHERE stage = CONVERTED) >= target',
      companyContext: memoryContext,
      availableBusinessData: ['opportunities'],
      currentMetrics: { convertedCount, totalOpps },
      diagnostic,
      authorityLevel: 'EXECUTE',
      plan: finalPlan,
      verificationCriteria: 'CONVERTED opportunities',
      currentStatus: 'EXECUTING',
      evidence: [`${convertedCount} CONVERTED opportunities counted.`],
      blockers: diagnostic.currentBottleneck !== 'Unknown' ? [diagnostic.currentBottleneck] : [],
      nextAction: replanRequired ? 'Generated new plan' : 'Monitoring workers',
      replanRequired: false,
      founderNotificationRequired: false
    };
  }
}



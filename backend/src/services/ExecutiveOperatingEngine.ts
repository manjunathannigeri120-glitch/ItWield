import { SupabaseClient } from '@supabase/supabase-js';
import { ExecutiveCapability } from './ExecutiveRegistry';
import { ExecutiveOperatingContract, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';
import { MissionPlanningService } from './MissionPlanningService';

export class ExecutiveOperatingEngine {
  static async operate(
    supabase: SupabaseClient, 
    workspaceId: string, 
    goal: any, 
    capability: ExecutiveCapability
  ): Promise<ExecutiveOperatingContract> {
    
    // 1. Load Context & Metrics
    const context = await capability.loadDomainContext(supabase, workspaceId);
    
    const { data: bottlenecks } = await supabase.from('business_bottlenecks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('related_goal_id', goal.id)
      .eq('status', 'DETECTED');
    context.bottlenecks = bottlenecks;

    const { metrics, verificationCriteria } = await capability.evaluateMetrics(supabase, workspaceId, goal);

    // 2. Diagnose
    const diagnostic = await capability.diagnose(goal, metrics, context);

    // 3. Determine Mission State
    const { data: existingMissions } = await supabase.from('business_missions')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('parent_goal_id', goal.id)
      .eq('assigned_executive', capability.role)
      .order('created_at', { ascending: false });

    let activeMission = existingMissions?.find((m: any) => ['PENDING', 'ACTIVE', 'EXECUTING'].includes(m.status));
    
    if (!activeMission) {
       const { data: newMission } = await supabase.from('business_missions').insert({
         workspace_id: workspaceId,
         type: capability.supportedObjectives[0] || 'GENERAL',
         objective: `${capability.role} objective: ${goal.objective}`,
         status: 'ACTIVE',
         parent_goal_id: goal.id,
         assigned_executive: capability.role
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

    // 4. Evaluate Existing Plan if needed
    if (activePlan) {
       const evalResult = await capability.evaluateExecution(metrics, goal, activePlan);
       
       if (evalResult.status !== 'OUTCOME_UNCHANGED' || evalResult.reason !== 'Executing') {
         await supabase.from('decision_traces').insert({
           workspace_id: workspaceId,
           event_name: `${capability.role}_PLAN_EVALUATED`,
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
                title: `${capability.role} Execution Failure`,
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

    // 5. Replan if required
    if (replanRequired) {
      try {
        const parsedPlan = await capability.generatePlan(goal, diagnostic, metrics);
        
        const stepDefs = parsedPlan.actions.map((a: any) => ({
           title: a.purpose,
           description: `${a.purpose} (${a.reversibility})`,
           step_type: a.actionType,
           worker_role: 'service_role',
           authorization_class: a.actionType,
           success_criteria: JSON.stringify({ authorityRequired: a.authorityRequired, verificationMethod: a.verificationMethod })
        }));

        await MissionPlanningService.createPlan(supabase, workspaceId, activeMission!.id, parsedPlan.objective, stepDefs);
        finalPlan = parsedPlan;

        await supabase.from('decision_traces').insert({
          workspace_id: workspaceId,
          event_name: `${capability.role}_PLAN_CREATED`,
          context_data: parsedPlan,
          conclusion: `Created new ${capability.role} plan`,
          authorization_state: 'AUTO_AUTHORIZED',
          result: 'Plan activated'
        });

      } catch(e) {
         console.error(`[${capability.role}Engine] Failed to generate plan`, e);
      }
    }

    // 6. Return Contract
    return {
      workspaceId,
      executiveRole: capability.role as any,
      goalId: goal.id,
      missionId: activeMission!.id,
      objective: goal.objective,
      successCriteria: verificationCriteria,
      companyContext: context.companyContext || [],
      availableBusinessData: context.availableBusinessData || [],
      currentMetrics: metrics,
      diagnostic,
      authorityLevel: 'EXECUTE',
      plan: finalPlan,
      verificationCriteria,
      currentStatus: 'EXECUTING',
      evidence: [`Evaluated metrics for ${capability.role}.`],
      blockers: diagnostic.currentBottleneck !== 'Unknown' ? [diagnostic.currentBottleneck] : [],
      nextAction: replanRequired ? 'Generated new plan' : 'Monitoring workers',
      replanRequired: false,
      founderNotificationRequired: false
    };
  }
}

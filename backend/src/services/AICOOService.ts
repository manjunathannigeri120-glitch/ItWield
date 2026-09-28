import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessBottleneckService } from './BusinessBottleneckService';
import { BusinessDataRegistry } from './BusinessDataRegistry';
import { OutcomePlannerService } from './OutcomePlannerService';
import { ExecutiveService } from './ExecutiveService';
import { OutcomeVerificationService } from './OutcomeVerificationService';
import { CompanyMemoryService } from './CompanyMemoryService';
import { CMOService } from './CMOService';
import { ExecutiveRegistry } from './ExecutiveRegistry';
import { ExecutiveOperatingEngine } from './ExecutiveOperatingEngine';
import { CMOCapability } from './CMOCapability';
import { CTOCapability } from './CTOCapability';
import { CFOCapability } from './CFOCapability';
import { CEOCapability } from './CEOCapability';
import { StubCapability } from './ExecutiveRegistry';

ExecutiveRegistry.register(new CMOCapability());
ExecutiveRegistry.register(new CTOCapability());
ExecutiveRegistry.register(new CFOCapability());
ExecutiveRegistry.register(new CEOCapability());

export class AICOOService {
  static async operateCompany(supabase: SupabaseClient, workspaceId: string): Promise<any> {
    console.log('[COO] Starting operating cycle for workspace: ' + workspaceId);
    
    // Acquire Lock (use existing workspace status)
    const { data: lock, error: lockErr } = await supabase.from('workspaces')
      .update({ status: 'operating' })
      .eq('id', workspaceId)
      .neq('status', 'operating')
      .select('id').maybeSingle();
      
    if (lockErr || !lock) {
      console.log('[COO] Workspace is already operating or locked.');
      return { status: 'LOCKED', message: 'Workspace is already operating.' };
    }

    let updatedGoalsRef: any[] = [];

    try {
      // 1. Load active business outcomes
      const { data: activeGoals } = await supabase.from('business_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE')
        .neq('operating_status', 'PAUSED')
        .neq('operating_status', 'BLOCKED');
        
      if (!activeGoals || activeGoals.length === 0) {
        await supabase.from('workspaces').update({ status: 'ACTIVE' }).eq('id', workspaceId);
        return { status: 'NO_ACTION_REQUIRED', message: 'No active business outcomes.' };
      }

      // Mark as operating
      for (const g of activeGoals) {
         await supabase.from('business_goals').update({ operating_status: 'OPERATING' }).eq('id', g.id);
      }

      // 2. Sync business data
      await BusinessDataRegistry.syncRegistry(supabase, workspaceId);

      // 3. Verify outcomes
      for (const goal of activeGoals) {
        await OutcomeVerificationService.verifyGoalProgress(supabase, workspaceId, goal.id);
      }
      
      const { data: updatedGoals } = await supabase.from('business_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE')
        .eq('operating_status', 'OPERATING');
        
      if (!updatedGoals || updatedGoals.length === 0) {
        await supabase.from('workspaces').update({ status: 'ACTIVE' }).eq('id', workspaceId);
        return { status: 'COMPLETED', message: 'All business outcomes completed.' };
      }
      
      updatedGoalsRef = updatedGoals;

      // 4. Detect Bottlenecks (Intelligent AI Engine)
      await BusinessBottleneckService.evaluateBottlenecks(supabase, workspaceId, updatedGoals);

      // 5. Delegate Executive Operations natively where applicable
      for (const goal of updatedGoals) {
        const capability = ExecutiveRegistry.getCapabilityForObjective(goal.objective, goal.target_metric || '');
        
        if (capability && capability.availability === 'AVAILABLE') {
          console.log(`[COO] Delegating goal ${goal.id} directly to ${capability.role}.`);
          const contract = await ExecutiveOperatingEngine.operate(supabase, workspaceId, goal, capability);
          if (contract.blockers && contract.blockers.length > 0) {
             const blockerDesc = contract.blockers[0];
             const targetExec = ExecutiveRegistry.getCapabilityForObjective(blockerDesc)?.role || 'CEO';
             if (targetExec !== capability.role) {
                // Create dependency
                const { CompanyCoordinationService } = await import('./CompanyCoordinationService');
                const tempGoalId = require('crypto').randomUUID(); 
                // We need to create a blocking goal for the target executive
                const { data: newGoal } = await supabase.from('business_goals').insert({
                   workspace_id: workspaceId,
                   objective: 'Resolve blocker: ' + blockerDesc,
                   status: 'ACTIVE',
                   operating_status: 'ACTIVE'
                }).select().single();
                if (newGoal) {
                   await CompanyCoordinationService.createDependency(supabase, workspaceId, goal.id, newGoal.id, capability.role, targetExec, blockerDesc);
                   contract.currentStatus = 'BLOCKED';
                }
             }
          }

          
          await supabase.from('decision_traces').insert({
            workspace_id: workspaceId,
            event_name: 'COO_EXECUTIVE_REPORT_REVIEW',
            context_data: contract as any,
            conclusion: `${capability.role} reported status: ${contract.currentStatus}`,
            proposed_action: contract.nextAction,
            authorization_state: 'SYSTEM',
            result: `Monitored execution. Blockers: ${(contract.blockers || []).join(', ') || 'None'}`
          });
          continue;
        } else if (capability) {
           console.log(`[COO] Capability ${capability.role} exists but is ${capability.availability}. Skipping full autonomous operation.`);
        }

        // For non-CMO goals, fallback
        const { count } = await supabase.from('business_missions')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('parent_goal_id', goal.id)
          .in('status', ['PENDING', 'ACTIVE', 'EXECUTING']);
          
        if (count === 0) {
          console.log('[COO] No active missions for legacy goal ' + goal.id + '. Planning outcome...');
          await OutcomePlannerService.planOutcome(supabase, workspaceId, goal.id);
        } else {
           const { data: bottlenecks } = await supabase.from('business_bottlenecks')
             .select('*')
             .eq('workspace_id', workspaceId)
             .eq('related_goal_id', goal.id)
             .eq('status', 'DETECTED');
           if (bottlenecks && bottlenecks.length > 0) {
              console.log('[COO] Detected active bottleneck for legacy goal ' + goal.id + '. Escaping/replanning...');
              await OutcomePlannerService.replanOutcome(supabase, workspaceId, goal.id, bottlenecks);
           }
        }
      }

      // Update operating timestamps for V3.12 Autonomous Loop
      for (const goal of updatedGoals) {
        await supabase.from('business_goals').update({
           last_operated_at: new Date().toISOString(),
           next_evaluation_at: new Date(Date.now() + 15 * 60000).toISOString()
        }).eq('id', goal.id);
      }

      // 6. Delegate Executive Actions for legacy missions
      await this.delegateToExecutives(supabase, workspaceId);

      // 7. Record decision trace for cycle completion
      await supabase.from('decision_traces').insert({
        workspace_id: workspaceId,
        event_name: 'COO_CYCLE_COMPLETED',
        conclusion: 'Completed operational cycle.',
        proposed_action: 'Continue monitoring.',
        authorization_state: 'SYSTEM',
        result: 'Cycle finished.'
      });

      return { status: 'CONTINUE', message: 'Operating cycle complete.' };
    } catch (err: any) {
      console.error('[COO] Error during operation cycle:', err);
      return { status: 'ERROR', message: err.message };
    } finally {
      // Release Lock and Goal Operating Status
      if (updatedGoalsRef && updatedGoalsRef.length > 0) {
         for (const goal of updatedGoalsRef) {
           await supabase.from('business_goals').update({ operating_status: 'ACTIVE' }).eq('id', goal.id).eq('operating_status', 'OPERATING');
         }
      }
      await supabase.from('workspaces').update({ status: 'ACTIVE' }).eq('id', workspaceId);
    }
  }
  
  static async getNextAction(supabase: SupabaseClient, workspaceId: string): Promise<any> {
    const { data: bottlenecks } = await supabase.from('business_bottlenecks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'DETECTED')
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: approvals } = await supabase.from('approvals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'PENDING_APPROVAL')
      .limit(1);

    if (approvals && approvals.length > 0) {
      return {
        next_action: 'Approve pending action: ' + approvals[0].action,
        why: 'An executive requires authorization to proceed.',
        owner: 'FOUNDER',
        authority: 'APPROVAL_REQUIRED',
        evidence: approvals[0].reason
      };
    }

    if (bottlenecks && bottlenecks.length > 0) {
      const b = bottlenecks[0];
      return {
        next_action: b.recommended_actions?.[0]?.description || ('Address ' + b.category + ' bottleneck.'),
        why: b.explanation,
        owner: b.category === 'FINANCE' ? 'CFO' : (b.category === 'TECHNICAL' ? 'CTO' : 'CMO'),
        authority: 'RECOMMEND',
        evidence: b.evidence
      };
    }

    return {
      next_action: 'Monitor ongoing operations',
      why: 'No critical blockers or pending approvals detected.',
      owner: 'COO',
      authority: 'AUTONOMOUS',
      evidence: 'Healthy system state'
    };
  }

  private static async delegateToExecutives(supabase: SupabaseClient, workspaceId: string) {
    const { data: missions } = await supabase.from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'PENDING');
      
    if (missions) {
      for (const m of missions) {
        let executive = 'CEO';
        if (m.type === 'COST_REDUCTION') executive = 'CFO';
        else if (m.type === 'GROWTH_DIAGNOSIS' || m.type === 'GET_CUSTOMERS') executive = 'CMO';
        else if (m.type.includes('TECHNICAL') || m.type.includes('FIX')) executive = 'CTO';

        await supabase.from('business_missions').update({ 
          status: 'ACTIVE',
          assigned_executive: executive
        }).eq('id', m.id);
        
        await supabase.from('tasks').insert({
            workspace_id: workspaceId,
            mission_id: m.id,
            title: m.objective,
            status: 'PENDING',
            assigned_agent_id: executive
        });
      }
    }
  }
}



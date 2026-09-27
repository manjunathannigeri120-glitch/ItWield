import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessBottleneckService } from './BusinessBottleneckService';
import { BusinessDataRegistry } from './BusinessDataRegistry';
import { OutcomePlannerService } from './OutcomePlannerService';
import { ExecutiveService } from './ExecutiveService';
import { OutcomeVerificationService } from './OutcomeVerificationService';
import { CompanyMemoryService } from './CompanyMemoryService';

export class AICOOService {
  static async operateCompany(supabase: SupabaseClient, workspaceId: string): Promise<any> {
    console.log(`[COO] Starting operating cycle for workspace: ${workspaceId}`);
    
    // Acquire Lock (use existing workspace status)
    const { data: lock, error: lockErr } = await supabase.from('workspaces')
      .update({ status: 'operating' })
      .eq('id', workspaceId)
      .neq('status', 'operating')
      .select('id').maybeSingle();
      
    if (lockErr || !lock) {
      console.log(`[COO] Workspace is already operating or locked.`);
      return { status: 'LOCKED', message: 'Workspace is already operating.' };
    }

    try {
      // 1. Load active business outcomes
      const { data: activeGoals } = await supabase.from('business_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');
        
      if (!activeGoals || activeGoals.length === 0) {
        await this.releaseLock(supabase, workspaceId);
        return { status: 'NO_ACTION_REQUIRED', message: 'No active business outcomes.' };
      }

      // 2. Sync business data
      await BusinessDataRegistry.syncRegistry(supabase, workspaceId);

      // 3. Verify outcomes
      for (const goal of activeGoals) {
        await OutcomeVerificationService.verifyGoalProgress(supabase, workspaceId, goal.id);
      }
      
      // Reload active goals after verification (some might have completed)
      const { data: updatedGoals } = await supabase.from('business_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');
        
      if (!updatedGoals || updatedGoals.length === 0) {
        await this.releaseLock(supabase, workspaceId);
        return { status: 'COMPLETED', message: 'All business outcomes completed.' };
      }

      // 4. Detect Bottlenecks (Intelligent AI Engine)
      await BusinessBottleneckService.evaluateBottlenecks(supabase, workspaceId, updatedGoals);

      // 5. Check if any goals need a plan or replan
      for (const goal of updatedGoals) {
        // If no pending or active missions for this goal, plan it.
        const { count } = await supabase.from('business_missions')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('parent_goal_id', goal.id)
          .in('status', ['PENDING', 'ACTIVE', 'EXECUTING']);
          
        if (count === 0) {
          console.log(`[COO] No active missions for goal ${goal.id}. Planning outcome...`);
          await OutcomePlannerService.planOutcome(supabase, workspaceId, goal.id);
        } else {
           // check if we need to replan based on bottlenecks
           const { data: bottlenecks } = await supabase.from('business_bottlenecks')
             .select('*')
             .eq('workspace_id', workspaceId)
             .eq('related_goal_id', goal.id)
             .eq('status', 'DETECTED');
           if (bottlenecks && bottlenecks.length > 0) {
              console.log(`[COO] Detected active bottleneck for goal ${goal.id}. Escaping/replanning...`);
              await OutcomePlannerService.replanOutcome(supabase, workspaceId, goal.id, bottlenecks);
           }
        }
      }

      // 6. Delegate Executive Actions
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

      await this.releaseLock(supabase, workspaceId);
      return { status: 'CONTINUE', message: 'Operating cycle complete.' };

    } catch (err: any) {
      console.error(`[COO] Error during operation cycle:`, err);
      await this.releaseLock(supabase, workspaceId);
      return { status: 'ERROR', message: err.message };
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
        next_action: `Approve pending action: ${approvals[0].action}`,
        why: 'An executive requires authorization to proceed.',
        owner: 'FOUNDER',
        authority: 'APPROVAL_REQUIRED',
        evidence: approvals[0].reason
      };
    }

    if (bottlenecks && bottlenecks.length > 0) {
      const b = bottlenecks[0];
      return {
        next_action: b.recommended_actions?.[0]?.description || `Address ${b.category} bottleneck.`,
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

  private static async releaseLock(supabase: SupabaseClient, workspaceId: string) {
    await supabase.from('workspaces').update({ status: 'ACTIVE' }).eq('id', workspaceId);
  }

  private static async delegateToExecutives(supabase: SupabaseClient, workspaceId: string) {
    // For pending missions, spawn tasks and delegate
    const { data: missions } = await supabase.from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'PENDING');
      
    if (missions) {
      for (const m of missions) {
        // Assign executive
        let executive = 'CEO';
        if (m.type === 'COST_REDUCTION') executive = 'CFO';
        else if (m.type === 'GROWTH_DIAGNOSIS' || m.type === 'GET_CUSTOMERS') executive = 'CMO';
        else if (m.type.includes('TECHNICAL') || m.type.includes('FIX')) executive = 'CTO';

        await supabase.from('business_missions').update({ 
          status: 'ACTIVE',
          assigned_executive: executive
        }).eq('id', m.id);
        
        // Let's create an action/workflow
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


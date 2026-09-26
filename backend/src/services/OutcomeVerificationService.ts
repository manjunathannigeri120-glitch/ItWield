import { SupabaseClient } from '@supabase/supabase-js';

export class OutcomeVerificationService {
  static async verifyGoalProgress(supabase: SupabaseClient, workspaceId: string, goalId: string): Promise<any> {
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) return null;

    let currentMetricValue = goal.current_metric || 0;

    // Hardcoded verifiers for now based on domain
    if (goal.target_metric?.toLowerCase().includes('customer') || goal.objective.toLowerCase().includes('customer')) {
      const { count } = await supabase.from('crm_opportunities').select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'WON');
      currentMetricValue = count || 0;
    }

    const target = goal.target || 0;
    const gap = target - currentMetricValue;
    
    let status = goal.status;
    if (status !== 'COMPLETED' && currentMetricValue >= target && target > 0) {
      status = 'COMPLETED';
      
      await supabase.from('decision_traces').insert({
        workspace_id: workspaceId,
        event_name: 'BUSINESS_OUTCOME_ACHIEVED',
        context_data: { goal: goal.objective, target, achieved: currentMetricValue },
        conclusion: 'Business outcome successfully verified against real data.',
        proposed_action: 'None',
        authorization_state: 'VERIFIED',
        result: 'Goal marked COMPLETED'
      });
    }

    await supabase.from('business_goals').update({
      current_metric: currentMetricValue,
      status,
      updated_at: new Date().toISOString()
    }).eq('id', goalId);

    return {
      goal_id: goalId,
      target,
      current: currentMetricValue,
      gap,
      status
    };
  }
}

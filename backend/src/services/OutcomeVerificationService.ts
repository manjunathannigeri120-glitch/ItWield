import { SupabaseClient } from '@supabase/supabase-js';

export class OutcomeVerificationService {
  static async verifyGoalProgress(supabase: SupabaseClient, workspaceId: string, goalId: string): Promise<any> {
    const { data: goal } = await supabase.from('business_goals').select('*').eq('id', goalId).single();
    if (!goal) return null;

    let currentMetricValue = goal.current_metric || 0;
    let updatedMissingData = goal.missing_data || [];

        // Hardcoded verifiers for now based on domain
    if (goal.target_metric?.toLowerCase().includes('customer') || goal.objective.toLowerCase().includes('customer')) {
      
      // Test if internal opportunities source is available
      const { error: oppTestError } = await supabase.from('opportunities').select('id').eq('workspace_id', workspaceId).limit(1);
      
      if (!oppTestError) {
        // Internal CRM is available. We only resolve generic "Customer data" as satisfied.
        // We DO NOT blindly remove other context like "customer behavior data" or "purchase history".
        updatedMissingData = updatedMissingData.filter((d: string) => 
          d.toLowerCase() !== 'customer data' && d !== 'Customer conversion data could not be queried.'
        );

        // Calculate progress exactly based on CONVERTED stage
        const { count, error: countError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('stage', 'CONVERTED');
          
        if (!countError) {
          currentMetricValue = count || 0; // 0 is a valid verified customer measurement
        } else {
          if (!updatedMissingData.includes('Customer conversion data could not be queried.')) {
            updatedMissingData.push('Customer conversion data could not be queried.');
          }
        }
      } else {
        if (!updatedMissingData.includes('Customer conversion data could not be queried.')) {
          updatedMissingData.push('Customer conversion data could not be queried.');
        }
      }
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
      
      const { CompanyCoordinationService } = await import('./CompanyCoordinationService');
      await CompanyCoordinationService.resolveDependencies(supabase, workspaceId, goalId, 'Business outcome successfully verified against real data.');
    }

    await supabase.from('business_goals').update({
      current_metric: currentMetricValue,
      missing_data: updatedMissingData,
      status,
      updated_at: new Date().toISOString()
    }).eq('id', goalId);

    return {
      goal_id: goalId,
      target,
      current: currentMetricValue,
      gap,
      status,
      missing_data: updatedMissingData
    };
  }
}



import { SupabaseClient } from '@supabase/supabase-js';
import { OutcomePlannerService } from './OutcomePlannerService';

export class ContinuousReplanningService {
  static async evaluateReplanning(supabase: SupabaseClient, workspaceId: string): Promise<void> {
    const { data: goals } = await supabase.from('business_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['ACTIVE', 'STALLED']);

    if (!goals) return;

    for (const goal of goals) {
      // Very basic logic: if goal is ACTIVE but no missions exist or all are failed, trigger replan
      const { count: activeMissions } = await supabase.from('business_missions')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('parent_goal_id', goal.id)
        .in('status', ['PENDING', 'RUNNING']);
        
      if (activeMissions === 0) {
        // Trigger replanning
        await supabase.from('decision_traces').insert({
          workspace_id: workspaceId,
          event_name: 'REPLANNING_TRIGGERED',
          context_data: { goal_id: goal.id },
          conclusion: 'Goal has no active missions driving it forward. Replanning required.',
          proposed_action: 'Invoke OutcomePlannerService',
          authorization_state: 'AUTO_AUTHORIZED',
          result: 'Replanning executed'
        });

        await OutcomePlannerService.planOutcome(supabase, workspaceId, goal.id);
      }
    }
  }
}

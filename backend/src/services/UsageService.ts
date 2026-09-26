import { SupabaseClient } from '@supabase/supabase-js';
import { SubscriptionService } from './SubscriptionService';
import { EntitlementService } from './EntitlementService';

export class UsageService {
  /**
   * Safe usage snapshot for frontend.
   */
  static async getUsageSnapshot(supabase: SupabaseClient, workspaceId: string) {
    const entitlements = await EntitlementService.getWorkspaceEntitlements(supabase, workspaceId);
    
    // Worker Usage (Gauge based on current active DB rows)
    const { count: workerCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Mission Usage (Counter based on active/completed missions this period)
    const sub = await SubscriptionService.getWorkspaceSubscription(supabase, workspaceId);
    
    const { count: missionCount } = await supabase
      .from('business_missions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', sub.current_period_start)
      .lte('created_at', sub.current_period_end);

    return {
      period: {
        start: sub.current_period_start,
        end: sub.current_period_end,
      },
      metrics: {
        workers: {
          current: workerCount || 0,
          limit: entitlements.max_workers
        },
        missions: {
          current: missionCount || 0,
          limit: entitlements.max_missions
        }
      }
    };
  }

  /**
   * Idempotent recording of arbitrary usage events (e.g. AI_USAGE / tokens)
   */
  static async recordUsage(
    supabase: SupabaseClient, 
    workspaceId: string, 
    metric: string, 
    value: number, 
    idempotencyKey: string
  ): Promise<boolean> {
    const sub = await SubscriptionService.getWorkspaceSubscription(supabase, workspaceId);

    const { error } = await supabase
      .from('usage_records')
      .insert({
        workspace_id: workspaceId,
        metric,
        value,
        period_start: sub.current_period_start,
        period_end: sub.current_period_end,
        idempotency_key: idempotencyKey
      });

    if (error) {
      if (error.code === '23505') {
        // Unique violation on idempotency_key -> already recorded
        return true; 
      }
      console.error(`[UsageService] Failed to record usage for ${metric}:`, error.message);
      return false;
    }
    
    return true;
  }
}

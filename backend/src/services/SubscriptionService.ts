import { SupabaseClient } from '@supabase/supabase-js';
import { PlanCatalog, PlanDefinition } from './PlanCatalog';

export interface SubscriptionState {
  id?: string;
  workspace_id: string;
  plan_id: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export class SubscriptionService {
  /**
   * Fetches the active or trial subscription for a workspace.
   * If none exists, creates a deterministic default (ACTIVE SOLO_BUILDER).
   */
  static async getWorkspaceSubscription(supabase: SupabaseClient, workspaceId: string): Promise<SubscriptionState> {
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['ACTIVE', 'TRIAL', 'PAST_DUE'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[SubscriptionService] Error fetching subscription:', error);
    }

    if (sub) {
      return sub as SubscriptionState;
    }

    // Default provisioning (for workspaces created before subscriptions existed, or new ones)
    return this.provisionDefaultSubscription(supabase, workspaceId);
  }

  static async provisionDefaultSubscription(supabase: SupabaseClient, workspaceId: string): Promise<SubscriptionState> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const defaultSub: SubscriptionState = {
      workspace_id: workspaceId,
      plan_id: 'SOLO_BUILDER',
      status: 'ACTIVE', // Skipping TRIAL for this deterministic product flow
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      cancel_at_period_end: false
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(defaultSub)
      .select()
      .single();

    if (error) {
      // If race condition hit the unique index, just fetch it
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .in('status', ['ACTIVE', 'TRIAL', 'PAST_DUE'])
          .single();
        return existing as SubscriptionState;
      }
      throw new Error(`Failed to provision default subscription: ${error.message}`);
    }

    await this.logBillingEvent(supabase, workspaceId, 'SUBSCRIPTION_CREATED', { plan_id: defaultSub.plan_id });
    return data as SubscriptionState;
  }

  static async cancelSubscription(supabase: SupabaseClient, workspaceId: string, actorId: string): Promise<SubscriptionState> {
    const sub = await this.getWorkspaceSubscription(supabase, workspaceId);
    
    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIAL') {
      throw new Error(`Cannot cancel subscription in ${sub.status} state.`);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', sub.id)
      .select()
      .single();

    if (error) throw new Error(`Cancellation failed: ${error.message}`);

    await this.logBillingEvent(supabase, workspaceId, 'SUBSCRIPTION_CANCELED', { actor_id: actorId, plan_id: sub.plan_id });
    return data as SubscriptionState;
  }

  static async reactivateSubscription(supabase: SupabaseClient, workspaceId: string, actorId: string): Promise<SubscriptionState> {
    const sub = await this.getWorkspaceSubscription(supabase, workspaceId);

    if (!sub.cancel_at_period_end) {
      return sub; // Already active
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('id', sub.id)
      .select()
      .single();

    if (error) throw new Error(`Reactivation failed: ${error.message}`);

    await this.logBillingEvent(supabase, workspaceId, 'SUBSCRIPTION_REACTIVATED', { actor_id: actorId, plan_id: sub.plan_id });
    return data as SubscriptionState;
  }

  static async changePlan(supabase: SupabaseClient, workspaceId: string, newPlanId: string, actorId: string): Promise<SubscriptionState> {
    const plan = PlanCatalog.getPlan(newPlanId);
    if (!plan) throw new Error('INVALID_PLAN');

    const sub = await this.getWorkspaceSubscription(supabase, workspaceId);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan_id: newPlanId })
      .eq('id', sub.id)
      .select()
      .single();

    if (error) throw new Error(`Plan change failed: ${error.message}`);

    // Update workspace legacy plan_id for backward compatibility
    await supabase.from('workspaces').update({ plan_id: newPlanId }).eq('id', workspaceId);

    await this.logBillingEvent(supabase, workspaceId, 'PLAN_CHANGED', { actor_id: actorId, old_plan: sub.plan_id, new_plan: newPlanId });
    
    return data as SubscriptionState;
  }

  static async logBillingEvent(supabase: SupabaseClient, workspaceId: string, eventType: string, payload: any) {
    await supabase.from('billing_events').insert({
      workspace_id: workspaceId,
      event_type: eventType,
      payload
    });
  }

  /**
   * Determines if the workspace has access based on subscription state.
   */
  static async checkAccessPolicy(supabase: SupabaseClient, workspaceId: string): Promise<{ allowed: boolean, reason?: string }> {
    const sub = await this.getWorkspaceSubscription(supabase, workspaceId);

    switch (sub.status) {
      case 'ACTIVE':
      case 'TRIAL':
        return { allowed: true };
      case 'PAST_DUE':
        // Product decision: Grace period allows operations, but warns.
        return { allowed: true, reason: 'Payment is past due.' };
      case 'CANCELED':
        // Allowed until period end
        const now = new Date();
        const end = new Date(sub.current_period_end);
        if (now > end) {
          return { allowed: false, reason: 'SUBSCRIPTION_EXPIRED' };
        }
        return { allowed: true };
      case 'EXPIRED':
        return { allowed: false, reason: 'SUBSCRIPTION_EXPIRED' };
      default:
        return { allowed: false, reason: 'INVALID_SUBSCRIPTION_STATE' };
    }
  }
}

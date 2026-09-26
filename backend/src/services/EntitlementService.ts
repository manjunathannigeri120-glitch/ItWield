import { SupabaseClient } from '@supabase/supabase-js';
import { PlanCatalog, PlanEntitlements } from './PlanCatalog';
import { SubscriptionService } from './SubscriptionService';

export class EntitlementService {
    
    static async getWorkspaceEntitlements(supabase: SupabaseClient, workspaceId: string): Promise<PlanEntitlements> {
        // Enforce subscription access policy first
        const access = await SubscriptionService.checkAccessPolicy(supabase, workspaceId);
        if (!access.allowed) {
            // Return zeroed entitlements if access is revoked
            return {
                max_workers: 0,
                max_missions: 0,
                max_connections: 0,
                features: []
            };
        }

        const sub = await SubscriptionService.getWorkspaceSubscription(supabase, workspaceId);
        const plan = PlanCatalog.getPlan(sub.plan_id);
        return plan.entitlements;
    }

    static async checkWorkerLimit(supabase: SupabaseClient, workspaceId: string): Promise<{ allowed: boolean, limit: number, current: number }> {
        const entitlements = await this.getWorkspaceEntitlements(supabase, workspaceId);
        
        // Count active workers
        const { count, error } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId);
            
        const current = count || 0;
        
        // -1 implies unlimited
        if (entitlements.max_workers === -1) {
            return { allowed: true, limit: -1, current };
        }

        return {
            allowed: current < entitlements.max_workers,
            limit: entitlements.max_workers,
            current
        };
    }

    static async hasFeature(supabase: SupabaseClient, workspaceId: string, feature: string): Promise<boolean> {
        const entitlements = await this.getWorkspaceEntitlements(supabase, workspaceId);
        return entitlements.features.includes(feature);
    }
}

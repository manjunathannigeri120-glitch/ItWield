import { SupabaseClient } from '@supabase/supabase-js';

export class BusinessDataRegistry {
  static async syncRegistry(supabase: SupabaseClient, workspaceId: string): Promise<void> {
    // 1. Detect CRM availability
    const { count: crmCount } = await supabase
      .from('crm_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (crmCount !== null) {
      await this.upsertRegistry(supabase, workspaceId, 'CUSTOMERS', 'Internal CRM', 'DATABASE', 'AVAILABLE');
      await this.upsertRegistry(supabase, workspaceId, 'PROSPECTS', 'Internal CRM', 'DATABASE', 'AVAILABLE');
      await this.upsertRegistry(supabase, workspaceId, 'OPPORTUNITIES', 'Internal CRM', 'DATABASE', 'AVAILABLE');
    } else {
      await this.upsertRegistry(supabase, workspaceId, 'CUSTOMERS', 'Internal CRM', 'DATABASE', 'UNAVAILABLE');
    }

    // 2. Detect external connections (if any exist in connections table)
    const { data: connections } = await supabase
      .from('connections')
      .select('type, status')
      .eq('workspace_id', workspaceId);

    // Depending on connection types, register data availability
    // Note: V3 did not have a full external connections table implementation, so we use dummy matching for now
    const hasStripe = connections?.some(c => c.type === 'stripe' && c.status === 'CONNECTED');
    if (hasStripe) {
      await this.upsertRegistry(supabase, workspaceId, 'REVENUE', 'Stripe', 'PAYMENT_GATEWAY', 'AVAILABLE');
    } else {
      // Intentionally missing data for "Double my revenue" scenario
      await this.upsertRegistry(supabase, workspaceId, 'REVENUE', 'System', 'UNDEFINED', 'UNAVAILABLE');
    }
  }

  private static async upsertRegistry(
    supabase: SupabaseClient, 
    workspaceId: string, 
    domain: string, 
    source: string, 
    sourceType: string, 
    availability: string
  ) {
    // simplistic upsert logic
    const { data: existing } = await supabase
      .from('business_data_registry')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('domain', domain)
      .maybeSingle();

    if (existing) {
      await supabase.from('business_data_registry').update({
        source,
        source_type: sourceType,
        availability,
        last_synced: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('business_data_registry').insert({
        workspace_id: workspaceId,
        domain,
        source,
        source_type: sourceType,
        availability,
        last_synced: new Date().toISOString()
      });
    }
  }
}

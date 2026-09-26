import { SupabaseClient } from '@supabase/supabase-js';

export class BusinessBottleneckService {
  static async evaluateBottlenecks(supabase: SupabaseClient, workspaceId: string): Promise<void> {
    // 1. Fetch Funnel Metrics
    const { count: prospectsCount } = await supabase.from('crm_opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'RESEARCHED');
      
    const { count: qualifiedCount } = await supabase.from('crm_opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'QUALIFIED');

    const { count: contactedCount } = await supabase.from('crm_opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['CONTACTED', 'NEGOTIATING']);

    const { count: wonCount } = await supabase.from('crm_opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'WON');

    // 2. Diagnostics
    let detectedCategory = null;
    let severity = 'LOW';
    let evidence = '';
    let explanation = '';
    let recommendedActions: any[] = [];

    const p = prospectsCount || 0;
    const q = qualifiedCount || 0;
    const c = contactedCount || 0;
    const w = wonCount || 0;
    const total = p + q + c + w;

    if (total === 0) {
      detectedCategory = 'ACQUISITION';
      severity = 'HIGH';
      evidence = 'Total pipeline is 0.';
      explanation = 'No prospects are currently in the system.';
      recommendedActions = [{ type: 'CREATE_MISSION', mission_type: 'GET_CUSTOMERS', description: 'Start an acquisition mission to research prospects.' }];
    } else if (p > 50 && q === 0) {
      detectedCategory = 'QUALIFICATION';
      severity = 'HIGH';
      evidence = `${p} prospects researched, 0 qualified.`;
      explanation = 'Prospects are entering the pipeline but failing qualification criteria.';
      recommendedActions = [{ type: 'REVIEW_QUALIFICATION', description: 'Review qualification rules in Company Memory.' }];
    } else if (q > 20 && c === 0) {
      detectedCategory = 'OPERATIONS';
      severity = 'CRITICAL';
      evidence = `${q} qualified leads, 0 contacted.`;
      explanation = 'Leads are qualified but no outreach is happening. Check pending approvals.';
      recommendedActions = [{ type: 'CHECK_APPROVALS', description: 'Check Command Center for pending outreach approvals.' }];
    } else if (c > 20 && w === 0) {
      detectedCategory = 'CONVERSION';
      severity = 'HIGH';
      evidence = `${c} leads contacted, 0 won.`;
      explanation = 'Contact strategy is not converting to wins. Sales or pricing might be the issue.';
      recommendedActions = [{ type: 'CREATE_MISSION', mission_type: 'IMPROVE_PRODUCT', description: 'Analyze why contacted leads are not converting.' }];
    }

    if (detectedCategory) {
      await this.upsertBottleneck(supabase, workspaceId, detectedCategory, severity, evidence, explanation, recommendedActions);
    }
  }

  private static async upsertBottleneck(
    supabase: SupabaseClient, workspaceId: string, category: string, severity: string, evidence: string, explanation: string, recommendedActions: any[]
  ) {
    const { data: existing } = await supabase.from('business_bottlenecks').select('id')
      .eq('workspace_id', workspaceId).eq('category', category).eq('status', 'DETECTED').maybeSingle();
      
    if (existing) {
      await supabase.from('business_bottlenecks').update({
        severity, evidence, explanation, recommended_actions: recommendedActions, updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('business_bottlenecks').insert({
        workspace_id: workspaceId,
        category,
        severity,
        evidence,
        explanation,
        recommended_actions: recommendedActions,
        status: 'DETECTED'
      });
      
      // Log to Decision Trace
      await supabase.from('decision_traces').insert({
        workspace_id: workspaceId,
        event_name: 'BOTTLENECK_DETECTED',
        context_data: { category, severity, evidence },
        conclusion: explanation,
        proposed_action: recommendedActions[0]?.description || 'None',
        authorization_state: 'SYSTEM_DETECTED',
        result: 'Logged bottleneck for COO review'
      });
    }
  }
}

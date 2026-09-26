import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessBottleneckService } from './BusinessBottleneckService';
import { BusinessDataRegistry } from './BusinessDataRegistry';

export class COOService {
  static async executeOperationalReview(supabase: SupabaseClient, workspaceId: string): Promise<any> {
    // 1. Sync data registries to ensure we have fresh data
    await BusinessDataRegistry.syncRegistry(supabase, workspaceId);

    // 2. Evaluate bottlenecks from real evidence
    await BusinessBottleneckService.evaluateBottlenecks(supabase, workspaceId);

    // 3. Inspect stalled missions
    const { data: stalledMissions } = await supabase.from('business_missions')
      .select('id, objective')
      .eq('workspace_id', workspaceId)
      .eq('status', 'FAILED');

    let cooSummary = 'Operational state looks healthy.';
    let recommendations: any[] = [];

    const { data: bottlenecks } = await supabase.from('business_bottlenecks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'DETECTED');

    if (bottlenecks && bottlenecks.length > 0) {
      cooSummary = `Detected ${bottlenecks.length} active bottlenecks in operations.`;
      recommendations = bottlenecks.map((b: any) => ({
        type: 'BOTTLENECK_RESOLUTION',
        evidence: b.evidence,
        action: b.recommended_actions[0]?.description
      }));
    } else if (stalledMissions && stalledMissions.length > 0) {
      cooSummary = `Detected ${stalledMissions.length} stalled/failed missions.`;
      recommendations = stalledMissions.map((m: any) => ({
        type: 'MISSION_RECOVERY',
        mission_id: m.id,
        action: 'Request replan or human intervention.'
      }));
    }

    // Determine "What should we do next?"
    let whatNext = {
      priority: 'Monitor ongoing operations.',
      why: 'No critical bottlenecks or stalled missions detected.',
      impact: 'Steady state execution.',
      action: 'None',
      authorization: 'AUTO'
    };

    if (recommendations.length > 0) {
      const topIssue = recommendations[0];
      whatNext = {
        priority: `Address ${topIssue.type}`,
        why: topIssue.evidence || 'Operational blocker detected.',
        impact: 'Directly impacting active business goals.',
        action: topIssue.action,
        authorization: 'OWNER_APPROVAL_RECOMMENDED'
      };
    }

    await supabase.from('decision_traces').insert({
      workspace_id: workspaceId,
      event_name: 'COO_OPERATIONAL_REVIEW',
      context_data: { whatNext },
      conclusion: cooSummary,
      proposed_action: whatNext.priority,
      authorization_state: 'SYSTEM_EVALUATION',
      result: 'Summary updated for Command Center'
    });

    return {
      cooSummary,
      whatNext,
      bottlenecks: bottlenecks || [],
      stalledMissions: stalledMissions || []
    };
  }
}

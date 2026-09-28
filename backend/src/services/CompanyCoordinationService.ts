import { SupabaseClient } from '@supabase/supabase-js';
import { CEOCapability } from './CEOCapability';
import { ExecutiveRegistry } from './ExecutiveRegistry';

export class CompanyCoordinationService {
  static async createDependency(supabase: SupabaseClient, workspaceId: string, sourceObjectiveId: string, blockingObjectiveId: string, sourceExecutive: string, blockingExecutive: string, reason: string) {
    await supabase.from('objective_dependencies').insert({
      workspace_id: workspaceId,
      source_objective_id: sourceObjectiveId,
      blocking_objective_id: blockingObjectiveId,
      source_executive: sourceExecutive,
      blocking_executive: blockingExecutive,
      relationship_type: 'BLOCKS',
      reason,
      status: 'OPEN',
      authority: 'AUTONOMOUS'
    });

    // Mark the source objective as BLOCKED
    await supabase.from('business_goals')
      .update({ operating_status: 'BLOCKED' })
      .eq('id', sourceObjectiveId);
  }

  static async resolveDependencies(supabase: SupabaseClient, workspaceId: string, resolvedObjectiveId: string, resolutionEvidence: string) {
    const { data: dependencies } = await supabase.from('objective_dependencies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('blocking_objective_id', resolvedObjectiveId)
      .eq('status', 'OPEN');

    if (dependencies && dependencies.length > 0) {
      for (const dep of dependencies) {
        await supabase.from('objective_dependencies').update({
          status: 'RESOLVED',
          resolved_at: new Date().toISOString(),
          resolution_evidence: resolutionEvidence
        }).eq('id', dep.id);

        // Unblock the source objective
        await supabase.from('business_goals')
          .update({ operating_status: 'ACTIVE' })
          .eq('id', dep.source_objective_id)
          .eq('operating_status', 'BLOCKED'); // Only if it's currently BLOCKED
      }
    }
  }

  static async determineCompanyNextAction(supabase: SupabaseClient, workspaceId: string) {
    const ceo = new CEOCapability();
    const context = await ceo.loadDomainContext(supabase, workspaceId);
    
    // Check dependencies
    const { data: openDeps } = await supabase.from('objective_dependencies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'OPEN');

    // Add dependencies to context
    context.dependencies = openDeps || [];

    const diagnostic = await ceo.diagnose({ objective: 'Determine highest company priority' }, {}, context);
    
    const { data: approvals } = await supabase.from('approvals').select('*').eq('workspace_id', workspaceId).eq('status', 'PENDING_APPROVAL');
    let currentPriority = 'Monitor operations';
    let companyState = 'ON_TRACK';
    let responsibleExecutive = 'COO';
    let reason = 'Operations are healthy.';
    let authority = 'AUTONOMOUS';
    let founderAttentionRequired = false;
    let expectedOutcome = 'Continue monitoring.';

    // If there is an open dependency, it's a blocker
    if (approvals && approvals.length > 0) {
       companyState = 'WAITING_FOR_FOUNDER';
       currentPriority = 'Review pending approval: ' + approvals[0].action;
       reason = approvals[0].reason;
       responsibleExecutive = 'FOUNDER';
       authority = 'APPROVAL_REQUIRED';
       founderAttentionRequired = true;
       expectedOutcome = 'Authorized action to proceed.';
    } else if (openDeps && openDeps.length > 0) {
       companyState = 'ATTENTION';
       currentPriority = `Resolve ${openDeps[0].blocking_executive} dependency blocking ${openDeps[0].source_executive}`;
       reason = openDeps[0].reason;
       responsibleExecutive = openDeps[0].blocking_executive;
    } else if (diagnostic.currentBottleneck && diagnostic.currentBottleneck !== 'Unknown') {
       companyState = 'ATTENTION';
       currentPriority = diagnostic.currentBottleneck;
       reason = 'Identified bottleneck requires attention.';
       responsibleExecutive = ExecutiveRegistry.getCapabilityForObjective(diagnostic.currentBottleneck)?.role || 'CEO';
    } else if (context.activeGoals && context.activeGoals.length > 0) {
       currentPriority = context.activeGoals[0].objective;
       responsibleExecutive = ExecutiveRegistry.getCapabilityForObjective(context.activeGoals[0].objective)?.role || 'COO';
       reason = 'Executing primary business goal.';
    }

    return {
      companyState,
      currentPriority,
      reason,
      evidence: diagnostic.knownFacts || [],
      responsibleExecutive,
      authority,
      expectedOutcome,
      verificationCriteria: 'Automatic verification via outcome engine.',
      founderAttentionRequired,
      nextAction: `Delegate to ${responsibleExecutive}`
    };
  }
}


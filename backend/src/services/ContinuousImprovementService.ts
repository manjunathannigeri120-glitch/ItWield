/**
 * ContinuousImprovementService
 *
 * Detects meaningful patterns in verified historical company data and
 * generates evidence-backed improvement proposals.
 *
 * SECURITY BOUNDARIES (PERMANENT):
 * - Cannot modify AuthorizationRegistry
 * - Cannot expand permissions
 * - Cannot bypass owner approval
 * - Cannot store secrets in evidence
 * - Cannot infer permanent authority from historical decisions
 * - All executable actions must pass AuthorizationRegistry.authorize()
 * - Pricing/billing actions are permanently blocked
 */

import { AuthorizationRegistry } from './AuthorizationRegistry';
import { CompanyMemoryService } from './CompanyMemoryService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImprovementCategory =
  | 'OPERATIONS' | 'RELIABILITY' | 'PRODUCT' | 'CUSTOMER'
  | 'MARKETING' | 'COMPETITIVE' | 'GOAL_ALIGNMENT' | 'WORKFORCE';

export type ImprovementSourceType =
  | 'INCIDENT_PATTERN' | 'FAILURE_PATTERN' | 'SUCCESS_PATTERN'
  | 'OWNER_PATTERN' | 'GOAL_GAP' | 'COMPETITOR_PATTERN' | 'SYSTEM';

export type ImprovementConfidence = 'low' | 'medium' | 'high';

export interface ImprovementEvidence {
  facts: string[];                // Verified DB-backed facts only
  interpretation: string;         // What the pattern means
  recommendation: string;         // What to consider doing
  sourceIds: string[];            // Actual DB record IDs supporting this
  windowDays: number;             // Time window examined
  counts: Record<string, number>; // Key metric counts
}

export interface CreateProposalParams {
  workspaceId: string;
  title: string;
  category: ImprovementCategory;
  pattern: string;
  problem: string;
  proposedSolution: string;
  evidence: ImprovementEvidence;
  confidence: ImprovementConfidence;
  sourceType: ImprovementSourceType;
  sourceIds: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  routedToExecutive: string;
  fingerprint: string;            // Deduplication key
}

// ─── PERMANENTLY BLOCKED categories for evidence/proposals ───────────────────
const BLOCKED_CATEGORIES_IN_EVIDENCE = [
  'password', 'api_key', 'secret', 'sk-ant-', 'credential', 'token',
  'billing', 'change_pricing', 'change_subscription', 'send_money'
];

const BLOCKED_ACTIONS = [
  'CHANGE_PRICING', 'CHANGE_SUBSCRIPTION_PRICE', 'CHANGE_DISCOUNT',
  'CHANGE_BILLING_AMOUNT', 'CHANGE_CREDITS', 'CHANGE_PAYMENT_TERMS',
  'DELETE_DATABASE', 'SEND_MONEY', 'MODIFY_AUTH', 'MODIFY_RLS',
  'MODIFY_SECURITY_POLICY', 'MODIFY_SYSTEM_PROMPT', 'MODIFY_PERMISSIONS'
];

/** Executive routing by category */
const CATEGORY_EXECUTIVE_MAP: Record<ImprovementCategory, string> = {
  RELIABILITY:    'AI CTO',
  PRODUCT:        'AI CTO',
  OPERATIONS:     'AI CEO',
  WORKFORCE:      'AI CEO',
  GOAL_ALIGNMENT: 'AI CEO',
  COMPETITIVE:    'AI CMO',
  MARKETING:      'AI CMO',
  CUSTOMER:       'AI CMO',
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class ContinuousImprovementService {

  /**
   * Main entry point called by the scheduler (via observeWorkspace).
   * Runs all pattern detectors and creates proposals for significant findings.
   * Uses a 6-hour cooldown per workspace to avoid proposal spam.
   */
  static async analyzeWorkspace(supabase: any, workspaceId: string): Promise<void> {
    if (!workspaceId) return;

    // Cooldown: only analyze once every 6 hours per workspace
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    try {
      const { data: recentProposals } = await supabase
        .from('improvement_proposals')
        .select('id, created_at')
        .eq('workspace_id', workspaceId)
        .gt('created_at', sixHoursAgo)
        .limit(1);

      if (recentProposals && recentProposals.length > 0) {
        return; // Cooldown active
      }
    } catch {
      return; // Fail safe — don't analyze if check fails
    }

    await ContinuousImprovementService.detectPatterns(supabase, workspaceId);
  }

  /**
   * Runs all pattern detectors. Each detector is independent and fail-safe.
   */
  static async detectPatterns(supabase: any, workspaceId: string): Promise<void> {
    const detectors = [
      ContinuousImprovementService.detectRepeatedIncidents,
      ContinuousImprovementService.detectRepeatedFailedActions,
      ContinuousImprovementService.detectRepeatedSuccessfulActions,
      ContinuousImprovementService.detectRepeatedOwnerRejections,
      ContinuousImprovementService.detectRepeatedOwnerApprovals,
      ContinuousImprovementService.detectGoalStagnation,
      ContinuousImprovementService.detectCompetitorPatterns,
    ];

    for (const detector of detectors) {
      try {
        await detector(supabase, workspaceId);
      } catch (e: any) {
        console.error(`[ContinuousImprovement] Pattern detector failed: ${e.message}`);
      }
    }
  }

  // ─── Pattern A: Repeated Incidents ────────────────────────────────────────

  static async detectRepeatedIncidents(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 14;
    const threshold = 3;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('id, type, severity, title, created_at')
      .eq('workspace_id', workspaceId)
      .gt('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !incidents || incidents.length < threshold) return;

    const sourceIds = incidents.map((i: any) => i.id);
    const typeGroups: Record<string, any[]> = {};
    for (const inc of incidents) {
      typeGroups[inc.type] = typeGroups[inc.type] || [];
      typeGroups[inc.type].push(inc);
    }

    for (const [incType, group] of Object.entries(typeGroups)) {
      if (group.length < threshold) continue;

      const fingerprint = `${workspaceId}:RELIABILITY:repeated_incidents:${incType.toLowerCase().replace(/\s+/g, '_')}`;

      const confidence: ImprovementConfidence =
        group.length >= 5 ? 'high' : group.length >= 3 ? 'medium' : 'low';

      const evidence: ImprovementEvidence = {
        facts: [
          `${group.length} verified incidents of type "${incType}" detected in the last ${windowDays} days.`,
          `Incident IDs: ${group.slice(0, 3).map((i: any) => i.id).join(', ')}${group.length > 3 ? '...' : ''}.`,
        ],
        interpretation: `A recurring pattern of "${incType}" incidents suggests a systemic reliability issue.`,
        recommendation: `Investigate root cause of repeated "${incType}" incidents and increase post-incident monitoring priority.`,
        sourceIds: group.map((i: any) => i.id),
        windowDays,
        counts: { incidentCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Repeated ${incType} incidents detected`,
        category: 'RELIABILITY',
        pattern: `${group.length} incidents of type "${incType}" in ${windowDays} days`,
        problem: `Application reliability is affected by recurring "${incType}" incidents.`,
        proposedSolution: `Increase investigation priority for "${incType}" incidents. Review deployment procedures and add diagnostic monitoring.`,
        evidence,
        confidence,
        sourceType: 'INCIDENT_PATTERN',
        sourceIds: group.map((i: any) => i.id),
        riskLevel: 'LOW',
        routedToExecutive: 'AI CTO',
        fingerprint,
      });
    }
  }

  // ─── Pattern B: Repeated Failed Actions ────────────────────────────────────

  static async detectRepeatedFailedActions(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 7;
    const threshold = 2;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: failedTasks, error } = await supabase
      .from('tasks')
      .select('id, title, input, status, error, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'FAILED')
      .gt('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !failedTasks || failedTasks.length < threshold) return;

    // Group by task_type
    const typeGroups: Record<string, any[]> = {};
    for (const task of failedTasks) {
      const taskType = task.input?.task_type || task.title;
      typeGroups[taskType] = typeGroups[taskType] || [];
      typeGroups[taskType].push(task);
    }

    for (const [taskType, group] of Object.entries(typeGroups)) {
      if (group.length < threshold) continue;

      const fingerprint = `${workspaceId}:OPERATIONS:repeated_failures:${taskType.toLowerCase().replace(/\s+/g, '_')}`;

      const confidence: ImprovementConfidence = group.length >= 4 ? 'high' : 'medium';

      const evidence: ImprovementEvidence = {
        facts: [
          `${group.length} tasks of type "${taskType}" failed within the last ${windowDays} days.`,
          `First failure: ${group[group.length - 1]?.created_at?.split('T')[0] || 'unknown'}.`,
          `Latest failure: ${group[0]?.created_at?.split('T')[0] || 'unknown'}.`,
        ],
        interpretation: `Repeated failures in "${taskType}" indicate either a systemic issue or external dependency problem.`,
        recommendation: `Investigate the failure pattern for "${taskType}". Check external dependencies, timeouts, and error messages.`,
        sourceIds: group.map((t: any) => t.id),
        windowDays,
        counts: { failedTaskCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Repeated failures in ${taskType}`,
        category: 'OPERATIONS',
        pattern: `${group.length} failed "${taskType}" tasks in ${windowDays} days`,
        problem: `"${taskType}" is repeatedly failing, reducing operational reliability.`,
        proposedSolution: `Diagnose the root cause of repeated "${taskType}" failures. Review error logs and consider adding retry logic or external dependency health checks.`,
        evidence,
        confidence,
        sourceType: 'FAILURE_PATTERN',
        sourceIds: group.map((t: any) => t.id),
        riskLevel: 'LOW',
        routedToExecutive: 'AI CTO',
        fingerprint,
      });
    }
  }

  // ─── Pattern C: Repeated Successful Actions (Operational Strengths) ────────

  static async detectRepeatedSuccessfulActions(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 14;
    const threshold = 5;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: successTasks, error } = await supabase
      .from('tasks')
      .select('id, title, input, completed_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'COMPLETED')
      .gt('completed_at', windowStart)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (error || !successTasks || successTasks.length < threshold) return;

    const typeGroups: Record<string, any[]> = {};
    for (const task of successTasks) {
      const taskType = task.input?.task_type || 'GENERAL';
      typeGroups[taskType] = typeGroups[taskType] || [];
      typeGroups[taskType].push(task);
    }

    for (const [taskType, group] of Object.entries(typeGroups)) {
      if (group.length < threshold) continue;

      const fingerprint = `${workspaceId}:OPERATIONS:operational_strength:${taskType.toLowerCase().replace(/\s+/g, '_')}`;

      const evidence: ImprovementEvidence = {
        facts: [
          `${group.length} "${taskType}" tasks completed successfully in the last ${windowDays} days.`,
          `This represents a verified operational strength.`,
        ],
        interpretation: `"${taskType}" is reliably functioning and producing verified results.`,
        recommendation: `Continue prioritizing "${taskType}" as a core operational capability. Consider expanding its scope if appropriate.`,
        sourceIds: group.slice(0, 10).map((t: any) => t.id),
        windowDays,
        counts: { successCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Operational strength: ${taskType} reliably succeeding`,
        category: 'OPERATIONS',
        pattern: `${group.length} successful "${taskType}" tasks in ${windowDays} days`,
        problem: `No problem — this is a positive operational pattern worth tracking.`,
        proposedSolution: `Maintain current "${taskType}" operations. No immediate changes needed.`,
        evidence,
        confidence: 'high',
        sourceType: 'SUCCESS_PATTERN',
        sourceIds: group.slice(0, 10).map((t: any) => t.id),
        riskLevel: 'LOW',
        routedToExecutive: CATEGORY_EXECUTIVE_MAP['OPERATIONS'],
        fingerprint,
      });
    }
  }

  // ─── Pattern D: Repeated Owner Rejections ─────────────────────────────────

  static async detectRepeatedOwnerRejections(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 30;
    const threshold = 2;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: rejectedApprovals, error } = await supabase
      .from('approvals')
      .select('id, action, title, resolution_reason, resolved_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'REJECTED')
      .gt('resolved_at', windowStart)
      .order('resolved_at', { ascending: false })
      .limit(50);

    if (error || !rejectedApprovals || rejectedApprovals.length < threshold) return;

    const actionGroups: Record<string, any[]> = {};
    for (const approval of rejectedApprovals) {
      const action = approval.action || 'UNKNOWN';
      actionGroups[action] = actionGroups[action] || [];
      actionGroups[action].push(approval);
    }

    for (const [action, group] of Object.entries(actionGroups)) {
      if (group.length < threshold) continue;

      // Safety: Do NOT permanently prohibit future actions based on this
      // Owner preference is recorded as historical context only
      const fingerprint = `${workspaceId}:OWNER_PATTERN:repeated_rejections:${action.toLowerCase()}`;

      const confidence: ImprovementConfidence = group.length >= 4 ? 'high' : 'medium';

      const evidence: ImprovementEvidence = {
        facts: [
          `Owner rejected "${action}" proposals ${group.length} times in the last ${windowDays} days.`,
          `IMPORTANT: This is historical context only. Future decisions remain governed by current authorization and company policy.`,
          `NOTE: This pattern does NOT create a permanent prohibition.`,
        ],
        interpretation: `Owner has repeatedly declined "${action}" proposals. This may indicate a preference against this category of change.`,
        recommendation: `Record owner preference pattern. Consider whether future "${action}" proposals need stronger justification or different framing.`,
        sourceIds: group.map((a: any) => a.id),
        windowDays,
        counts: { rejectionCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Owner repeatedly declined ${action} proposals`,
        category: 'WORKFORCE',
        pattern: `${group.length} rejections of "${action}" in ${windowDays} days`,
        problem: `Owner has declined similar proposals multiple times, suggesting a preference pattern.`,
        proposedSolution: `Record this preference as historical context. Future proposals of this type should provide stronger evidence and justification. This does NOT prohibit future proposals.`,
        evidence,
        confidence,
        sourceType: 'OWNER_PATTERN',
        sourceIds: group.map((a: any) => a.id),
        riskLevel: 'LOW',
        routedToExecutive: 'AI CEO',
        fingerprint,
      });
    }
  }

  // ─── Pattern E: Repeated Owner Approvals ──────────────────────────────────

  static async detectRepeatedOwnerApprovals(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 30;
    const threshold = 3;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: approvedApprovals, error } = await supabase
      .from('approvals')
      .select('id, action, title, resolved_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'APPROVED')
      .gt('resolved_at', windowStart)
      .order('resolved_at', { ascending: false })
      .limit(50);

    if (error || !approvedApprovals || approvedApprovals.length < threshold) return;

    const actionGroups: Record<string, any[]> = {};
    for (const approval of approvedApprovals) {
      const action = approval.action || 'UNKNOWN';
      actionGroups[action] = actionGroups[action] || [];
      actionGroups[action].push(approval);
    }

    for (const [action, group] of Object.entries(actionGroups)) {
      if (group.length < threshold) continue;

      // CRITICAL SAFETY: Historical approval MUST NOT expand permissions
      // AuthorizationRegistry is always authoritative regardless of this pattern
      const fingerprint = `${workspaceId}:OWNER_PATTERN:repeated_approvals:${action.toLowerCase()}`;

      const evidence: ImprovementEvidence = {
        facts: [
          `Owner approved "${action}" proposals ${group.length} times in the last ${windowDays} days.`,
          `CRITICAL: Historical approvals do NOT expand autonomous permissions.`,
          `AuthorizationRegistry remains the sole authority for what actions are allowed.`,
        ],
        interpretation: `Owner has consistently approved "${action}" — this is historical behavior, not a permission change.`,
        recommendation: `This pattern is informational only. No permission or authorization changes are made.`,
        sourceIds: group.map((a: any) => a.id),
        windowDays,
        counts: { approvalCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Owner frequently approves ${action} proposals`,
        category: 'WORKFORCE',
        pattern: `${group.length} approvals of "${action}" in ${windowDays} days — historical behavior only`,
        problem: `This is informational, not a problem.`,
        proposedSolution: `No change recommended. AuthorizationRegistry remains authoritative. Historical approvals are noted as context only.`,
        evidence,
        confidence: 'medium',
        sourceType: 'OWNER_PATTERN',
        sourceIds: group.map((a: any) => a.id),
        riskLevel: 'LOW',
        routedToExecutive: 'AI CEO',
        fingerprint,
      });
    }
  }

  // ─── Pattern F: Goal Stagnation ───────────────────────────────────────────

  static async detectGoalStagnation(supabase: any, workspaceId: string): Promise<void> {
    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .select('company_goals')
      .eq('id', workspaceId)
      .single();

    if (wsErr || !workspace?.company_goals?.trim()) return;

    const goals = workspace.company_goals.trim();
    const windowDays = 14;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Look for completed tasks that address customer/acquisition goals
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('id, title, input, completed_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'COMPLETED')
      .gt('completed_at', windowStart)
      .order('completed_at', { ascending: false })
      .limit(50);

    const goalsLower = goals.toLowerCase();
    const goalKeywords = ['customer', 'acquire', 'revenue', 'growth', 'user', 'sale', 'market'];
    const isCustomerGoal = goalKeywords.some(k => goalsLower.includes(k));

    if (!isCustomerGoal) return; // Only check goal stagnation for customer/growth goals

    const relevantCompleted = (completedTasks || []).filter((t: any) => {
      const taskType = t.input?.task_type || '';
      // COMPETITIVE_ANALYSIS and GOAL_ALIGNMENT tasks are relevant to customer acquisition
      return taskType === 'COMPETITIVE_ANALYSIS' || taskType === 'GOAL_ALIGNMENT' ||
             t.title?.toLowerCase().includes('customer') ||
             t.title?.toLowerCase().includes('acquisition');
    });

    if (relevantCompleted.length > 0) return; // Goal is being addressed

    const fingerprint = `${workspaceId}:GOAL_ALIGNMENT:stagnation:customer_acquisition`;

    const evidence: ImprovementEvidence = {
      facts: [
        `Company goal states: "${goals.substring(0, 200)}".`,
        `No completed customer acquisition or growth-related tasks found in the last ${windowDays} days.`,
        `FACT: Goal exists but no verified completed action addresses it in this window.`,
      ],
      interpretation: `The stated customer acquisition goal is not currently being addressed by completed autonomous actions.`,
      recommendation: `Consider initiating competitive analysis or market research tasks to begin working toward stated customer acquisition goals.`,
      sourceIds: [],
      windowDays,
      counts: { relevantCompletedTasks: 0, goalLength: goals.length }
    };

    await ContinuousImprovementService.createProposal(supabase, {
      workspaceId,
      title: 'Customer acquisition goal remains unaddressed',
      category: 'GOAL_ALIGNMENT',
      pattern: `Stated goal active for ${windowDays}+ days with no completed relevant tasks`,
      problem: `The company's stated customer acquisition goal has no verified completed actions addressing it.`,
      proposedSolution: `Initiate competitive analysis or goal-alignment review to address stated customer acquisition objectives.`,
      evidence,
      confidence: 'medium',
      sourceType: 'GOAL_GAP',
      sourceIds: [],
      riskLevel: 'LOW',
      routedToExecutive: 'AI CEO',
      fingerprint,
    });
  }

  // ─── Pattern G: Competitor Patterns ───────────────────────────────────────

  static async detectCompetitorPatterns(supabase: any, workspaceId: string): Promise<void> {
    const windowDays = 30;
    const threshold = 2;
    const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: observations, error } = await supabase
      .from('competitor_observations')
      .select('id, competitor_id, type, title, description, significance, created_at')
      .eq('workspace_id', workspaceId)
      .gt('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !observations || observations.length < threshold) return;

    // Group by observation type
    const typeGroups: Record<string, any[]> = {};
    for (const obs of observations) {
      typeGroups[obs.type] = typeGroups[obs.type] || [];
      typeGroups[obs.type].push(obs);
    }

    for (const [obsType, group] of Object.entries(typeGroups)) {
      if (group.length < threshold) continue;

      const fingerprint = `${workspaceId}:COMPETITIVE:competitor_pattern:${obsType.toLowerCase()}`;

      const confidence: ImprovementConfidence = group.length >= 4 ? 'high' : 'medium';

      const evidence: ImprovementEvidence = {
        facts: [
          `${group.length} competitor observations of type "${obsType}" detected in the last ${windowDays} days.`,
          `Observation titles: ${group.slice(0, 3).map((o: any) => `"${o.title}"`).join(', ')}.`,
        ],
        interpretation: `Multiple competitors are making similar moves in the "${obsType}" category. This may indicate a market trend.`,
        recommendation: `Investigate the "${obsType}" trend. Consider whether this requires a strategic response. Do NOT automatically copy competitor changes.`,
        sourceIds: group.map((o: any) => o.id),
        windowDays,
        counts: { observationCount: group.length }
      };

      await ContinuousImprovementService.createProposal(supabase, {
        workspaceId,
        title: `Competitor ${obsType} trend detected`,
        category: 'COMPETITIVE',
        pattern: `${group.length} competitor "${obsType}" observations in ${windowDays} days`,
        problem: `Multiple competitors are making "${obsType}" changes that may require strategic attention.`,
        proposedSolution: `Review competitor "${obsType}" observations and determine if investigation or strategic response is warranted. No automatic changes.`,
        evidence,
        confidence,
        sourceType: 'COMPETITOR_PATTERN',
        sourceIds: group.map((o: any) => o.id),
        riskLevel: 'LOW',
        routedToExecutive: 'AI CMO',
        fingerprint,
      });
    }
  }

  // ─── Core: Create Proposal (Deduplication-safe) ────────────────────────────

  static async createProposal(supabase: any, params: CreateProposalParams): Promise<string | null> {
    if (!params.workspaceId) return null;

    // SECURITY: Block secrets from evidence
    const evidenceStr = JSON.stringify(params.evidence);
    for (const blocked of BLOCKED_CATEGORIES_IN_EVIDENCE) {
      if (evidenceStr.toLowerCase().includes(blocked)) {
        console.error('[ContinuousImprovement] Security: Blocked sensitive content in evidence');
        return null;
      }
    }

    // SECURITY: Block pricing/security actions from becoming proposals
    const proposalStr = (params.proposedSolution + params.title + params.pattern).toLowerCase();
    for (const blocked of BLOCKED_ACTIONS) {
      if (proposalStr.includes(blocked.toLowerCase())) {
        console.error('[ContinuousImprovement] Security: Blocked prohibited action in proposal');
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('improvement_proposals')
        .insert({
          workspace_id: params.workspaceId,
          title: params.title,
          problem: params.problem,
          proposed_solution: params.proposedSolution,
          state: 'PROPOSED',
          risk_level: params.riskLevel,
          category: params.category,
          pattern: params.pattern,
          evidence: params.evidence,
          confidence: params.confidence,
          source_type: params.sourceType,
          source_ids: params.sourceIds,
          fingerprint: params.fingerprint,
          routed_to_executive: params.routedToExecutive,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint on fingerprint — proposal already exists, skip silently
          return null;
        }
        console.error('[ContinuousImprovement] Failed to create proposal:', error.message);
        return null;
      }

      console.log(`[ContinuousImprovement] Proposal created: ${data.id} - ${params.title}`);
      return data.id;
    } catch (e: any) {
      console.error('[ContinuousImprovement] createProposal error:', e.message);
      return null;
    }
  }

  // ─── Retrieve active proposals (bounded) ──────────────────────────────────

  static async getActiveProposals(supabase: any, workspaceId: string, limit = 10): Promise<any[]> {
    if (!workspaceId) return [];
    try {
      const { data, error } = await supabase
        .from('improvement_proposals')
        .select('id, title, category, pattern, evidence, confidence, state, risk_level, source_type, routed_to_executive, created_at')
        .eq('workspace_id', workspaceId)
        .in('state', ['PROPOSED', 'VALIDATING', 'APPROVAL_REQUIRED', 'APPROVED', 'IMPLEMENTING'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  // ─── Dismiss a proposal ───────────────────────────────────────────────────

  static async dismissProposal(supabase: any, proposalId: string, workspaceId: string): Promise<boolean> {
    if (!proposalId || !workspaceId) return false;
    try {
      const { error } = await supabase
        .from('improvement_proposals')
        .update({ state: 'DISMISSED', dismissed_at: new Date().toISOString() })
        .eq('id', proposalId)
        .eq('workspace_id', workspaceId)
        .in('state', ['PROPOSED', 'VALIDATING']);

      return !error;
    } catch {
      return false;
    }
  }

  // ─── Validate and authorize a proposal before execution ───────────────────

  static validateAndAuthorize(actionId: string, permissions: Record<string, boolean> = {}): {
    authorized: boolean;
    reason: string;
    requiresApproval: boolean;
  } {
    // SECURITY: Never allow pricing/security actions
    if (BLOCKED_ACTIONS.includes(actionId)) {
      return {
        authorized: false,
        reason: `Action "${actionId}" is permanently blocked and cannot be proposed as an improvement.`,
        requiresApproval: false,
      };
    }

    // Delegate to the authoritative AuthorizationRegistry
    const result = AuthorizationRegistry.authorize(actionId, permissions);
    return {
      authorized: result.authorized,
      reason: result.reason,
      requiresApproval: result.requiresApproval,
    };
  }

  // ─── Record improvement outcome ───────────────────────────────────────────

  static async recordImprovementOutcome(
    supabase: any,
    proposalId: string,
    workspaceId: string,
    result: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'INCONCLUSIVE',
    verificationDetails: string
  ): Promise<void> {
    try {
      const newState = result === 'SUCCESS' ? 'COMPLETED' : result === 'FAILURE' ? 'FAILED' : 'COMPLETED';

      const { data: proposal } = await supabase
        .from('improvement_proposals')
        .update({
          state: newState,
          verification_result: `${result}: ${verificationDetails}`,
          implemented_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .eq('workspace_id', workspaceId)
        .select('title, category')
        .single();

      // Record in Company Memory
      if (proposal) {
        if (result === 'SUCCESS') {
          await CompanyMemoryService.recordOutcome(
            workspaceId,
            `Improvement verified: ${proposal.title}`,
            `${verificationDetails}\n\nNOTE: Execution success is not automatically business success. Outcome is marked as verified based on available evidence.`,
            `improvement:${proposalId}`,
            'SYSTEM',
            supabase
          );
        } else {
          await CompanyMemoryService.recordLesson(
            workspaceId,
            `Improvement outcome: ${result} — ${proposal.title}`,
            `${verificationDetails}\n\nLesson: ${result === 'FAILURE' ? 'This improvement approach did not produce expected results.' : 'Result was inconclusive.'}`,
            `improvement:${proposalId}`,
            'SYSTEM',
            supabase
          );
        }
      }
    } catch (e: any) {
      console.error('[ContinuousImprovement] recordImprovementOutcome error:', e.message);
    }
  }

  // ─── Format proposals for CEO context ─────────────────────────────────────

  static formatProposalsForContext(proposals: any[]): string {
    if (!proposals || proposals.length === 0) return '';

    let context = `\n==================================================\n`;
    context += `ACTIVE IMPROVEMENT PROPOSALS (Evidence-backed patterns)\n`;
    context += `(These are patterns, not guarantees. Verify before acting.)\n`;
    context += `==================================================\n\n`;

    for (const p of proposals) {
      context += `[${p.category}] ${p.title}\n`;
      context += `Pattern: ${p.pattern}\n`;
      context += `Confidence: ${p.confidence}\n`;
      context += `Status: ${p.state}\n\n`;
    }

    return context;
  }
}

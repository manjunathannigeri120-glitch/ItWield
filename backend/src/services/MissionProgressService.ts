import { SupabaseClient } from '@supabase/supabase-js';

export interface MissionProgress {
  missionId: string;
  status: string;
  target: {
    count: number | null;
    type: string;
  };
  work: {
    planned: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    blocked: number;
  };
  results: {
    produced: number;
    verified: number;
    unverified: number;
    rejected: number;
  };
  progress: {
    measurable: boolean;
    percent: number | null;
    basis: string;
  };
  nextAction: string | null;
  blocker: {
    type: string;
    description: string;
  } | null;
  successCriteria: string | null;
  completionEligible: boolean;
  lastActivityAt: string | null;
  lastVerifiedAt: string | null;
}

export class MissionProgressService {
  /**
   * Derives truthful mission state from authoritative database records.
   * Does NOT mutate state. Does NOT orchestrate.
   */
  static async calculateProgress(supabase: SupabaseClient, workspaceId: string, missionId: string): Promise<MissionProgress> {
    // 1. Fetch the mission itself
    const { data: mission, error: missionErr } = await supabase
      .from('business_missions')
      .select('status, type, success_criteria, target_count, updated_at')
      .eq('id', missionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (missionErr || !mission) {
      throw new Error('Mission ' + missionId + ' not found in workspace ' + workspaceId + '.');
    }

    // 2. Fetch Tasks bound to this mission
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('id, status, error, updated_at')
      .eq('mission_id', missionId)
      .eq('workspace_id', workspaceId);
      
    // 3. Fetch Mission Results
    const { data: results, error: resultsErr } = await supabase
      .from('mission_results')
      .select('id, verification_status, verified_at, created_at')
      .eq('mission_id', missionId)
      .eq('workspace_id', workspaceId);

    // 4. Check for Approvals
    // Since approvals map to tasks, we extract the task IDs.
    const taskIds = (tasks || []).map(t => t.id);
    let pendingApprovals: any[] = [];
    if (taskIds.length > 0) {
      const { data: appData } = await supabase
        .from('approvals')
        .select('id, status, task_id')
        .in('task_id', taskIds)
        .eq('workspace_id', workspaceId)
        .eq('status', 'PENDING_APPROVAL');
      if (appData) {
        pendingApprovals = appData;
      }
    }

    // --- AGGREGATE WORK STATS ---
    const work = { planned: 0, pending: 0, running: 0, completed: 0, failed: 0, blocked: 0 };
    let latestTaskActivity = mission.updated_at;
    let mostRecentErrorTask = null;

    for (const t of (tasks || [])) {
      work.planned++;
      if (['PENDING', 'ASSIGNED'].includes(t.status)) work.pending++;
      else if (t.status === 'RUNNING') work.running++;
      else if (t.status === 'COMPLETED') work.completed++;
      else if (t.status === 'FAILED') {
        work.failed++;
        if (!mostRecentErrorTask || new Date(t.updated_at) > new Date(mostRecentErrorTask.updated_at)) {
          mostRecentErrorTask = t;
        }
      }
      else if (['BLOCKED', 'ESCALATED'].includes(t.status)) work.blocked++;

      if (!latestTaskActivity || new Date(t.updated_at) > new Date(latestTaskActivity)) {
        latestTaskActivity = t.updated_at;
      }
    }

    // --- AGGREGATE RESULT STATS ---
    const resStats = { produced: 0, verified: 0, unverified: 0, rejected: 0 };
    let lastVerifiedAt = null;

    for (const r of (results || [])) {
      resStats.produced++;
      if (r.verification_status === 'VERIFIED') {
        resStats.verified++;
        if (!lastVerifiedAt || (r.verified_at && new Date(r.verified_at) > new Date(lastVerifiedAt))) {
          lastVerifiedAt = r.verified_at;
        }
      } else if (r.verification_status === 'REJECTED') {
        resStats.rejected++;
      } else {
        resStats.unverified++;
      }
    }

    // --- CALCULATE PROGRESS ---
    const progress = {
      measurable: false,
      percent: null as number | null,
      basis: 'Progress not yet measurable'
    };

    let completionEligible = false;

    if (mission.target_count && mission.target_count > 0) {
      progress.measurable = true;
      let pct = (resStats.verified / mission.target_count) * 100;
      if (pct > 100) pct = 100;
      if (pct < 0) pct = 0;
      progress.percent = Math.floor(pct);
      progress.basis = resStats.verified + ' of ' + mission.target_count + ' verified';
      
      if (resStats.verified >= mission.target_count) {
        completionEligible = true;
      }
    }

    // --- DETERMINE BLOCKER ---
    let blocker = null;
    if (mission.status === 'PAUSED') {
      blocker = { type: 'PAUSED', description: 'Mission is paused by the owner.' };
    } else if (pendingApprovals.length > 0) {
      blocker = { type: 'OWNER_APPROVAL_REQUIRED', description: 'Owner approval is required.' };
    } else if (mostRecentErrorTask && mostRecentErrorTask.error) {
      const errStr = String(mostRecentErrorTask.error).toUpperCase();
      if (errStr.includes('CONNECTION_NOT_FOUND') || errStr.includes('CONNECTION_UNAUTHORIZED') || errStr.includes('CONNECTION')) {
        blocker = { type: 'CONNECTION_REQUIRED', description: 'A business connection is required.' };
      } else if (errStr.includes('SAFE CAPABILITY') || errStr.includes('NO SAFE ACTION')) {
        blocker = { type: 'NO_SAFE_ACTION', description: 'No safe authorized action is currently available.' };
      } else {
        blocker = { type: 'TASK_FAILURE', description: 'A task failed and blocked progress.' };
      }
    } else if (mission.status === 'BLOCKED') {
      blocker = { type: 'BLOCKED', description: 'Mission is blocked.' };
    }

    // --- DETERMINE NEXT ACTION ---
    let nextAction = null;
    if (blocker) {
      // If blocked, the next action is typically to resolve the blocker
      nextAction = 'Resolve blocker to continue.';
      if (blocker.type === 'OWNER_APPROVAL_REQUIRED') nextAction = 'Review pending approvals.';
      if (blocker.type === 'CONNECTION_REQUIRED') nextAction = 'Connect required integration.';
    } else if (mission.status === 'COMPLETED') {
      nextAction = 'Mission is completed.';
    } else if (mission.status === 'CANCELLED') {
      nextAction = 'Mission was cancelled.';
    } else if (completionEligible) {
      nextAction = 'Success criteria reached; mission is ready for completion.';
    } else if (work.running > 0) {
      nextAction = 'Waiting for current work to finish.';
    } else if (work.pending > 0) {
      nextAction = 'Scheduled work is waiting to run.';
    } else if (mission.target_count && resStats.verified < mission.target_count) {
      nextAction = 'Continue authorized mission work.';
    } else {
      nextAction = 'Assess mission state.';
    }

    return {
      missionId,
      status: mission.status,
      target: {
        count: mission.target_count,
        type: mission.type
      },
      work,
      results: resStats,
      progress,
      nextAction,
      blocker,
      successCriteria: mission.success_criteria || null,
      completionEligible,
      lastActivityAt: latestTaskActivity,
      lastVerifiedAt
    };
  }
}

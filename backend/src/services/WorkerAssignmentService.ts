import { SupabaseClient } from '@supabase/supabase-js';

export interface WorkerAssignmentCriteria {
  workspaceId: string;
  requiredCapabilities?: string[];
  requiredTools?: string[];
  authorityRequired?: string;
  riskLevel?: string;
  priority?: string;
}

export class WorkerAssignmentService {
  static async assignTask(taskId: string, criteria: WorkerAssignmentCriteria, db: SupabaseClient) {
    if (!criteria.workspaceId) throw new Error('Workspace ID is required for assignment');
    
    // 1. Fetch available workers in the workspace
    const { data: workers, error: workerErr } = await db
      .from('agents')
      .select('*')
      .eq('workspace_id', criteria.workspaceId)
      .eq('status', 'AVAILABLE');

    if (workerErr || !workers || workers.length === 0) {
      return { success: false, reason: 'No available workers in workspace' };
    }

    // 2. Score workers based on match
    let bestWorker = null;
    let highestScore = -1;

    for (const worker of workers) {
      // Hard Constraints
      if (worker.current_workload >= (worker.max_concurrent_tasks || 1)) continue;
      
      const authorityRank = this.getAuthorityRank(worker.authority_level || 'LOW');
      const reqAuthRank = this.getAuthorityRank(criteria.authorityRequired || 'LOW');
      if (authorityRank < reqAuthRank) continue;

      const riskRank = this.getRiskRank(worker.risk_ceiling || 'LOW');
      const reqRiskRank = this.getRiskRank(criteria.riskLevel || 'LOW');
      if (riskRank < reqRiskRank) continue;

      // Soft Constraints (Scoring)
      let score = 100;
      score -= (worker.current_workload * 20); // Prefer workers with less workload

      const workerCaps = worker.capabilities || [];
      const reqCaps = criteria.requiredCapabilities || [];
      for (const cap of reqCaps) {
        if (!workerCaps.includes(cap)) score -= 30; // High penalty for missing capability, but maybe still assignable if generalist
      }

      const workerTools = worker.tool_capabilities || [];
      const reqTools = criteria.requiredTools || [];
      let missingTool = false;
      for (const t of reqTools) {
        if (!workerTools.includes(t)) {
           missingTool = true;
           score -= 50;
        }
      }

      if (missingTool && reqTools.length > 0) {
          // If strict tool match is needed, skip
          // In a real system, we'd know if a tool is absolutely required
      }

      if (score > highestScore) {
        highestScore = score;
        bestWorker = worker;
      }
    }

    if (!bestWorker) {
      return { success: false, reason: 'No workers matched constraints (workload/authority/risk/capabilities)' };
    }

    // 3. Assign task transactionally (conceptually)
    const { data: updatedTask, error: updateErr } = await db
      .from('tasks')
      .update({
        assigned_agent_id: bestWorker.id,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, reason: `Failed to assign task: ${updateErr.message}` };
    }

    // Update worker workload
    await db
      .from('agents')
      .update({ current_workload: bestWorker.current_workload + 1 })
      .eq('id', bestWorker.id);

    return { success: true, workerId: bestWorker.id, task: updatedTask };
  }

  static getAuthorityRank(level: string) {
    if (level === 'CRITICAL') return 4;
    if (level === 'HIGH') return 3;
    if (level === 'MEDIUM') return 2;
    return 1; // LOW
  }

  static getRiskRank(level: string) {
    if (level === 'CRITICAL') return 4;
    if (level === 'HIGH') return 3;
    if (level === 'MEDIUM') return 2;
    return 1; // LOW
  }
}

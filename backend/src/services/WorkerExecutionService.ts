import { SupabaseClient } from '@supabase/supabase-js';
import { ControlLayerService } from './ControlLayerService';
import { CompanyMemoryService } from './CompanyMemoryService';

export class WorkerExecutionService {
  static async executeTask(taskId: string, db: SupabaseClient) {
    // 1. Fetch task and worker
    const { data: task } = await db.from('tasks').select('*, agents(*)').eq('id', taskId).single();
    if (!task) throw new Error('Task not found');
    if (!task.agents) throw new Error('Task is not assigned to a worker');

    const worker = task.agents;
    const workspaceId = task.workspace_id;

    // Transition to RUNNING
    await db.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId);

    try {
      // 2. Control Layer Authorization
      // Mock capability check based on task.required_tools
      const toolToUse = (task.required_tools && task.required_tools.length > 0) ? task.required_tools[0] : 'system.read';
      
      const authResult = await ControlLayerService.evaluateAction({
        workspaceId,
        actorId: worker.id,
        actorType: 'WORKER',
        actionType: toolToUse,
        resource: 'execution_engine',
        payload: task.input || {}
      }, db);

      if (authResult.status === 'PROHIBITED') {
        throw new Error(`Action prohibited by Control Layer: ${authResult.reason}`);
      }

      if (authResult.status === 'APPROVAL_REQUIRED') {
        await db.from('tasks').update({ status: 'WAITING_FOR_APPROVAL' }).eq('id', taskId);
        return { status: 'WAITING_FOR_APPROVAL', reason: authResult.reason };
      }

      // 3. Execution (Simulated via ToolAdapter conceptually, but we will mock success if auth passes)
      // Real execution would invoke specific ToolAdapter here.
      const result = { success: true, data: `Executed ${toolToUse} successfully` };
      const evidence = { tool: toolToUse, output: result.data };

      // 4. Update Task as COMPLETED (but unverified outcome)
      await db.from('tasks').update({
        status: 'COMPLETED',
        result: JSON.stringify(result),
        evidence: evidence,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      // Decrement workload
      await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);

      return { status: 'COMPLETED', result };
    } catch (e: any) {
      // Failure Handling
      await db.from('tasks').update({
        status: 'FAILED',
        failure_reason: e.message,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      // Decrement workload
      await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);

      // Record failure in memory
      await CompanyMemoryService.recordFailure(
        workspaceId,
        `Worker ${worker.name} failed task ${task.title}`,
        e.message,
        taskId,
        'SYSTEM',
        task.mission_id,
        { task_id: taskId, suspected_cause: e.message, status: 'FAILED' },
        db
      );

      return { status: 'FAILED', reason: e.message };
    }
  }

  static async reassignTask(taskId: string, db: SupabaseClient) {
    const { data: task } = await db.from('tasks').select('*').eq('id', taskId).single();
    if (!task) throw new Error('Task not found');
    
    // Decrement old worker workload if assigned
    if (task.assigned_agent_id) {
       const { data: worker } = await db.from('agents').select('current_workload').eq('id', task.assigned_agent_id).single();
       if (worker) {
           await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', task.assigned_agent_id);
       }
    }

    await db.from('tasks').update({
        status: 'QUEUED',
        assigned_agent_id: null,
        assigned_at: null,
        retry_count: task.retry_count + 1
    }).eq('id', taskId);

    // Caller can then re-invoke WorkerAssignmentService
    return { success: true };
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { ControlLayerService, ActionRequest } from './ControlLayerService';
import { CompanyMemoryService } from './CompanyMemoryService';

export class WorkerExecutionService {
  static async executeTask(taskId: string, db: SupabaseClient) {
    const { data: task } = await db.from('tasks').select('*, agents(*)').eq('id', taskId).single();
    if (!task) throw new Error('Task not found');
    if (!task.agents) throw new Error('Task is not assigned to a worker');

    const worker = task.agents;
    const workspaceId = task.workspace_id;

    // Verify Emergency Stop state
    const { data: ws } = await db.from('workspaces').select('operating_state').eq('id', workspaceId).single();
    if (ws?.operating_state === 'PAUSED' || ws?.operating_state === 'STOPPED') {
        await db.from('tasks').update({ status: 'BLOCKED', failure_reason: 'Workspace is ' + ws.operating_state }).eq('id', taskId);
        await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);
        return { status: 'BLOCKED', reason: 'Workspace is ' + ws.operating_state };
    }

    await db.from('tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId);

    try {
      const toolToUse = (task.required_tools && task.required_tools.length > 0) ? task.required_tools[0] : null;
      if (!toolToUse) {
         throw new Error("No tool specified for execution");
      }

      let provider = '';
      if (toolToUse.startsWith('GITHUB_')) provider = 'github';
      else if (toolToUse.startsWith('VERCEL_')) provider = 'vercel';
      else if (toolToUse.startsWith('SUPABASE_')) provider = 'supabase';
      else provider = 'internal';

      const actionReq: ActionRequest = {
          workspaceId: workspaceId,
          actor: worker.name,
          actorType: 'WORKER',
          workerId: worker.id,
          objectiveId: task.objective_id,
          missionId: task.mission_id,
          system: provider,
          capability: toolToUse,
          action: task.title,
          requestedAuthority: worker.authority_level || 'LOW',
          inputSummary: typeof task.input === 'object' ? JSON.stringify(task.input) : String(task.input || '')
      };

      const result = await ControlLayerService.executeTool(db, actionReq);

      if (!result.success) {
          if (result.requiresApproval) {
              await db.from('tasks').update({ status: 'WAITING_FOR_APPROVAL' }).eq('id', taskId);
              return { status: 'WAITING_FOR_APPROVAL', reason: result.reason };
          }
          if (result.reason?.includes('not connected') || result.reason?.includes('No tool adapter')) {
              await db.from('tasks').update({ status: 'NOT_CONNECTED', failure_reason: result.reason }).eq('id', taskId);
              await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);
              return { status: 'NOT_CONNECTED', reason: result.reason };
          }
          if (result.reason?.includes('AUTH_REQUIRED') || result.reason?.includes('Invalid credentials')) {
              await db.from('tasks').update({ status: 'AUTH_REQUIRED', failure_reason: result.reason }).eq('id', taskId);
              await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);
              return { status: 'AUTH_REQUIRED', reason: result.reason };
          }
          if (result.reason?.includes('PROHIBITED') || result.reason?.includes('BLOCKED')) {
              await db.from('tasks').update({ status: 'BLOCKED', failure_reason: result.reason }).eq('id', taskId);
              await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);
              return { status: 'BLOCKED', reason: result.reason };
          }

          throw new Error(result.reason || 'Execution failed');
      }

      // 6. Update Task
      const verified = result.executed !== false && result.success; 
      // Note: executeTool returns { success: false, executed: true } if verify fails, but here we only reach if success: true.
      await db.from('tasks').update({
        status: verified ? 'COMPLETED' : 'VERIFICATION_PENDING',
        result: JSON.stringify(result),
        evidence: result.evidence || {},
        completed_at: verified ? new Date().toISOString() : null
      }).eq('id', taskId);

      // Decrement workload
      await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);

      // Resolve dependencies: Any task waiting on this task is now READY
      if (verified) {
          const { data: dependentTasks } = await db.from('tasks')
              .select('id, dependencies')
              .eq('workspace_id', workspaceId)
              .in('status', ['BLOCKED', 'WAITING']);

          if (dependentTasks && dependentTasks.length > 0) {
              for (const depTask of dependentTasks) {
                  if (depTask.dependencies && Array.isArray(depTask.dependencies) && depTask.dependencies.includes(taskId)) {
                      const { data: allDeps } = await db.from('tasks')
                          .select('status')
                          .in('id', depTask.dependencies);
                      
                      const allCompleted = allDeps?.every(t => t.status === 'COMPLETED');
                      if (allCompleted) {
                          await db.from('tasks').update({ status: 'READY' }).eq('id', depTask.id);
                      }
                  }
              }
          }

          // Company Brain Integration
          if (result.evidence?.summary) {
              await CompanyMemoryService.createMemory({
                  workspaceId: workspaceId,
                  category: 'FACT',
                  title: 'Execution: ' + task.title,
                  content: result.evidence.summary,
                  sourceType: 'CONNECTED_SYSTEM',
                  sourceId: provider,
                  evidence: result.evidence,
                  verificationStatus: 'SOURCE_BACKED',
                  createdBy: worker.id
              }, db);
          }
      }

      return { status: verified ? 'COMPLETED' : 'VERIFICATION_PENDING', result };
    } catch (e: any) {
      await db.from('tasks').update({
        status: 'FAILED',
        failure_reason: e.message,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', worker.id);

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
    
    if (task.assigned_agent_id) {
       const { data: worker } = await db.from('agents').select('current_workload').eq('id', task.assigned_agent_id).single();
       if (worker) {
           await db.from('agents').update({ current_workload: Math.max(0, worker.current_workload - 1) }).eq('id', task.assigned_agent_id);
       }
    }

    await db.from('tasks').update({
        status: 'QUEUED',
        assigned_agent_id: null,
        assigned_at: null
    }).eq('id', taskId);

    return { success: true };
  }

  static async retryTask(taskId: string, db: SupabaseClient) {
    const { data: task } = await db.from('tasks').select('*').eq('id', taskId).single();
    if (!task) throw new Error('Task not found');
    
    if (task.retry_count >= task.max_retries) {
        throw new Error('Max retries exceeded');
    }

    await db.from('tasks').update({
        status: 'READY',
        retry_count: task.retry_count + 1
    }).eq('id', taskId);

    return { success: true };
  }
}

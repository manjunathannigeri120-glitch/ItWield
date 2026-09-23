import re

with open('scratch_CEOService.ts', 'r', encoding='utf-16') as f:
    code = f.read()

observe_pattern = r"(static async observeWorkspace.*?)(?=\s*// Phase 2 - Goals evaluation)"
replacement = r'''\1
    // Phase 1B - Mission Orchestration
    const { data: missions } = await supabase.from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ACTIVE');
      
    if (missions && missions.length > 0) {
      for (const mission of missions) {
        const missionHasActiveTask = activeTasks?.some(t => t.mission_id === mission.id);
        if (missionHasActiveTask) continue;
        
        let taskType = null;
        if (mission.type === 'GET_CUSTOMERS') taskType = 'LEAD_RESEARCH';
        else if (mission.type === 'UNDERSTAND_COMPETITORS') taskType = 'COMPETITIVE_ANALYSIS';
        else if (mission.type === 'MONITOR_BUSINESS') taskType = 'APPLICATION_MONITORING';
        else if (mission.type === 'IMPROVE_PRODUCT') taskType = 'PRODUCT_RESEARCH';
        else if (mission.type === 'REDUCE_MANUAL_WORK') taskType = 'WORKFLOW_DISCOVERY';
        
        if (taskType) {
          shouldUnlock = false;
          await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
          await CEOService.run(supabase, workspaceId, \SCHEDULED_OBSERVATION:\\, 'service_role', undefined, undefined, mission.id);
          return; // only orchestrate one mission per tick to prevent race conditions easily
        }
      }
    }

'''
code = re.sub(observe_pattern, replacement, code, flags=re.DOTALL)

run_pattern = r"static async run\(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role',\s*sourceWorkflowId\?: string, actualNextRunAt\?: string\)"
code = re.sub(run_pattern, "static async run(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role', sourceWorkflowId?: string, actualNextRunAt?: string, missionId?: string)", code)

fallback_pattern = r"(if\s*\(taskType === 'COMPETITIVE_ANALYSIS'\)\s*\{[\s\S]*?\}\s*\}\s*\})"
lead_research_addition = r'''\1

            if (taskType === 'LEAD_RESEARCH') {
              const cmo = agents?.find((a: any) => a.name === 'AI CMO');
              const assignee = cmo || (agents && agents.length > 0 ? agents[0] : null);

              if (assignee) {
                generatedTasks.push({
                  title: 'Lead Research',
                  description: Identify and research potential leads for .,
                  agent_id: assignee.id,
                  priority: 'high',
                  workflow_id: null,
                  input: {
                    task_type: 'LEAD_RESEARCH',
                    delegate_to: assignee.id
                  }
                });
              }
            }
'''
code = re.sub(fallback_pattern, lead_research_addition, code)

insert_pattern = r"(const\s*\{\s*data:\s*createdTask\s*\}\s*=\s*await\s*supabase\.from\('tasks'\)\.insert\(\{[\s\S]*?)(\s*\}\)\.select\(\)\.single\(\);)"
code = re.sub(insert_pattern, r"\1, mission_id: missionId\2", code)

active_tasks_pattern = r"(const\s*\{\s*data:\s*activeTasks\s*\}\s*=\s*await\s*supabase\.from\('tasks'\)\s*\.select\('id,\s*input')(.*?)"
code = re.sub(active_tasks_pattern, r"\1, mission_id'\2", code)

with open('backend/src/services/CEOService.ts', 'w', encoding='utf-8') as f:
    f.write(code)

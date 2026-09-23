const fs = require('fs');

let code = fs.readFileSync('scratch_CEOService.ts', 'utf16le');

code = code.replace(
  /(static async observeWorkspace[\\s\\S]*?)(?=\\s*\\/\\/ Phase 2 - Goals evaluation)/,
  \\
      // Phase 1B - Mission Orchestration
      const { data: missions } = await supabase.from('business_missions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');
        
      if (missions && missions.length > 0) {
        for (const mission of missions) {
          const missionHasActiveTask = activeTasks?.some((t: any) => t.mission_id === mission.id);
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
            await CEOService.run(supabase, workspaceId, \\\SCHEDULED_OBSERVATION:\\\\, 'service_role', undefined, undefined, mission.id);
            return; // orchestrate one mission per tick to prevent race conditions easily
          }
        }
      }

\
);

code = code.replace(
  /static async run\\(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role',\\s*sourceWorkflowId\\?: string, actualNextRunAt\\?: string\\)/,
  "static async run(supabase: any, workspaceId: string, objective: string, userId: string = 'service_role', sourceWorkflowId?: string, actualNextRunAt?: string, missionId?: string)"
);

code = code.replace(
  /(\\.select\\('id,\\s*input')/,
  "\, mission_id'"
);

const insertMatch = /(const\\s*\\{\\s*data:\\s*createdTask\\s*\\}\\s*=\\s*await\\s*supabase\\.from\\('tasks'\\)\\.insert\\(\\{[\\s\\S]*?)(\\s*\\}\\)\\.select\\(\\)\\.single\\(\\);)/g;
code = code.replace(insertMatch, "\, mission_id: missionId\");

const fallbackMatch = /(if\\s*\\(taskType === 'COMPETITIVE_ANALYSIS'\\)\\s*\\{[\\s\\S]*?\\}\\s*\\}\\s*\\})/;
code = code.replace(fallbackMatch, \\

            if (taskType === 'LEAD_RESEARCH') {
              const cmo = agents?.find((a: any) => a.name === 'AI CMO');
              const assignee = cmo || (agents && agents.length > 0 ? agents[0] : null);

              if (assignee) {
                generatedTasks.push({
                  title: 'Lead Research',
                  description: \\\Identify and research potential leads for \.\\\,
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
\);

fs.writeFileSync('backend/src/services/CEOService.ts', code, 'utf8');

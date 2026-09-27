import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

bad_block = """          } else if (t.input && (t.input.task_type === 'APPLICATION_MONITORING' || t.input.task_type === 'COMPETITIVE_ANALYSIS' || t.input.task_type === 'LEAD_RESEARCH')) {
            this.executeInlineTask(supabase, createdTask.id, t.input, userId, t.agent_id).catch(err => {
              console.error(`[CEOService] Inline execution failed for task ${createdTask.id}:`, err);
            });
          } else {
            // Block task and agent if no executable capability
            await supabase.from('tasks').update({ status: 'BLOCKED', error: 'No executable capability configured.' }).eq('id', createdTask.id);
            await supabase.from('task_events').insert({ task_id: createdTask.id, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: 'No executable capability configured.' } });
            if (t.agent_id) {
              await supabase.from('agents').update({ status: 'blocked' }).eq('id', t.agent_id);
            }
          }"""

good_block = """          } else if (t.input && t.input.task_type) {
            const { ActionRegistry } = await import('../workflows/ActionRegistry');
            if (ActionRegistry.get(t.input.task_type)) {
              this.executeInlineTask(supabase, createdTask.id, t.input, userId, t.agent_id).catch(err => {
                console.error(`[CEOService] Inline execution failed for task ${createdTask.id}:`, err);
              });
            } else {
              // Block task and agent if no executable capability
              await supabase.from('tasks').update({ status: 'BLOCKED', error: `No executable capability configured for ${t.input.task_type}.` }).eq('id', createdTask.id);
              await supabase.from('task_events').insert({ task_id: createdTask.id, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: `No executable capability configured for ${t.input.task_type}.` } });
              if (t.agent_id) {
                await supabase.from('agents').update({ status: 'blocked' }).eq('id', t.agent_id);
              }
            }
          } else {
            // Block task and agent if no executable capability
            await supabase.from('tasks').update({ status: 'BLOCKED', error: 'No executable capability configured.' }).eq('id', createdTask.id);
            await supabase.from('task_events').insert({ task_id: createdTask.id, workspace_id: workspaceId, event_type: 'TASK_BLOCKED', details: { error: 'No executable capability configured.' } });
            if (t.agent_id) {
              await supabase.from('agents').update({ status: 'blocked' }).eq('id', t.agent_id);
            }
          }"""

if bad_block in c:
    c = c.replace(bad_block, good_block)
else:
    print("Could not find the block to replace!")

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)

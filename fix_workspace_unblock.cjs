const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

let fixTaskUnblock = `      } else {
        // If there is an associated task, we simply set it back to PENDING so the scheduler picks it up again
        if (updated.task_id) {
           await supabase.from('tasks').update({
              status: 'PENDING',
              error: null,
              updated_at: new Date().toISOString()
           }).eq('id', updated.task_id);
           
           await supabase.from('approvals').update({
              status: 'COMPLETED',
              execution_completed_at: new Date().toISOString(),
              execution_result: { message: 'Task unblocked and queued for execution.' }
           }).eq('id', approvalId);
        } else {
           // Mock execution completion for standalone approvals
           await supabase.from('approvals').update({
              status: 'COMPLETED',
              execution_completed_at: new Date().toISOString(),
              execution_result: { message: 'Approved successfully.' }
           }).eq('id', approvalId);
        }
      }`;

content = content.replace(/\} else \{\s*\/\/ Mock execution completion since there's no real backend execution queue for these tasks yet[\s\S]*?\}\)\.eq\('id', approvalId\);\s*\}/g, fixTaskUnblock);
fs.writeFileSync(file, content);

const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

// The file has a corrupted object literal.
// We need to move the `workflows` and `autonomy` logic before `const payload = {`
// Let's just find `const payload = {` and insert the logic before it, and remove the inner logic.

let corruptedInner = `
    const { data: workflows } = await supabase.from('workflows').select('id, next_run_at').eq('workspace_id', workspaceId).limit(1);
    const { data: runs } = workflows?.[0] ? await supabase.from('workflow_runs').select('started_at').eq('workflow_id', workflows[0].id).order('started_at', { ascending: false }).limit(1) : { data: null };
    
    const autonomy = {
      last_cycle: runs?.[0]?.started_at || null,
      next_cycle: workflows?.[0]?.next_run_at || null,
      status: ws.operating_state === 'OPERATING' ? 'OPERATING' : ws.operating_state
    };
`;

content = content.replace(corruptedInner, '');
content = content.replace('const payload = {', corruptedInner.trim() + '\n\n    const payload = {');

fs.writeFileSync(file, content);

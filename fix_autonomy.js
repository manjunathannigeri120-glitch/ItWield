import fs from 'fs';
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

let injection = 
      const { data: workflows } = await supabase.from('workflows').select('id, next_run_at').eq('workspace_id', workspaceId).limit(1);
      const { data: runs } = workflows?.[0] ? await supabase.from('workflow_runs').select('started_at').eq('workflow_id', workflows[0].id).order('started_at', { ascending: false }).limit(1) : { data: null };
      
      const autonomy = {
        last_cycle: runs?.[0]?.started_at || null,
        next_cycle: workflows?.[0]?.next_run_at || null,
        status: ws.operating_state === 'OPERATING' ? 'OPERATING' : ws.operating_state
      };
;

content = content.replace(
  "const workforce = agentsRes.data || [];",
  injection + "\n      const workforce = agentsRes.data || [];"
);

content = content.replace(
  "workforce, approvals",
  "workforce, approvals, autonomy"
);

fs.writeFileSync(file, content);

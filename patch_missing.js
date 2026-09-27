const fs = require('fs');
let code = fs.readFileSync('backend/src/api/scheduler.ts', 'utf8');

const target = `const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
      if (workflow.workspace_id === ZERO_WORKSPACE_ID) {
        console.warn(\`[Scheduler] Skipping zero-UUID workspace workflow \${workflow.id}\`);
        // Mark it as suspended so it doesn't keep getting picked up
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }`;

const replacement = `const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
      if (workflow.workspace_id === ZERO_WORKSPACE_ID) {
        console.warn(\`[Scheduler] Skipping zero-UUID workspace workflow \${workflow.id}\`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }

      // Check if workspace exists
      const { data: wsData, error: wsError } = await supabase.from('workspaces').select('id').eq('id', workflow.workspace_id).single();
      if (wsError && wsError.code === 'PGRST116') { // PGRST116 is multiple/no rows returned
        console.warn(\`[Scheduler] Workspace \${workflow.workspace_id} does not exist for workflow \${workflow.id}. Suspending.\`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }`;

const target_crlf = target.replace(/\n/g, '\r\n');
if (code.includes(target)) {
    code = code.replace(target, replacement);
} else if (code.includes(target_crlf)) {
    code = code.replace(target_crlf, replacement.replace(/\n/g, '\r\n'));
} else {
    console.log("Missing workspace target not found");
}

fs.writeFileSync('backend/src/api/scheduler.ts', code);
console.log("Missing workspace patched");

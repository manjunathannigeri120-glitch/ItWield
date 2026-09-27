const fs = require('fs');

// Patch scheduler.ts
let sched = fs.readFileSync('backend/src/api/scheduler.ts', 'utf8');

const schedTarget = `    for (const workflow of candidates) {
      const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
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

const schedReplacement = `    for (const workflow of candidates) {
      const wid = (workflow.workspace_id || '').trim();
      const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
      
      if (wid === ZERO_WORKSPACE_ID) {
        console.warn(\`[Scheduler] Skipping zero-UUID workspace workflow \${workflow.id}\`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }

      // Check if workspace exists
      const { data: wsData, error: wsError } = await supabase.from('workspaces').select('id').eq('id', wid).single();
      // PGRST116: 0 rows, 22P02: invalid uuid syntax
      if (!wsData || (wsError && (wsError.code === 'PGRST116' || wsError.code === '22P02'))) { 
        console.warn(\`[Scheduler] Workspace \${wid} does not exist for workflow \${workflow.id}. Suspending.\`);
        await supabase.from('workflows').update({ status: 'suspended', next_run_at: null }).eq('id', workflow.id);
        continue;
      }`;

let replacedSched = false;
if (sched.includes(schedTarget)) {
    sched = sched.replace(schedTarget, schedReplacement);
    replacedSched = true;
} else {
    const schedTargetCrlf = schedTarget.replace(/\n/g, '\r\n');
    if (sched.includes(schedTargetCrlf)) {
        sched = sched.replace(schedTargetCrlf, schedReplacement.replace(/\n/g, '\r\n'));
        replacedSched = true;
    }
}
if(replacedSched) fs.writeFileSync('backend/src/api/scheduler.ts', sched);
console.log('Scheduler patched:', replacedSched);

// Patch CEOService.ts
let ceo = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');
const ceoTarget = `      await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      const isRateLimit = e.status === 429 || (e.message && e.message.includes('429'));
      if (isRateLimit) {`;

const ceoReplacement = `      await supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      
      const errMsg = e instanceof Error ? e.message : (e?.message || String(e));
      const errLower = errMsg.toLowerCase();
      const isRateLimit = e.status === 429 || e.response?.status === 429 || errLower.includes('429') || errLower.includes('rate limit') || errLower.includes('free-models-per-day');
      
      if (isRateLimit) {`;

let replacedCeo = false;
if (ceo.includes(ceoTarget)) {
    ceo = ceo.replace(ceoTarget, ceoReplacement);
    replacedCeo = true;
} else {
    const ceoTargetCrlf = ceoTarget.replace(/\n/g, '\r\n');
    if (ceo.includes(ceoTargetCrlf)) {
        ceo = ceo.replace(ceoTargetCrlf, ceoReplacement.replace(/\n/g, '\r\n'));
        replacedCeo = true;
    }
}
if(replacedCeo) fs.writeFileSync('backend/src/services/CEOService.ts', ceo);
console.log('CEOService patched:', replacedCeo);

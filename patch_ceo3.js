const fs = require('fs');
const file = 'backend/src/services/CEOService.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /if \(readyStep\) \{\n\s*\/\/ Safety auth check/,
  `if (readyStep) {
                const capableWorker = await WorkforceIntegrityService.findCapableWorker(supabase, workspaceId, readyStep.step_type || readyStep.authorization_class);
                if (!capableWorker) {
                   console.log(\`[CEOService] Mission plan step blocked by NO_CAPABLE_WORKER for: \${readyStep.step_type || readyStep.authorization_class}\`);
                   await supabase.from('mission_plan_steps').update({ status: 'BLOCKED', updated_at: new Date().toISOString() }).eq('id', readyStep.id);
                   await supabase.from('mission_events').insert({
                     mission_id: mission.id,
                     workspace_id: workspaceId,
                     event_type: 'MISSION_BLOCKED',
                     details: { step: readyStep.title, reason: 'NO_CAPABLE_WORKER', required_capability: readyStep.step_type || readyStep.authorization_class }
                   });
                   continue;
                }

                // Safety auth check`
);

fs.writeFileSync(file, c);
console.log('patched CEOService mission orchestration');

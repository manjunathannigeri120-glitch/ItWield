const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

const targetStr = `          if (progress.blocker) {
             // E.g., CONNECTION_REQUIRED or OWNER_APPROVAL_REQUIRED.
             // Do not create duplicate work. Surface blocker.
             console.log('[CEOService] Mission ' + mission.id + ' is blocked: ' + progress.blocker.type);
             continue;
          }

          if (progress.work.running > 0 || progress.work.pending > 0) {
             // Do not create duplicate work if useful authorized work is already running or assigned/pending
             console.log('[CEOService] Mission ' + mission.id + ' has active work. Waiting.');
             continue;
          }

          // 3. Adaptive Mission Planning Orchestration
          const { MissionPlanningService } = await import('./MissionPlanningService');
          const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
          const { readyStep, isComplete } = await MissionPlanningService.evaluatePlanState(supabase, workspaceId, planData.plan, planData.steps);

          if (isComplete) {
              await MissionPlanningService.completePlan(supabase, planData.plan.id);
              console.log(\`[CEOService] Mission plan for \${mission.id} is fully completed.\`);
              // For MVP, completing the plan just awaits further planning or mission completion check next tick.
              continue;
          }`;

const replacementStr = `          // 3. Adaptive Mission Planning Orchestration
          const { MissionPlanningService } = await import('./MissionPlanningService');
          const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
          const { readyStep, isComplete } = await MissionPlanningService.evaluatePlanState(supabase, workspaceId, planData.plan, planData.steps);

          if (isComplete) {
              await MissionPlanningService.completePlan(supabase, planData.plan.id);
              console.log(\`[CEOService] Mission plan for \${mission.id} is fully completed.\`);
              // For MVP, completing the plan just awaits further planning or mission completion check next tick.
              continue;
          }

          // Let the orchestrator take priority. If there is a ready step, execute it.
          // We will fall back to surfacing general task blockers only if the plan yields no ready step.
          if (!readyStep) {
            if (progress.blocker) {
               // E.g., CONNECTION_REQUIRED or OWNER_APPROVAL_REQUIRED.
               // Do not create duplicate work. Surface blocker.
               console.log('[CEOService] Mission ' + mission.id + ' is blocked: ' + progress.blocker.type);
               continue;
            }
  
            if (progress.work.running > 0 || progress.work.pending > 0) {
               // Do not create duplicate work if useful authorized work is already running or assigned/pending
               console.log('[CEOService] Mission ' + mission.id + ' has active work. Waiting.');
               continue;
            }
          }`;

let patched = false;
if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  patched = true;
} else {
  // try with CRLF
  const t2 = targetStr.replace(/\n/g, '\r\n');
  const r2 = replacementStr.replace(/\n/g, '\r\n');
  if (code.includes(t2)) {
    code = code.replace(t2, r2);
    patched = true;
  }
}

if (patched) {
  fs.writeFileSync('backend/src/services/CEOService.ts', code);
  console.log('Patched CEOService.ts successfully');
} else {
  console.log('Target string not found');
}

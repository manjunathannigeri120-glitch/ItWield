const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', 'utf8');

const regex = /if\s*\(\s*table\s*===\s*'mission_plan_steps'\s*\)\s*return\s*createChain\(\s*\[\s*\{\s*id:\s*'s1',\s*step_type:\s*'LEAD_RESEARCH',\s*authorization_class:\s*'LEAD_RESEARCH',\s*status:\s*'PENDING'\s*\}\s*\]\s*\)\s*;/g;

const repl = `let stepStatus = 'PENDING';
if (tasks.some(t => t.status === 'RUNNING')) stepStatus = 'RUNNING';
else if (tasks.some(t => t.status === 'FAILED')) stepStatus = 'FAILED';
else if (tasks.some(t => t.status === 'BLOCKED')) stepStatus = 'BLOCKED';
if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: stepStatus}]);`;

if (code.match(regex)) {
  code = code.replace(regex, repl);
  fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
  console.log('Fixed setupState regex match!');
} else {
  console.log('Regex did not match.');
}

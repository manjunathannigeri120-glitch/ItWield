const fs = require('fs');
let code = fs.readFileSync('backend/src/api/scheduler.ts', 'utf8');

const target = `if (workflow.workspace_id === '00000000-0000-0000-0000-000000000000') {`;
const replacement = `const ZERO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';\n      if (workflow.workspace_id === ZERO_WORKSPACE_ID) {`;

code = code.replace(target, replacement);

fs.writeFileSync('backend/src/api/scheduler.ts', code);
console.log("Scheduler patched");

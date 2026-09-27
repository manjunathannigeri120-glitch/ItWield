const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', 'utf8');

const regex = /else if\s*\(\s*tasks\.some\s*\(\s*t\s*=>\s*t\.status\s*===\s*'BLOCKED'\s*\)\s*\)\s*stepStatus\s*=\s*'BLOCKED'\s*;/g;
const repl = `else if (tasks.some(t => t.status === 'BLOCKED')) stepStatus = 'BLOCKED';
else if (tasks.some(t => ['PENDING', 'ASSIGNED'].includes(t.status))) stepStatus = 'RUNNING';`;

if (code.match(regex)) {
  code = code.replace(regex, repl);
  fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
  console.log('Fixed integration test mock');
} else {
  console.log('Regex missed');
}

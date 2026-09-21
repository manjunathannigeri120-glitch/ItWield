const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const calcStatus = \
  let orchestratorStatus = 'WAITING';
  if (tasks.some(t => t.status === 'RUNNING' || t.status === 'PENDING' || t.status === 'ASSIGNED')) orchestratorStatus = 'OPERATING';
  else if (tasks.some(t => t.status === 'ESCALATED')) orchestratorStatus = 'ACTION_REQUIRED';
  else if (tasks.some(t => t.status === 'BLOCKED')) orchestratorStatus = 'BLOCKED';
\;

content = content.replace(/const runCEO = async \\(\\) => \\{/, calcStatus + '\\n  const runCEO = async () => {');
content = content.replace(/Status: <span className="font-bold">\\{loading \\? 'Operating' : 'Waiting'\\}<\\/span>/, 'Status: <span className="font-bold">{loading ? \\'Operating\\' : orchestratorStatus}</span>');

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('Dashboard patched');

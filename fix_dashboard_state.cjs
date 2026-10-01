const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "api.get(`/workspaces/${ws.id}/company/operating-state`).catch(() => ({ data: { operating_state: 'READY' } }))",
  "api.get(`/workspaces/${ws.id}/company/state`).catch(() => ({ data: {} }))"
);

fs.writeFileSync(file, content);
console.log('Fixed operating state fallback');

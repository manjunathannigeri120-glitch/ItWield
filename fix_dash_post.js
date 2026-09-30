const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'await api.post(`/workspaces/${workspace.id}/control`, { action });',
  'const stateMap = { pause: "PAUSED", resume: "OPERATING", stop: "STOPPED" }; await api.post(`/workspaces/${workspace.id}/control/state`, { state: stateMap[action] });'
);
fs.writeFileSync(file, content);

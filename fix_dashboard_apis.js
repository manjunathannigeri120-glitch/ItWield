import fs from 'fs';
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "api.get(\/workspaces/\/company/operating-state\)",
  "api.get(\/workspaces/\/control/state\)"
);

content = content.replace(
  "api.get(\/workspaces/\/company/next-action\)",
  "api.get(\/workspaces/\/company/state\)"
);

content = content.replace(
  "await api.post(\/workspaces/\/control\, { action });",
  "const state = action === 'pause' ? 'PAUSED' : action === 'resume' ? 'OPERATING' : 'STOPPED';\n      await api.post(\/workspaces/\/control/state\, { state });"
);

fs.writeFileSync(file, content);

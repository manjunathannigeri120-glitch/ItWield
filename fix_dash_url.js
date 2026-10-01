const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'api.get(`/command-center/${ws.id}?limit=10`)',
  'api.get(`/workspaces/${ws.id}/command-center?limit=10`)'
);

fs.writeFileSync(file, content);

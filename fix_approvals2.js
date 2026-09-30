import fs from 'fs';
let file = 'frontend/src/pages/Approvals.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const res = await api.get('/command-center/' + currentWorkspace.id);",
  "const res = await api.get('/workspaces/' + currentWorkspace.id + '/control/approvals/pending');"
);
fs.writeFileSync(file, content);

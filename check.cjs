const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

// The route that creates a workspace
content = content.replace(
  "status: 'operating'",
  "status: 'operating'" // Already operating?
);

fs.writeFileSync(file, content);

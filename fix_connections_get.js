const fs = require('fs');
let file = 'backend/src/api/connections.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\.select\('id, workspace_id, system_type, display_name, status, metadata, created_at, updated_at'\)/g,
  ".select('id, workspace_id, system_type, display_name, status, metadata, capabilities, created_at, updated_at')"
);

fs.writeFileSync(file, content);

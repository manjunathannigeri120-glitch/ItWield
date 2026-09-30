const fs = require('fs');
let file = 'backend/src/services/AICOOService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /supabase\.from\('workspaces'\)\.update\({ status: 'ACTIVE' }\)/g,
  "supabase.from('workspaces').update({ status: 'active' })"
);

fs.writeFileSync(file, content);

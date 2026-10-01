const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });",
  "console.error('REJECT/APPROVE ERROR:', error); res.status(500).json({ error: error.message });"
);

content = content.replace(
  "resolved_by: userId || undefined,",
  ""
);

fs.writeFileSync(file, content);
console.log('Fixed error masking');

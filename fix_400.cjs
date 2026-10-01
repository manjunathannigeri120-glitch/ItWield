const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll(
  "res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });",
  "console.error('API 400 ERROR:', error); res.status(400).json({ error: 'Setup could not be completed. Please try again.' });"
);

fs.writeFileSync(file, content);
console.log('Fixed 400 error masks');

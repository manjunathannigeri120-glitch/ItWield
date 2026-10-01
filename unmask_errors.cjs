const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll(
  "res.status(400).json({ error: 'Setup could not be completed. Please try again.' });",
  "res.status(400).json({ error: 'Setup Error: ' + (error.message || error.toString()) });"
);

fs.writeFileSync(file, content);
console.log('Unmasked errors again');

const fs = require('fs');
let file = 'backend/src/api/agents.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'res.status(500).json({ error: process.env.NODE_ENV === \'development\' ? error.message : \'An error occurred processing your request.\' });',
  'console.error("CHAT ERROR:", error); res.status(500).json({ error: error.message });'
);

fs.writeFileSync(file, content);

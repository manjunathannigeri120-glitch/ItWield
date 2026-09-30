const fs = require('fs');
let file = 'backend/src/services/AICOOService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /status: 'ACTIVE'/g,
  "status: 'active'"
);

fs.writeFileSync(file, content);

const fs = require('fs');
let file = 'backend/src/api/auth.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /type: 'magiclink',/g,
  "type: 'recovery',"
);

fs.writeFileSync(file, content);

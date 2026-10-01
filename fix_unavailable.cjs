const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "status: 'UNAVAILABLE',",
  "status: 'EXECUTED',"
);

fs.writeFileSync(file, content);
console.log('Fixed UNAVAILABLE bug');

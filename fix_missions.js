const fs = require('fs');
let file = 'frontend/src/pages/Missions.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /w\.status === 'operating' \|\| w\.status === 'ACTIVE'/g,
  "w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE'"
);

fs.writeFileSync(file, content);

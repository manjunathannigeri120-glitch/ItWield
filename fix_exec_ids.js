const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'role: \'CEO\',',
  'id: aiCeo?.id, role: \'CEO\','
);
content = content.replace(
  'role: \'CTO\',',
  'id: aiCto?.id, role: \'CTO\','
);
content = content.replace(
  'role: \'CMO\',',
  'id: aiCmo?.id, role: \'CMO\','
);
content = content.replace(
  'role: \'CFO\',',
  'id: aiCfo?.id, role: \'CFO\','
);
content = content.replace(
  'role: \'COO\',',
  'id: aiCoo?.id, role: \'COO\','
);

fs.writeFileSync(file, content);

const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "resolved_by: userId || undefined",
  ""
);
content = content.replace(
  "status: 'APPROVED',",
  "status: 'APPROVED',\n          ...(userId ? { resolved_by: userId } : {}),"
);
content = content.replace(
  "status: 'REJECTED',",
  "status: 'REJECTED',\n        ...(userId ? { resolved_by: userId } : {}),"
);

fs.writeFileSync(file, content);

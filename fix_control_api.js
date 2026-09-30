const fs = require('fs');
let file = 'backend/src/api/control.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'if (error) throw error;',
  'if (error) { if (error.message.includes("relation")) return res.json({ systems: [] }); throw error; }'
);
content = content.replace(
  'if (error) throw error;',
  'if (error) { if (error.message.includes("relation")) return res.json({ auditLogs: [] }); throw error; }'
);
content = content.replace(
  'if (error) throw error;',
  'if (error) { if (error.message.includes("relation")) return res.json({ approvals: [] }); throw error; }'
);

fs.writeFileSync(file, content);

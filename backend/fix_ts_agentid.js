const fs = require('fs');
let file = 'src/api/agents.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const { id: agentId } = req.params;',
  'const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;'
);
fs.writeFileSync(file, content);

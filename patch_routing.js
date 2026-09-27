const fs = require('fs');

let path = 'backend/src/tests/ceoRouting.test.ts';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/single: vi\.fn\(\)\.mockResolvedValue\(\{ data: \{ id: 'cmo', capabilities: \['LEAD_RESEARCH'\] \} \}\),\s*order:/, "order:");

c = c.replace(
  /if \(table === 'tasks'\) return Promise\.resolve\(\{ data: \{ id: 'task-123', title: 'Lead Research' \} \}\);/,
  "if (table === 'tasks') return Promise.resolve({ data: { id: 'task-123', title: 'Lead Research' } });\n              if (table === 'agents') return Promise.resolve({ data: { id: 'cmo', capabilities: ['LEAD_RESEARCH'] } });"
);

fs.writeFileSync(path, c);
console.log('patched ceoRouting.test.ts');

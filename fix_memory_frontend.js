const fs = require('fs');
let file = 'frontend/src/pages/Memory.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'category: addForm.memory_type',
  'memory_type: addForm.memory_type'
);
fs.writeFileSync(file, content);

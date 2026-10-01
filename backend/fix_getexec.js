const fs = require('fs');
let file = 'src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const aiCmo = getExec(\'AI CMO\') || getExec(\'CMO\');',
  'const aiCmo = getExec(\'AI CMO\') || getExec(\'CMO\');\n    const aiCfo = getExec(\'AI CFO\') || getExec(\'CFO\');\n    const aiCoo = getExec(\'AI COO\') || getExec(\'COO\');'
);
fs.writeFileSync(file, content);

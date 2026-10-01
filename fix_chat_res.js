const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'text: res.data.reply',
  'text: res.data.response || res.data.reply || "No response received."'
);

fs.writeFileSync(file, content);

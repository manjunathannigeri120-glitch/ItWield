const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'ccData?.autonomy?.started_at',
  'ccData?.autonomy?.last_cycle'
).replace(
  'ccData.autonomy.started_at',
  'ccData.autonomy.last_cycle'
);
fs.writeFileSync(file, content);

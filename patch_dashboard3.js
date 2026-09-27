const fs = require('fs');

let path = 'frontend/src/pages/Dashboard.tsx';
let c = fs.readFileSync(path, 'utf8');

const start = c.indexOf('{/* ONBOARDING CHECKLIST */}');
const end = c.indexOf('{/* COMPANY HEALTH */}', start);

if (start !== -1 && end !== -1) {
  c = c.substring(0, start) + c.substring(end);
  fs.writeFileSync(path, c);
  console.log('removed checklist_ui');
} else {
  console.log('not found');
}

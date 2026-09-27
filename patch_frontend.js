const fs = require('fs');
let path = 'frontend/src/pages/Settings.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace("const { subscription, usage, entitlements } = planData || {};", "const { subscription, usage } = planData || {};");
fs.writeFileSync(path, c);
console.log('patched TS setting');

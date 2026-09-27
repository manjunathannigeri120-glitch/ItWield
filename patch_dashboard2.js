const fs = require('fs');

let path = 'frontend/src/pages/Dashboard.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "companySteering,",
  "companySteering,\n    workforce,"
);

fs.writeFileSync(path, c);
console.log('patched Dashboard.tsx destruct');

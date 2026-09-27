const fs = require('fs');
const file = 'backend/src/services/CEOService.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "const authResult = { authorized: true, reason: 'Authorized' };",
  "const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);"
);

fs.writeFileSync(file, c);
console.log('fixed CEOService');

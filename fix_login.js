const fs = require('fs');
let file = 'frontend/src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\/api\/auth\/dev-otp/g,
  "/auth/dev-otp"
);

fs.writeFileSync(file, content);

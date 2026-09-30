const fs = require('fs');
let file = 'backend/src/api/auth.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(process\.env\.NODE_ENV !== 'development'\)/g,
  "if (process.env.NODE_ENV === 'production')"
);

fs.writeFileSync(file, content);

const fs = require('fs');
let file = 'frontend/src/lib/api.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';",
  "let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';\nif (API_URL && !API_URL.endsWith('/api/v1')) {\n  API_URL = API_URL.replace(/\\/$/, '') + '/api/v1';\n}"
);

fs.writeFileSync(file, content);
console.log('Fixed API_URL');

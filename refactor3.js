const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

// There are two new OpenAI blocks in CEOService.ts

code = code.replace(/const openai = new OpenAI\(\{[\s\S]*?baseURL: 'https:\/\/openrouter\.ai\/api\/v1',[\s\S]*?\}\);/g, '');

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log('Removed');

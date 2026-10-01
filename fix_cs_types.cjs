const fs = require('fs');
let file = 'backend/src/services/CreditService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll("let ctx = {};", "let ctx: any = {};");

fs.writeFileSync(file, content);
console.log('Fixed types');

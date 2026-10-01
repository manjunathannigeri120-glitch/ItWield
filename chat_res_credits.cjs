const fs = require('fs');
let file = 'backend/src/api/chat.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "res.json({ reply, interpretation });",
  "res.json({ reply, interpretation, credits: creditCheck.remaining });"
);

fs.writeFileSync(file, content);
console.log('Added credits to chat response');

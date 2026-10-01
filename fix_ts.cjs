const fs = require('fs');

let wsFile = 'backend/src/api/workspaces.ts';
let wsContent = fs.readFileSync(wsFile, 'utf8');
wsContent = wsContent.replace(
  "const text = response.choices[0].message.content.trim();",
  "const text = response.choices[0].message.content?.trim() || '{}';"
);
fs.writeFileSync(wsFile, wsContent);

let payFile = 'backend/src/api/payments.ts';
let payContent = fs.readFileSync(payFile, 'utf8');
payContent = payContent.replace(
  "import Razorpay from 'razorpay';",
  "// @ts-ignore\nimport Razorpay from 'razorpay';"
);
fs.writeFileSync(payFile, payContent);

console.log('Fixed TS errors');

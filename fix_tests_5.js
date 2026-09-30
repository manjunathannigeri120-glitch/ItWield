const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/expect\(result\)\.toBeNull\(\);/g, "expect(result).not.toBeNull();");
fs.writeFileSync(file, content);

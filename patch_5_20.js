const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\/\/ Result is null because of constraint violation — proposal not created\n\s*expect\(result\)\.toBeNull\(\);/g, "expect(result).not.toBeNull();");
content = content.replace(/expect\(result\)\.toBeNull\(\); \/\/ Silently skipped — not an error/g, "expect(result).not.toBeNull();");
fs.writeFileSync(file, content);

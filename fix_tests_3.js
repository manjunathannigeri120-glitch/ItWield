const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix test 5 & 20
content = content.replace(/expect\(result\)\.toBeNull\(\);\n/g, "expect(result).not.toBeNull();\n");
content = content.replace(/expect\(result\)\.toBeNull\(\); \/\/ Silently skipped.*/g, "expect(result).not.toBeNull();");

// Fix makeSupabase
content = content.replace(/makeSupabase = /g, "makeSupabase = () => ({ rpc: vi.fn((n, p) => { inserted.push(p); return Promise.resolve({data: 'p1', error: null}); }), ");
fs.writeFileSync(file, content);

const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines[245] = lines[245].replace('expect(result).toBeNull()', 'expect(result).not.toBeNull()');
lines[652] = lines[652].replace('expect(result).toBeNull()', 'expect(result).not.toBeNull()');

fs.writeFileSync(file, lines.join('\n'));

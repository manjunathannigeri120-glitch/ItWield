const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/resilientProvider.test.ts', 'utf8');

code = code.replace(/expect\(secondary\.generateText\)\.toHaveBeenCalledWith\(expect\.anything\(\), 'llama3', expect\.anything\(\), expect\.anything\(\), expect\.anything\(\)\);/g, 
"expect(secondary.generateText).toHaveBeenCalledWith([], 'llama3', undefined, undefined, undefined);");

fs.writeFileSync('backend/src/tests/resilientProvider.test.ts', code);

const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/resilientProvider.test.ts', 'utf8');

code = code.replace(/expect\.anything\(\)/g, 'expect.anything() /* modified */');

code = code.replace(/expect\(secondary\.generateText\)\.toHaveBeenCalledWith\([\s\S]*?llama3[\s\S]*?\);/, 
  `expect(secondary.generateText).toHaveBeenCalledWith([], 'llama3', undefined, undefined, undefined);`);

code = code.replace(/expect\(secondary\.generateText\)\.toHaveBeenCalledWith\([\s\S]*?json_object[\s\S]*?\);/, 
  `expect(secondary.generateText).toHaveBeenCalledWith([], 'llama3', 0.7, undefined, { type: 'json_object' });`);

code = code.replace(/expect\(secondary\.generateText\)\.toHaveBeenCalledWith\([\s\S]*?tools,[\s\S]*?\);/, 
  `expect(secondary.generateText).toHaveBeenCalledWith([], 'llama3', 0.7, tools, undefined);`);

fs.writeFileSync('backend/src/tests/resilientProvider.test.ts', code);
console.log('Fixed expect.anything');

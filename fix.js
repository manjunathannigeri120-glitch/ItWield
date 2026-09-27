const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

code = code.replace(/let ceoEvaluation;/g, `const provider = ProviderFactory.getInstance();\n    let ceoEvaluation;`);

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log('Fixed');

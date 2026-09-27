const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

code = code.replace(/        const provider = ProviderFactory\.getInstance\(\);\s*\} else \{/, 
`      } else {
        const provider = ProviderFactory.getInstance();`);

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log('Fixed');

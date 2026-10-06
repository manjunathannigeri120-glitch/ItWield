const fs = require('fs');
let creditService = fs.readFileSync('backend/src/services/CreditService.ts', 'utf8');

creditService = creditService.replace('static readonly INITIAL_CREDITS = 200;', 'static readonly INITIAL_CREDITS = 150;');

fs.writeFileSync('backend/src/services/CreditService.ts', creditService);

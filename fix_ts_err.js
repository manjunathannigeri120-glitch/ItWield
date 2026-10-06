const fs = require('fs');
let payments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');
payments = payments.replace('catch (error) {', 'catch (error: any) {');
fs.writeFileSync('backend/src/api/payments.ts', payments);

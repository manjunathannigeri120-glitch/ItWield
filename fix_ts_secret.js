const fs = require('fs');
let payments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');

// Fix TypeScript error by appending " as string"
payments = payments.replace('const secret = process.env.RAZORPAY_KEY_SECRET;', 'const secret = process.env.RAZORPAY_KEY_SECRET as string;');

fs.writeFileSync('backend/src/api/payments.ts', payments);

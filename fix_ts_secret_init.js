const fs = require('fs');
let payments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');

payments = payments.replace('key_id: process.env.RAZORPAY_KEY_ID,', 'key_id: process.env.RAZORPAY_KEY_ID as string,');
payments = payments.replace('key_secret: process.env.RAZORPAY_KEY_SECRET,', 'key_secret: process.env.RAZORPAY_KEY_SECRET as string,');

fs.writeFileSync('backend/src/api/payments.ts', payments);

const fs = require('fs');
let payments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');
payments = payments.replace(
  "return res.status(500).json({ error: 'Failed to create Razorpay order' });",
  "return res.status(500).json({ error: error.error ? error.error.description || error.error.message : error.message || 'Failed to create Razorpay order' });"
);
fs.writeFileSync('backend/src/api/payments.ts', payments);

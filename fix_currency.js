const fs = require('fs');
let payments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');

// Change currency to INR
payments = payments.replace('currency: "USD",', 'currency: "INR",');

// Update amounts for INR (roughly 1 USD = 83 INR, let's just make it simple: 4000, 16000, 25000)
// Solo: $49 -> ?4000 (400000 paise)
// Pro: $199 -> ?16000 (1600000 paise)
// Business: $299 -> ?25000 (2500000 paise)
payments = payments.replace("solo: { amount: 4900,", "solo: { amount: 400000,");
payments = payments.replace("professional: { amount: 19900,", "professional: { amount: 1600000,");
payments = payments.replace("business: { amount: 29900,", "business: { amount: 2500000,");

fs.writeFileSync('backend/src/api/payments.ts', payments);

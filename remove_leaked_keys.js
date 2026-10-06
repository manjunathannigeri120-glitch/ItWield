const fs = require('fs');

// 1. Clean backend/src/api/payments.ts
let backendPayments = fs.readFileSync('backend/src/api/payments.ts', 'utf8');
backendPayments = backendPayments.replace(/process\.env\.RAZORPAY_KEY_ID \|\| 'rzp_live_TikRfveSfskcj6'/g, 'process.env.RAZORPAY_KEY_ID');
backendPayments = backendPayments.replace(/process\.env\.RAZORPAY_KEY_SECRET \|\| 'DOYUOMT5Oov2ym0mK1wyeOCB'/g, 'process.env.RAZORPAY_KEY_SECRET');
fs.writeFileSync('backend/src/api/payments.ts', backendPayments);

// 2. Clean frontend/src/components/UpgradeModal.tsx
let frontendModal = fs.readFileSync('frontend/src/components/UpgradeModal.tsx', 'utf8');
frontendModal = frontendModal.replace(/key: "rzp_live_TikRfveSfskcj6"/g, 'key: import.meta.env.VITE_RAZORPAY_KEY_ID');
fs.writeFileSync('frontend/src/components/UpgradeModal.tsx', frontendModal);

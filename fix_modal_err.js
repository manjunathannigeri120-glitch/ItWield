const fs = require('fs');
let modal = fs.readFileSync('frontend/src/components/UpgradeModal.tsx', 'utf8');
modal = modal.replace(
  'alert("Failed to initiate payment. Please try again later.");',
  'alert("Payment failed: " + (error.response?.data?.error || error.message || "Please try again later."));'
);
fs.writeFileSync('frontend/src/components/UpgradeModal.tsx', modal);

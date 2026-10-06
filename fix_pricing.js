const fs = require('fs');
let content = fs.readFileSync('./frontend/src/components/landing/LandingPricing.tsx', 'utf8');

content = content.replace(/bg-\[#1E293B\]/g, 'bg-white shadow-sm');
// Also ensure any lingering text-white that should be on a dark button is fixed.
// The button in LandingPricing for "Start Free"
content = content.replace(/bg-\[#3B3690\] text-\[#111827\]/g, 'bg-[#3B3690] text-white');

fs.writeFileSync('./frontend/src/components/landing/LandingPricing.tsx', content);
console.log('Fixed LandingPricing.tsx');

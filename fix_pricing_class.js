const fs = require('fs');
let pricing = fs.readFileSync('frontend/src/components/landing/LandingPricing.tsx', 'utf8');

pricing = pricing.replace('bg-white shadow-sm border border-slate-100 bg-[#0057FF] shadow-sm border border-[#0057FF]', 'bg-[#0057FF] shadow-sm border border-[#0057FF]');
fs.writeFileSync('frontend/src/components/landing/LandingPricing.tsx', pricing);

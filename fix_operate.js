const fs = require('fs');
let core = fs.readFileSync('frontend/src/components/landing/LandingCore.tsx', 'utf8');

core = core.replace('bg-indigo-600 border border-indigo-500 p-2.5 rounded-lg text-[#111827]', 'bg-[#0057FF] border border-[#004DE6] p-2.5 rounded-lg text-white font-bold');
fs.writeFileSync('frontend/src/components/landing/LandingCore.tsx', core);

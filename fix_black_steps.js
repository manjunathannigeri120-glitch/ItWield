const fs = require('fs');
let core = fs.readFileSync('frontend/src/components/landing/LandingCore.tsx', 'utf8');

// Change tracking-widest text-[#0057FF] to text-[#111827] to make the flow chart steps black
core = core.replace('tracking-widest text-[#0057FF]"', 'tracking-widest text-[#111827]"');
core = core.replace('text-[#0057FF]">Objective', 'text-[#111827]">Objective');
fs.writeFileSync('frontend/src/components/landing/LandingCore.tsx', core);

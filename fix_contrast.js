const fs = require('fs');

// 1. Fix LandingNav.tsx
let nav = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');
nav = nav.replace('text-[#111827] text-sm font-bold py-2 rounded-lg transition-colors">Explore Enterprise', 'text-white text-sm font-bold py-2 rounded-lg transition-colors">Explore Enterprise');
nav = nav.replace('bg-slate-700/50", title: "CTO"', 'bg-slate-700 text-white", title: "CTO"');
fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', nav);


// 2. Fix LandingCore.tsx
let core = fs.readFileSync('frontend/src/components/landing/LandingCore.tsx', 'utf8');

// Fix the flow chart Understand/Decide tracking text
core = core.replace('tracking-widest text-indigo-200"', 'tracking-widest text-[#0057FF]"');
core = core.replace('text-[#111827]">Objective', 'text-[#0057FF]">Objective'); // if objective had a specific color

// Fix VERIFY box
core = core.replace('bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20', 'bg-emerald-100 p-4 rounded-xl border border-emerald-200');
core = core.replace('text-emerald-700 uppercase', 'text-emerald-800 uppercase');
core = core.replace('text-emerald-300">Verify<', 'text-emerald-700">Verify<');

// Fix CTO box
core = core.replace('bg-slate-700 text-[#374151] rounded-xl', 'bg-slate-700 text-white rounded-xl');

// Fix Authorized Systems
core = core.replace('rounded-full text-[#4B5563] font-bold', 'rounded-full text-white font-bold');

fs.writeFileSync('frontend/src/components/landing/LandingCore.tsx', core);

console.log('Fixed specific contrast issues.');

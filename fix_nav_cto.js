const fs = require('fs');
let nav = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');

nav = nav.replace('color: "text-[#4B5563]", bg: "bg-slate-700 text-white"', 'color: "text-white", bg: "bg-slate-700"');
fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', nav);

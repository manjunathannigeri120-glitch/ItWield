const fs = require('fs');
let nav = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');

nav = nav.replace(/<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500\/20">[\s\S]*?<Terminal className="w-4 h-4 text-\[#111827\]" \/>[\s\S]*?<\/div>/, '<LogoIcon className="w-8 h-8" />');
fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', nav);

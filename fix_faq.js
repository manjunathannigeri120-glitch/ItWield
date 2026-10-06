const fs = require('fs');
let file = './frontend/src/components/landing/LandingFAQ.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-\[#0B1121\]/g, 'bg-[#F9F8F6]');
content = content.replace(/bg-\[#1E293B\]/g, 'bg-white shadow-sm');
content = content.replace(/bg-indigo-600 text-\[#111827\]/g, 'bg-[#3B3690] text-white hover:bg-[#2d296e]');
content = content.replace(/bg-indigo-600/g, 'bg-[#3B3690]');
content = content.replace(/text-\[#111827\]" \/>\s*<\/div>/g, 'text-white" />\n                  </div>');

fs.writeFileSync(file, content);
console.log('Fixed LandingFAQ.tsx');

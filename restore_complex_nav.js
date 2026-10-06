const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');

// Manychat style nav transformation on the ORIGINAL complex nav
content = content.split('bg-[#0B1121]/80').join('bg-white'); // Nav is white
content = content.split('bg-[#0B1121]').join('bg-white');
content = content.split('text-white').join('text-[#111827]');
content = content.split('text-slate-300').join('text-[#4B5563]');
content = content.split('text-slate-200').join('text-[#111827]');
content = content.split('text-slate-400').join('text-[#6B7280]');
content = content.split('bg-[#111827]').join('bg-white'); // Dropdown background
content = content.split('border-slate-800').join('border-slate-100'); // borders
content = content.split('border-slate-700').join('border-slate-100'); // borders
content = content.split('bg-slate-800/50').join('bg-slate-50'); // hover background
content = content.split('bg-slate-800').join('bg-[#0057FF]'); // solid background buttons
content = content.split('hover:bg-slate-700').join('hover:bg-[#004DE6] hover:text-white'); // hover solid background
content = content.split('text-indigo-400').join('text-[#0057FF]'); // accents
content = content.split('shadow-indigo-500/20').join('shadow-blue-500/20');
content = content.split('bg-slate-200').join('bg-[#004DE6]'); 

// Specifically target the "Start Free" button
content = content.replace(/bg-white text-slate-900/g, 'bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/20');
// In the mobile menu "Start Free" button
content = content.replace(/bg-white text-\[\#111827\]/g, 'bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/20');


// Fix the "Enterprise aria-hidden..." parsing error that was in the old code? Wait, the old code had an error?
// No, the old code was fine, but let's check.
content = content.replace(/aria-hidden="true">\?/g, 'aria-hidden="true" />');

fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', content);

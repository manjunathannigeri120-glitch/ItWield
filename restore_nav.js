const fs = require('fs');
let content = fs.readFileSync('temp_LandingNav.tsx', 'utf8');

// Manychat style nav transformation
content = content.split('bg-[#F9F8F6]').join('bg-white'); // Nav is white
content = content.split('bg-[#3B3690]').join('bg-[#0057FF]'); // Button to Manychat blue
content = content.split('text-[#3B3690]').join('text-[#0057FF]');
content = content.replace(/hover:bg-\[#2d296e\]/g, 'hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_rgba(0,87,255,0.4)]');

fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', content);

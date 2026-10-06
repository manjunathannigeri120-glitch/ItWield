const fs = require('fs');

const files = [
  'LandingHero.tsx',
  'LandingCore.tsx',
  'LandingFeatures.tsx',
  'LandingTrust.tsx',
  'LandingPricing.tsx',
  'LandingFAQ.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync('temp_' + f, 'utf8');

  // Colors
  content = content.split('bg-[#F9F8F6]').join('bg-[#F4F7FF]'); // Outer backgrounds to soft blue
  content = content.split('bg-[#3B3690]').join('bg-[#0057FF]'); // Primary buttons/accents to Manychat Blue
  content = content.split('text-[#3B3690]').join('text-[#0057FF]');
  content = content.split('shadow-[#3B3690]/20').join('shadow-[#0057FF]/30');
  
  // Shapes & Shadows
  content = content.split('rounded-2xl').join('rounded-[32px]'); // Bigger card radii
  content = content.split('rounded-3xl').join('rounded-[32px]');
  
  // Enhance button hover effects
  content = content.replace(/hover:bg-\[#2d296e\]/g, 'hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_24px_rgba(0,87,255,0.3)]');
  
  // Make borders softer
  content = content.split('border-slate-300').join('border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
  content = content.split('border-slate-200').join('border-slate-100');

  // Fix up specific typography weights for headers if they are just "bold"
  content = content.replace(/text-4xl md:text-5xl font-bold/g, 'text-[40px] md:text-[56px] font-extrabold tracking-tight');
  content = content.replace(/text-5xl md:text-7xl font-bold/g, 'text-[56px] md:text-[80px] font-extrabold tracking-tight');
  
  // Write to the real destination
  fs.writeFileSync('frontend/src/components/landing/' + f, content);
});

// Also restore Landing.tsx
let landingContent = fs.readFileSync('temp_Landing.tsx', 'utf8');
// Keep the white background for the wrapper
landingContent = landingContent.split('bg-[#F9F8F6]').join('bg-white');
fs.writeFileSync('frontend/src/pages/Landing.tsx', landingContent);

console.log('Restored original information with Manychat design');

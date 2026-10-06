const fs = require('fs');

const files = [
  'frontend/src/pages/Landing.tsx',
  'frontend/src/components/landing/LandingHero.tsx',
  'frontend/src/components/landing/LandingCore.tsx',
  'frontend/src/components/landing/LandingFeatures.tsx',
  'frontend/src/components/landing/LandingTrust.tsx',
  'frontend/src/components/landing/LandingPricing.tsx',
  'frontend/src/components/landing/LandingFAQ.tsx',
  'frontend/src/components/landing/LandingNav.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f);
  // Strip BOM if present
  if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
    content = content.slice(3);
  }
  // Remove weird null bytes if it was encoded badly
  let text = content.toString('utf8').replace(/\0/g, '');
  fs.writeFileSync(f, text, 'utf8');
});

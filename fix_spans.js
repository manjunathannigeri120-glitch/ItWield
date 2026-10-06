const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');

// Fix the bizarre corrupted spans
content = content.replace(/ aria-hidden="true".*?<\/span>/g, '</span>');

fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', content);

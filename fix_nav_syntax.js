const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');

// The ? was probably a corrupted right arrow character (?) or something similar inside span tags.
// For example: <span>Solutions ?</span> -> <span>Solutions &rarr;</span>
content = content.replace(/aria-hidden="true">\?/g, 'aria-hidden="true">&rarr;');
content = content.replace(/<span>Solutions \?/g, '<span>Solutions');
content = content.replace(/<span>Enterprise \?/g, '<span>Enterprise');
content = content.replace(/<span>Resources \?/g, '<span>Resources');
content = content.replace(/<span>Product \?/g, '<span>Product');

// Actually, looking at the TS1382 error, the token is probably just an unescaped `?` or a corrupted tag.
// Let's just catch all the `?` right after a closing quote or in span text and replace them safely.
content = content.replace(/aria-hidden="true">\?/g, 'aria-hidden="true">&rarr;');
content = content.replace(/>\?</g, '>&rarr;<');

fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', content);

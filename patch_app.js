const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  "import { OAuthCallback } from '@/pages/OAuthCallback';",
  "import { OAuthCallback } from '@/pages/OAuthCallback';\nimport { Terms } from '@/pages/Terms';\nimport { Privacy } from '@/pages/Privacy';"
);

content = content.replace(
  '<Route path="/pricing" element={<Pricing />} />',
  '<Route path="/pricing" element={<Pricing />} />\n          <Route path="/terms" element={<Terms />} />\n          <Route path="/privacy" element={<Privacy />} />'
);

fs.writeFileSync('frontend/src/App.tsx', content);

const fs = require('fs');

let path = 'frontend/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { Login } from '@/pages/Login';",
  "import { Login } from '@/pages/Login';\nimport { Landing } from '@/pages/Landing';\nimport { Pricing } from '@/pages/Pricing';"
);

c = c.replace(
  /<Route path="\\/login" element=\{<Login \\/>\} \\/>\n\s*<Route path="\\/" element=\{<Navigate to="\\/dashboard" replace \\/>\} \\/>/,
  \<Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />\
);

fs.writeFileSync(path, c);
console.log('patched App.tsx');

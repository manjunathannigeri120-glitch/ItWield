const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const importStatement = "import { CRM } from '@/pages/CRM';\n";

if (!code.includes('CRM }')) {
  code = code.replace("import { MissionDetail } from '@/pages/MissionDetail';", "import { MissionDetail } from '@/pages/MissionDetail';\n" + importStatement);
  code = code.replace('<Route path="/dashboard" element={<Dashboard />} />', '<Route path="/dashboard" element={<Dashboard />} />\n            <Route path="/crm" element={<CRM />} />');
  fs.writeFileSync('frontend/src/App.tsx', code);
}

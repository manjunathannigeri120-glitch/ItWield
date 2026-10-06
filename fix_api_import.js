const fs = require('fs');
let modal = fs.readFileSync('frontend/src/components/UpgradeModal.tsx', 'utf8');

modal = modal.replace("import api from '@/lib/api';", "import { api } from '@/lib/api';");

fs.writeFileSync('frontend/src/components/UpgradeModal.tsx', modal);

const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("import api from '@/lib/api';", "import { api } from '@/lib/api';");
fs.writeFileSync(file, content);

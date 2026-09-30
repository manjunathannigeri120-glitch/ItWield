import fs from 'fs';
let file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useAuth } from '@/hooks/useAuth';",
  ""
);

fs.writeFileSync(file, content);

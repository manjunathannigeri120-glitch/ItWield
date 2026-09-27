const fs = require('fs');
let code = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');

if (!code.includes('Users }')) {
  code = code.replace("import { Bot, Home, Settings, BookOpen, Rocket, GitMerge } from 'lucide-react';", "import { Bot, Home, Settings, BookOpen, Rocket, GitMerge, Users } from 'lucide-react';");
}

if (!code.includes('/crm')) {
  code = code.replace("{ name: 'Agents', href: '/agents', icon: Bot },", "{ name: 'Agents', href: '/agents', icon: Bot },\n    { name: 'CRM', href: '/crm', icon: Users },");
  fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', code);
}

const fs = require('fs');
let p = 'frontend/src/layouts/DashboardLayout.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  "{ name: 'Agents', href: '/agents', icon: Bot },",
  "{ name: 'Missions', href: '/missions', icon: Target },\n    { name: 'Agents', href: '/agents', icon: Bot },"
);
c = c.replace(
  "import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket } from 'lucide-react';",
  "import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket, Target } from 'lucide-react';"
);

fs.writeFileSync(p, c);
console.log('patched DashboardLayout');

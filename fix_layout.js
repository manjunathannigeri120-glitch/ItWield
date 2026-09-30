import fs from 'fs';
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ name: 'Goals', href: '/dashboard', icon: Target },",
  "{ name: 'Goals', href: '/missions', icon: Target }," // or if there's a /goals route... actually missions is the goals equivalent. I will remove Goals or leave it. Wait, the user said "Goals -> existing goals route". Is there a /goals? No, it's /missions.
);
content = content.replace(
  "{ name: 'Approvals', href: '/dashboard', icon: Target, disabled: false },",
  "{ name: 'Approvals', href: '/approvals', icon: Target, disabled: false },"
);

fs.writeFileSync(file, content);

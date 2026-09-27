import re

with open('frontend/src/layouts/DashboardLayout.tsx', 'r') as f:
    c = f.read()

# Replace navItems
old_nav = """  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Missions', href: '/missions', icon: Target },
    { name: 'Agents', href: '/agents', icon: Bot },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Memory', href: '/memory', icon: Database },
    { name: 'Knowledge', href: '/knowledge', icon: BookOpen },
    { name: 'Workflows', href: '/workflows', icon: GitMerge },
    { name: 'Deployments', href: '/deployments', icon: Rocket, disabled: true },

    { name: 'Settings', href: '/settings', icon: Settings },
  ];"""

new_nav = """  const navItems = [
    { name: 'Command Center', href: '/dashboard', icon: Home },
    { name: 'Goals', href: '/dashboard', icon: Target },
    { name: 'Missions', href: '/missions', icon: Rocket },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Workforce', href: '/agents', icon: Bot },
    { name: 'Connections', href: '/connections', icon: GitMerge },
    { name: 'Approvals', href: '/dashboard', icon: Target, disabled: false },
    { name: 'Company Brain', href: '/memory', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];"""

if "Command Center" not in c:
    c = c.replace(old_nav, new_nav)

with open('frontend/src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write(c)

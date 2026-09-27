import re

with open('frontend/src/layouts/DashboardLayout.tsx', 'r') as f:
    c = f.read()
c = c.replace(
    "import { Bot, Home, Settings, BookOpen, Rocket, GitMerge, Users, Database } from 'lucide-react';",
    "import { Bot, Home, Settings, BookOpen, Rocket, GitMerge, Users, Database, Target } from 'lucide-react';"
)
with open('frontend/src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write(c)

with open('frontend/src/pages/Settings.tsx', 'r') as f:
    c = f.read()

# Remove the incorrectly placed PlanSettings
c = c.replace(
    "<PlanSettings workspaceId={workspaces?.find((w: any) => w.status === 'operating' || w.status === 'ACTIVE' || w.status === 'operating' || true)?.id || ''} />",
    ""
)

# Insert it at the bottom of Settings()
# We need to find the end of Settings() which is right before function ConnectionsManager()
match = re.search(r'(</Card>\s*</div>\s*)\nfunction ConnectionsManager', c)
if match:
    c = c[:match.start()] + "\n        {workspaces && workspaces.length > 0 && <PlanSettings workspaceId={workspaces.find((w: any) => w.status === 'operating' || true)?.id || ''} />}\n" + c[match.start():]

with open('frontend/src/pages/Settings.tsx', 'w') as f:
    f.write(c)
print('fixed settings')

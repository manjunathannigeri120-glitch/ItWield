import re

with open('frontend/src/App.tsx', 'r') as f:
    c = f.read()

if "import { Connections }" not in c:
    c = c.replace("import { Settings } from '@/pages/Settings';", "import { Settings } from '@/pages/Settings';\nimport { Connections } from '@/pages/Connections';")

with open('frontend/src/App.tsx', 'w') as f:
    f.write(c)

with open('frontend/src/layouts/DashboardLayout.tsx', 'r') as f:
    c2 = f.read()
    c2 = c2.replace("BookOpen, ", "")
with open('frontend/src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write(c2)

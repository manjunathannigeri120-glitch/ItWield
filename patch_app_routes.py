import re

with open('frontend/src/App.tsx', 'r') as f:
    c = f.read()

if "import { Connections }" not in c:
    c = c.replace("import { Settings } from './pages/Settings';", "import { Settings } from './pages/Settings';\nimport { Connections } from './pages/Connections';")

if '<Route path="/connections"' not in c:
    c = c.replace(
        '<Route path="/settings"',
        '<Route path="/connections" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Connections /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />\n          <Route path="/settings"'
    )

with open('frontend/src/App.tsx', 'w') as f:
    f.write(c)

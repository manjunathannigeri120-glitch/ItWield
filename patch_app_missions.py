import re

p = 'frontend/src/App.tsx'
with open(p, 'r') as f:
    c = f.read()

c = c.replace(
  "import { MissionDetail } from '@/pages/MissionDetail';",
  "import { Missions } from '@/pages/Missions';\nimport { MissionDetail } from '@/pages/MissionDetail';"
)

c = re.sub(
  r'<Route path="/missions/:missionId".+?/>',
  """<Route path="/missions" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Missions /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />""",
  c
)

with open(p, 'w') as f:
    f.write(c)

print('patched app with missions')

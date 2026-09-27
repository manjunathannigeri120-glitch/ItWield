import re

p = 'frontend/src/App.tsx'
with open(p, 'r') as f:
    c = f.read()

c = c.replace(
    """<Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />""",
    """<Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />"""
)

with open(p, 'w') as f:
    f.write(c)

print('fixed App.tsx routes')

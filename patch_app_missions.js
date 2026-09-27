const fs = require('fs');
let p = 'frontend/src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  "import { MissionDetail } from '@/pages/MissionDetail';",
  "import { Missions } from '@/pages/Missions';\nimport { MissionDetail } from '@/pages/MissionDetail';"
);

c = c.replace(
  /<Route path="\\/missions\\/:missionId" element=\{<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail \\/><\\/DashboardLayout><\\/WorkspaceGuard><\\/ProtectedRoute>\} \\/>/,
  \<Route path="/missions" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Missions /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />\
);

fs.writeFileSync(p, c);
console.log('patched app with missions');

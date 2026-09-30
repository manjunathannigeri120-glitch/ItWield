import fs from 'fs';
let file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure imports
if (!content.includes('import CTO')) {
  content = content.replace("import Dashboard from '@/pages/Dashboard';", "import Dashboard from '@/pages/Dashboard';\nimport CTO from '@/pages/CTO';\nimport CompanyControl from '@/pages/CompanyControl';\nimport Approvals from '@/pages/Approvals';");
}

// Ensure routes
if (!content.includes('path="/cto"')) {
  content = content.replace(
    '<Route path="/agents/:id/chat" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentChat /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />',
    '<Route path="/agents/:id/chat" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentChat /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />\n          <Route path="/cto" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><CTO /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />\n          <Route path="/control" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><CompanyControl /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />\n          <Route path="/approvals" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Approvals /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />'
  );
}

fs.writeFileSync(file, content);

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Onboarding } from '@/pages/Onboarding';
import { Agents } from '@/pages/Agents';
import { AgentNew } from '@/pages/AgentNew';
import { AgentChat } from '@/pages/AgentChat';
import { Settings } from '@/pages/Settings';
import { Knowledge } from '@/pages/Knowledge';
import { Workflows } from '@/pages/Workflows';
import { WorkflowRuns } from '@/pages/WorkflowRuns';
import { WorkflowRunDetail } from '@/pages/WorkflowRunDetail';
import { OAuthCallback } from '@/pages/OAuthCallback';

import { MissionDetail } from '@/pages/MissionDetail';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  
  useEffect(() => {
    api.get('/workspaces')
      .then(res => {
        if (res.data && res.data.length > 0) {
          // Look for any workspace that is fully operating
          const operatingWs = res.data.find((w: any) => w.status === 'operating');
          if (operatingWs) {
            setStatus('operating');
          } else {
            setStatus('pending');
          }
        } else {
          // No workspaces exist at all
          setStatus('pending');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('WorkspaceGuard fetch error:', err);
        setLoading(false);
        setStatus('pending'); // Fallback to pending to trigger onboarding
      });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading workspace...</div>;
  if (status === 'pending') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* V2 Onboarding: Protected by Auth, but explicitly bypasses WorkspaceGuard */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* V2 Command Center: Fully guarded by WorkspaceGuard */}
          <Route path="/dashboard" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Dashboard /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Agents /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents/new" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentNew /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents/:id/chat" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentChat /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Knowledge /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Workflows /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows/:id/runs" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><WorkflowRuns /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows/:id/runs/:runId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><WorkflowRunDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Settings /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          
          {/* OAuth integrations do not render full layouts, but still require an operating workspace context */}
          <Route path="/settings/connections/callback" element={<ProtectedRoute><WorkspaceGuard><OAuthCallback /></WorkspaceGuard></ProtectedRoute>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

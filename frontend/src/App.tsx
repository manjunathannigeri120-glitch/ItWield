import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Agents } from '@/pages/Agents';
import { AgentNew } from '@/pages/AgentNew';
import { AgentChat } from '@/pages/AgentChat';
import { Settings } from '@/pages/Settings';
import { Knowledge } from '@/pages/Knowledge';
import { Workflows } from '@/pages/Workflows';
import { WorkflowRuns } from '@/pages/WorkflowRuns';
import { WorkflowRunDetail } from '@/pages/WorkflowRunDetail';
import { OAuthCallback } from '@/pages/OAuthCallback';



const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><DashboardLayout><Agents /></DashboardLayout></ProtectedRoute>} />
          <Route path="/agents/new" element={<ProtectedRoute><DashboardLayout><AgentNew /></DashboardLayout></ProtectedRoute>} />
          <Route path="/agents/:id/chat" element={<ProtectedRoute><DashboardLayout><AgentChat /></DashboardLayout></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><DashboardLayout><Knowledge /></DashboardLayout></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><DashboardLayout><Workflows /></DashboardLayout></ProtectedRoute>} />
          <Route path="/workflows/:id/runs" element={<ProtectedRoute><DashboardLayout><WorkflowRuns /></DashboardLayout></ProtectedRoute>} />
          <Route path="/workflows/:id/runs/:runId" element={<ProtectedRoute><DashboardLayout><WorkflowRunDetail /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings/connections/callback" element={<ProtectedRoute><OAuthCallback /></ProtectedRoute>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

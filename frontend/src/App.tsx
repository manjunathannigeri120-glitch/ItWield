import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

import { DashboardLayout } from './layouts/DashboardLayout';
import { CookieBanner } from './components/CookieBanner';
import { NotFound } from './pages/NotFound';
import { FeedbackModal } from './components/FeedbackModal';
import { Login } from '@/pages/Login';
import { Landing } from '@/pages/Landing';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { Pricing } from '@/pages/Pricing';
import Dashboard from '@/pages/Dashboard';
import CTO from '@/pages/CTO';
import CompanyControl from '@/pages/CompanyControl';
import Approvals from '@/pages/Approvals';
import { Onboarding } from '@/pages/Onboarding';
import { Agents } from '@/pages/Agents';
import { AgentNew } from '@/pages/AgentNew';
import { AgentChat } from '@/pages/AgentChat';
import { Settings } from '@/pages/Settings';
import { Account } from '@/pages/Account';
import Connections from '@/pages/Connections';
import { Knowledge } from '@/pages/Knowledge';
import { Workflows } from '@/pages/Workflows';
import { WorkflowRuns } from '@/pages/WorkflowRuns';
import { WorkflowRunDetail } from '@/pages/WorkflowRunDetail';
import { OAuthCallback } from '@/pages/OAuthCallback';

import { Missions } from '@/pages/Missions';
import { MissionDetail } from '@/pages/MissionDetail';
import { GoalDetail } from '@/pages/GoalDetail';
import CRM from '@/pages/CRM';
import { Memory } from '@/pages/Memory';


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
          const operatingWs = res.data.find((w: any) => w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE');
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
          if (err.message === 'Network Error' || (err.response && err.response.status >= 500)) {
            setStatus('error');
          } else {
            // Only fallback to onboarding if it's a 4xx error (e.g. 404) or similar
            setStatus('pending');
          }
          setLoading(false);
        });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading workspace...</div>;
    if (status === 'error') {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Connecting to Server</h2>
          <p className="max-w-md text-center">
            Our systems are currently waking up or experiencing high load. Please wait a moment.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry Connection
          </button>
        </div>
      );
    }
  if (status === 'pending') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
                    
          {/* V2 Onboarding: Protected by Auth, but explicitly bypasses WorkspaceGuard */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* V2 Command Center: Fully guarded by WorkspaceGuard */}
          <Route path="/dashboard" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Dashboard /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><CRM /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/memory" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Memory /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/goals/:goalId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><GoalDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/missions" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Missions /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/missions/:missionId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><MissionDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Agents /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents/new" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentNew /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/agents/:id/chat" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><AgentChat /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/cto" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><CTO /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/control" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><CompanyControl /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Approvals /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Knowledge /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Workflows /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows/:id/runs" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><WorkflowRuns /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/workflows/:id/runs/:runId" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><WorkflowRunDetail /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/connections" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Connections /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Settings /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><WorkspaceGuard><DashboardLayout><Account /></DashboardLayout></WorkspaceGuard></ProtectedRoute>} />
          
          {/* OAuth integrations do not render full layouts, but still require an operating workspace context */}
          <Route path="/settings/connections/callback" element={<ProtectedRoute><WorkspaceGuard><OAuthCallback /></WorkspaceGuard></ProtectedRoute>} />
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
          <Route path="/secure-admin-panel" element={<ProtectedRoute><DashboardLayout><GodMode /></DashboardLayout></ProtectedRoute>} />
      </Routes>
        <FeedbackModal />
        <CookieBanner />
        </Router>
    </QueryClientProvider>
  );
}

export default App;










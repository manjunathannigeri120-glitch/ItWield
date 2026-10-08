import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

import { DashboardLayout } from './layouts/DashboardLayout';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refund from './pages/legal/Refund';
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
import { GodMode } from './pages/GodMode';
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
  
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0f] text-slate-300">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-mono text-slate-400">Verifying session...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  // Optimistic bypass: If user already has a cached workspace, enter immediately without blocking!
  const cachedWsId = localStorage.getItem('itwield_workspace_id');
  const [status, setStatus] = useState<string | null>(() => (cachedWsId ? 'operating' : null));
  const [loading, setLoading] = useState<boolean>(() => !cachedWsId);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timer: any;

    const checkWorkspace = async (attempt: number = 0) => {
      try {
        const res = await api.get('/workspaces');
        if (!isMounted) return;

        if (res.data && res.data.length > 0) {
          const operatingWs = res.data.find((w: any) => 
            w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE'
          );
          if (operatingWs) {
            localStorage.setItem('itwield_workspace_id', operatingWs.id);
            setStatus('operating');
          } else {
            localStorage.setItem('itwield_workspace_id', res.data[0].id);
            setStatus('operating');
          }
        } else {
          localStorage.removeItem('itwield_workspace_id');
          setStatus('pending');
        }
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;

        // If we already have a cached workspace, never lock out the user on transient errors
        if (cachedWsId) {
          setStatus('operating');
          setLoading(false);
          return;
        }

        // 4xx errors (client-side / no workspace) -> onboarding
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          setStatus('pending');
          setLoading(false);
          return;
        }

        // Transient network or server hiccup: auto-retry smoothly
        if (attempt < 15) {
          setRetryCount(attempt + 1);
          timer = setTimeout(() => {
            checkWorkspace(attempt + 1);
          }, 1500);
        } else {
          setStatus('error');
          setLoading(false);
        }
      }
    };

    checkWorkspace(0);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0f] text-slate-100">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Loading ItWield...</h2>
        <p className="text-sm text-slate-400 font-mono">
          {retryCount > 0 ? `Synchronizing workspace (attempt ${retryCount}/15)...` : 'Connecting to your AI company workspace'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0f] text-slate-200">
        <div className="p-8 max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl text-center backdrop-blur-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Command Center</h2>
          <p className="text-sm text-slate-400 mb-6">
            Establishing secure connection to your workspace. Auto-reconnecting in the background...
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            Reconnect Now
          </button>
        </div>
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
          <Route path="/secure admin panel" element={<ProtectedRoute><DashboardLayout><GodMode /></DashboardLayout></ProtectedRoute>} />
        <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
        </Routes>
        <FeedbackModal />
        <CookieBanner />
        </Router>
    </QueryClientProvider>
  );
}

export default App;













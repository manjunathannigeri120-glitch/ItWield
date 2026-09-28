import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Shield, Pause, Play, Square, Activity, History, CheckCircle, GitBranch, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyControl() {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorkspaceAndData();
    }
  }, [user]);

  const loadWorkspaceAndData = async () => {
    try {
      setLoading(true);
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data?.[0];
      if (!ws) return;
      setCurrentWorkspace(ws);
      
      const [stateRes, logsRes, systemsRes, approvalsRes] = await Promise.all([
        api.get('/workspaces/' + ws.id + '/control/state'),
        api.get('/workspaces/' + ws.id + '/control/audit'),
        api.get('/workspaces/' + ws.id + '/control/systems'),
        api.get('/workspaces/' + ws.id + '/control/approvals/pending'),
      ]);
      setState(stateRes.data);
      setLogs(logsRes.data?.auditLogs || []);
      setSystems(systemsRes.data?.systems || []);
      setApprovals(approvalsRes.data?.approvals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const testSystemConnection = async (sysId: string) => {
    if (!currentWorkspace) return;
    try {
        const res = await api.post('/workspaces/' + currentWorkspace.id + '/connections/' + sysId + '/test', {});
        if(res.data) { 
            alert('Test Complete: ' + res.data.status); 
            loadWorkspaceAndData(); 
        }
    } catch (e) {
        console.error(e);
        alert('Test failed');
    }
  };

  const changeState = async (newState: string) => {
    if (!currentWorkspace) return;
    try {
      await api.post('/workspaces/' + currentWorkspace.id + '/control/state', { state: newState });
      setState({ operating_state: newState });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading Control Layer...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Shield className="mr-3 w-8 h-8 text-indigo-600" /> Company Control Layer
          </h1>
          <p className="text-slate-500 mt-1">Founder control and governance over autonomous operations.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => changeState('OPERATING')} disabled={state?.operating_state === 'OPERATING'} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
            <Play className="w-4 h-4 mr-2" /> Resume
          </Button>
          <Button onClick={() => changeState('PAUSED')} disabled={state?.operating_state === 'PAUSED'} variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
          <Button onClick={() => changeState('STOPPED')} disabled={state?.operating_state === 'STOPPED'} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 flex items-center mb-4">
            <Activity className="w-5 h-5 mr-2 text-indigo-500" /> Operating State
          </h3>
          <div className="text-2xl font-bold">
            {state?.operating_state === 'OPERATING' && <span className="text-green-600">OPERATING</span>}
            {state?.operating_state === 'PAUSED' && <span className="text-amber-600">PAUSED</span>}
            {state?.operating_state === 'STOPPED' && <span className="text-red-600">STOPPED</span>}
          </div>
          <p className="text-sm text-slate-500 mt-2">Executives are ACTIVE.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 flex items-center mb-4">
            <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" /> Pending Approvals
          </h3>
          <div className="text-2xl font-bold text-slate-800">{approvals.length}</div>
          <p className="text-sm text-slate-500 mt-2">Requires founder attention.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 flex items-center mb-4">
            <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Connected Systems
          </h3>
          <div className="text-2xl font-bold text-slate-800">{systems.length}</div>
          <p className="text-sm text-slate-500 mt-2">Total external integrations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-slate-400" /> Connected Company Systems
          </h3>
          <Button variant="outline" size="sm">Connect New System</Button>
        </div>
        <div className="divide-y divide-slate-100">
          {systems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No systems connected yet.</div>
          ) : (
            systems.map((sys) => (
              <div key={sys.id} className="p-6 flex flex-col sm:flex-row justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 text-lg">{sys.display_name}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">{sys.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{sys.system_type}</p>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Available Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {sys.capabilities?.map((cap: string) => (
                        <span key={cap} className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 flex items-center">
                          <Check className="w-3 h-3 mr-1 text-green-500" /> {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col space-y-2 items-end justify-start">
                  <Button variant="outline" size="sm" onClick={() => testSystemConnection(sys.id)}>Test Connection</Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Disconnect</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 flex items-center">
            <History className="w-5 h-5 mr-2 text-slate-400" /> Action Audit Log
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No actions recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{log.actor}</span>
                    <span className="text-slate-400 text-sm">executed</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{log.action}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{log.policy_decision}</div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center space-x-3">
                  <span className={"text-xs font-bold px-2 py-1 rounded-full " + (log.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' : log.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-700' : log.risk_level === 'MEDIUM' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')}>
                    {log.risk_level} RISK
                  </span>
                  <span className={"text-xs font-bold px-2 py-1 rounded-full " + (log.authority === 'AUTONOMOUS' ? 'bg-green-100 text-green-700' : log.authority === 'APPROVAL_REQUIRED' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700')}>
                    {log.authority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


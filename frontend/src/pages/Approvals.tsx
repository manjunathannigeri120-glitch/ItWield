import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldAlert, Edit3, Mail, Sparkles, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Approvals() {
  const { currentWorkspace: authWs } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContext, setEditContext] = useState<string>('');

  const loadApprovals = useCallback(async (wsId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${wsId}/control/approvals/pending`);
      setApprovals(res.data?.approvals || []);
    } catch (e) {
      console.error('[Approvals] Error loading approvals:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initWorkspace = async () => {
      try {
        let wsId = authWs?.id;
        if (!wsId) {
          const wsRes = await api.get('/workspaces');
          wsId = wsRes.data?.[0]?.id;
        }
        if (wsId) {
          setWorkspaceId(wsId);
          await loadApprovals(wsId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Approvals] Failed to fetch workspace:', err);
        setLoading(false);
      }
    };
    initWorkspace();
  }, [authWs?.id, loadApprovals]);

  const handleApprove = async (approvalId: string) => {
    if (!workspaceId) return;
    try {
      setActionLoading(approvalId);
      let payload: any = {};
      if (editingId === approvalId) {
        try {
          payload = { editedContext: JSON.parse(editContext) };
        } catch (e) {
          alert('Invalid JSON formatting in edited draft. Please fix it before approving.');
          setActionLoading(null);
          return;
        }
      }
      await api.post(`/workspaces/${workspaceId}/approvals/${approvalId}/approve`, payload);
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      setEditingId(null);
      alert('Action successfully approved and executed!');
      loadApprovals(workspaceId);
    } catch (e: any) {
      alert('Failed to approve: ' + (e.response?.data?.error || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!workspaceId) return;
    try {
      setActionLoading(approvalId);
      await api.post(`/workspaces/${workspaceId}/approvals/${approvalId}/reject`);
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      setEditingId(null);
      alert('Action request successfully rejected.');
      loadApprovals(workspaceId);
    } catch (e: any) {
      alert('Failed to reject: ' + (e.response?.data?.error || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSample = async () => {
    if (!workspaceId) return;
    try {
      setSampleLoading(true);
      await api.post(`/workspaces/${workspaceId}/control/approvals/sample`);
      await loadApprovals(workspaceId);
    } catch (e: any) {
      alert('Failed to generate sample approval: ' + (e.response?.data?.error || e.message));
    } finally {
      setSampleLoading(false);
    }
  };

  const toggleEdit = (a: any) => {
    if (editingId === a.id) {
      setEditingId(null);
    } else {
      setEditingId(a.id);
      const dataPayload = a.context || a.payload || {};
      setEditContext(JSON.stringify(dataPayload, null, 2));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="font-medium">Connecting to Governance Engine...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Founder Approvals Center</h1>
            <p className="text-sm text-slate-500">
              Human-in-the-loop oversight gate. High-risk and outbound actions require explicit authorization.
            </p>
          </div>
        </div>
        {approvals.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSample}
            disabled={sampleLoading}
            className="text-xs text-slate-600 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
          >
            {sampleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            + Simulate Action Gate
          </Button>
        )}
      </div>

      {approvals.length === 0 ? (
        <Card className="bg-slate-50 border-slate-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">No Pending Approvals</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                The company is operating safely. Autonomous agents are restricted to internal analysis and cannot execute outbound actions without your explicit sign-off.
              </p>
            </div>
            <Button
              onClick={handleGenerateSample}
              disabled={sampleLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 mt-2 shadow-sm"
            >
              {sampleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Simulate Outbound Approval Gate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {approvals.map((a: any) => {
            const dataPayload = a.context || a.payload || {};
            const isEmailOutreach =
              a.action === 'EXTERNAL_COMMUNICATION' ||
              !!dataPayload.recipient ||
              !!dataPayload.draft?.recipient;

            const recipient = dataPayload.recipient || dataPayload.draft?.recipient || '';
            const subject = dataPayload.subject || dataPayload.draft?.subject || '';
            const body = dataPayload.body || dataPayload.draft?.body || dataPayload.text || '';

            const isProcessing = actionLoading === a.id;

            return (
              <Card key={a.id} className="border-amber-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-3 bg-amber-50/60 border-b border-amber-100">
                  <CardTitle className="text-lg flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-slate-900">{a.title || a.action || 'Action Request'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        {a.risk_level || 'High Risk'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Awaiting Sign-off
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5 text-xs uppercase tracking-wide">
                        Rationale & Diagnosis
                      </span>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {a.reason || a.description || 'Action flagged for human verification prior to live execution.'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5 text-xs uppercase tracking-wide">
                        Requesting Executive
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-slate-800 font-semibold border border-slate-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {a.requested_by_executive || a.requested_by || 'AI Executive'}
                      </span>
                      {dataPayload.lead_score && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                          Lead Score: {dataPayload.lead_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formatted Draft / Payload Preview */}
                  {dataPayload && Object.keys(dataPayload).length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                          {isEmailOutreach ? <Mail className="w-4 h-4 text-indigo-600" /> : null}
                          {isEmailOutreach ? 'Staged Outbound Draft' : 'Proposed Payload Context'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                          onClick={() => toggleEdit(a)}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          {editingId === a.id ? 'Cancel Edit' : 'Edit Staged Payload'}
                        </Button>
                      </div>

                      {editingId === a.id ? (
                        <div className="space-y-2">
                          <p className="text-xs text-amber-700 font-medium">
                            Modify the parameters or email copy below. Click "Approve & Execute" to dispatch with your edits.
                          </p>
                          <textarea
                            className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-md min-h-[160px] focus:ring-amber-500 focus:border-amber-500 shadow-inner"
                            value={editContext}
                            onChange={(e) => setEditContext(e.target.value)}
                          />
                        </div>
                      ) : isEmailOutreach && (recipient || subject || body) ? (
                        <div className="bg-white rounded-md p-3.5 border border-slate-200 space-y-2 text-sm">
                          {recipient && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1 border-b border-slate-100">
                              <span className="font-bold text-slate-700">To:</span>
                              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{recipient}</span>
                            </div>
                          )}
                          {subject && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1 border-b border-slate-100">
                              <span className="font-bold text-slate-700">Subject:</span>
                              <span className="font-medium text-slate-900">{subject}</span>
                            </div>
                          )}
                          {body && (
                            <div className="pt-1 text-slate-700 whitespace-pre-line text-xs font-sans leading-relaxed">
                              {body}
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-white p-3 rounded-md border border-slate-200 overflow-x-auto">
                          {JSON.stringify(dataPayload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Execution Control Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleApprove(a.id)}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-sm"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve & Execute Live
                    </Button>
                    <Button
                      onClick={() => handleReject(a.id)}
                      disabled={isProcessing}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Reject Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldAlert, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Approvals() {
  const { currentWorkspace } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContext, setEditContext] = useState<string>('');

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadApprovals();
    }
  }, [currentWorkspace?.id]);

  const loadApprovals = async () => {
    try {
      const res = await api.get('/workspaces/' + currentWorkspace.id + '/control/approvals/pending');
      setApprovals(res.data.approvals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, currentContext?: any) => {
    try {
      let payload = {};
      if (editingId === approvalId) {
        try {
          payload = { editedContext: JSON.parse(editContext) };
        } catch (e) {
          alert("Invalid JSON in edits. Please fix formatting before approving.");
          return;
        }
      }
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/approve`, payload); alert('Approval successfully executed!');
      setEditingId(null);
      loadApprovals();
    } catch (e) {
      alert('Failed to approve: ' + ((e as any).response?.data?.error || (e as any).message));
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/reject`); alert('Request successfully rejected.');
      setEditingId(null);
      loadApprovals();
    } catch (e) {
      alert('Failed to reject: ' + ((e as any).response?.data?.error || (e as any).message));
    }
  };
  
  const toggleEdit = (a: any) => {
    if (editingId === a.id) {
      setEditingId(null);
    } else {
      setEditingId(a.id);
      setEditContext(JSON.stringify(a.context || {}, null, 2));
    }
  };

  if (loading) return <div className="p-8">Loading Approvals...</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold">Founder Approvals</h1>
      </div>

      {approvals.length === 0 ? (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="flex items-center justify-center h-32 text-slate-500">
            No approvals required. The company is operating safely.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {approvals.map((a: any) => (
            <Card key={a.id} className="border-amber-200 shadow-sm">
              <CardHeader className="pb-2 bg-amber-50/50">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{a.title || a.action || 'Action Request'}</span>
                  <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Approval Required
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-semibold text-slate-600 block mb-1">Details</span>
                    {a.description || a.reason || 'No description provided.'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 block mb-1">Requested By</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {a.requested_by || a.requested_by_executive || 'AI Executive'}
                    </span>
                  </div>
                </div>
                
                {a.context && Object.keys(a.context).length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-700">Payload / Draft</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500" onClick={() => toggleEdit(a)}>
                        <Edit3 className="w-3 h-3 mr-1" /> {editingId === a.id ? 'Cancel Edit' : 'Edit Draft'}
                      </Button>
                    </div>
                    {editingId === a.id ? (
                      <textarea 
                        className="w-full text-sm font-mono p-3 bg-white border border-slate-300 rounded-md min-h-[150px] focus:ring-amber-500 focus:border-amber-500"
                        value={editContext}
                        onChange={(e) => setEditContext(e.target.value)}
                      />
                    ) : (
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-white p-3 rounded-md border border-slate-100">
                        {JSON.stringify(a.context, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleApprove(a.id, a.context)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-4 h-4 mr-2" /> Approve & Execute
                  </Button>
                  <Button onClick={() => handleReject(a.id)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

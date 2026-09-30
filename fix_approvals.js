import fs from 'fs';
let file = 'frontend/src/pages/Approvals.tsx';
let content = "import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Approvals() {
  const { currentWorkspace } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadApprovals();
    }
  }, [currentWorkspace?.id]);

  const loadApprovals = async () => {
    try {
      const res = await api.get('/command-center/' + currentWorkspace.id);
      setApprovals(res.data.approvals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await api.post('/workspaces/' + currentWorkspace.id + '/approvals/' + approvalId + '/approve');
      loadApprovals();
    } catch (e) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await api.post('/workspaces/' + currentWorkspace.id + '/approvals/' + approvalId + '/reject');
      loadApprovals();
    } catch (e) {
      alert('Failed to reject');
    }
  };

  if (loading) return <div className=\\"p-8\\">Loading Approvals...</div>;

  return (
    <div className=\\"p-8 space-y-6 max-w-5xl mx-auto\\">
      <div className=\\"flex items-center gap-3 mb-6\\">
        <ShieldAlert className=\\"w-8 h-8 text-amber-500\\" />
        <h1 className=\\"text-2xl font-bold\\">Approvals Requiring Your Attention</h1>
      </div>

      {approvals.length === 0 ? (
        <Card className=\\"bg-slate-50 border-slate-200\\">
          <CardContent className=\\"flex items-center justify-center h-32 text-slate-500\\">
            No approvals required.
          </CardContent>
        </Card>
      ) : (
        <div className=\\"grid gap-4\\">
          {approvals.map((a: any) => (
            <Card key={a.id} className=\\"border-amber-200 shadow-sm\\">
              <CardHeader className=\\"pb-2 bg-amber-50/50\\">
                <CardTitle className=\\"text-lg flex justify-between items-center\\">
                  <span>{a.action}</span>
                  <span className=\\"text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider\\">
                    Approval Required
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className=\\"space-y-4 pt-4\\">
                <div className=\\"grid grid-cols-2 gap-4 text-sm\\">
                  <div>
                    <span className=\\"font-semibold text-slate-600 block mb-1\\">Reason</span>
                    {a.reason}
                  </div>
                  <div>
                    <span className=\\"font-semibold text-slate-600 block mb-1\\">Requested By</span>
                    {a.requested_by_executive || 'AI Executive'}
                  </div>
                </div>
                
                <div className=\\"flex gap-3 pt-2\\">
                  <Button onClick={() => handleApprove(a.id)} className=\\"bg-emerald-600 hover:bg-emerald-700\\">
                    <Check className=\\"w-4 h-4 mr-2\\" /> Approve
                  </Button>
                  <Button onClick={() => handleReject(a.id)} variant=\\"outline\\" className=\\"text-red-600 border-red-200 hover:bg-red-50\\">
                    <X className=\\"w-4 h-4 mr-2\\" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}";

fs.writeFileSync(file, content.substring(1, content.length - 1));

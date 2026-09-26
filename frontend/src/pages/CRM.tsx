import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, XCircle, Send } from 'lucide-react';

const COLUMNS = [
  { id: 'RESEARCHED', label: 'Researched' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'OUTREACH_DRAFTED', label: 'Drafted' },
  { id: 'AWAITING_APPROVAL', label: 'Approvals' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'RESPONDED', label: 'Responded' },
  { id: 'SALES_QUALIFIED', label: 'Sales Qual' },
  { id: 'PROPOSAL', label: 'Proposal' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' }
];

export default function CRM() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  
  // Modals / Interaction States
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [responseInput, setResponseInput] = useState('');
  const [conversionOutcome, setConversionOutcome] = useState<'WON' | 'LOST'>('WON');
  const [conversionEvidence, setConversionEvidence] = useState('');
  const [conversionValue, setConversionValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating');
      if (!ws) {
        setLoading(false);
        return;
      }
      setWorkspace(ws);
      const res = await api.get(`/workspaces/${ws.id}/crm/opportunities`);
      setOpportunities(res.data);
      setLoading(false);
    } catch (e) {
      console.error('Failed to load CRM', e);
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!selectedOpp || !workspace) return;
    try {
      await api.post(`/workspaces/${workspace.id}/crm/opportunities/${selectedOpp.id}/response`, {
        responseText: responseInput,
        classification: 'User manual entry'
      });
      setShowResponseModal(false);
      setResponseInput('');
      setSelectedOpp(null);
      loadData();
    } catch (e: any) {
      alert("Error recording response: " + e.message);
    }
  };

  const submitConversion = async () => {
    if (!selectedOpp || !workspace) return;
    try {
      await api.post(`/workspaces/${workspace.id}/crm/opportunities/${selectedOpp.id}/convert`, {
        outcome: conversionOutcome,
        evidence: conversionEvidence,
        valueStr: conversionValue
      });
      setShowConvertModal(false);
      setConversionEvidence('');
      setConversionValue('');
      setSelectedOpp(null);
      loadData();
    } catch (e: any) {
      alert("Error recording conversion: " + e.message);
    }
  };

  const requestFollowUp = async () => {
    if (!selectedOpp || !workspace) return;
    if (!confirm('Ask the AI to draft a follow-up email?')) return;
    try {
      await api.post(`/workspaces/${workspace.id}/crm/opportunities/${selectedOpp.id}/follow-up`, {
        reason: 'Owner requested follow up sequence.'
      });
      setSelectedOpp(null);
      loadData();
      alert("Follow-up drafted. Check Command Center approvals.");
    } catch (e: any) {
      alert("Error generating follow-up: " + e.message);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Growth Engine...</div>;
  if (!workspace) return <div className="p-8">No operating workspace found.</div>;

  const grouped = COLUMNS.map(col => ({
    ...col,
    items: opportunities.filter(o => o.stage === col.id || (col.id === 'WON' && o.stage === 'CONVERTED'))
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue & Customer Growth</h1>
          <p className="text-sm text-gray-500">Autonomous CRM pipeline and verified business outcomes.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {grouped.map(col => (
            <div key={col.id} className="w-72 flex flex-col h-full bg-gray-100 rounded-lg shrink-0">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 sticky top-0 rounded-t-lg">
                <span className="font-bold text-gray-700 text-sm tracking-wide">{col.label}</span>
                <span className="text-xs font-bold bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{col.items.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2">
                {col.items.map(opp => (
                  <Card key={opp.id} className="shadow-sm border border-gray-200 hover:border-blue-400 cursor-pointer hover:shadow transition-all" onClick={() => setSelectedOpp(opp)}>
                    <div className="p-3">
                      <div className="font-bold text-sm text-gray-900 line-clamp-1">{opp.company_name}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{opp.evidence?.reason_for_match || 'No rationale available'}</div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {new Date(opp.created_at).toLocaleDateString()}
                        </span>
                        {opp.contact_history?.length > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {opp.contact_history.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OPPORTUNITY DETAIL MODAL */}
      {selectedOpp && !showResponseModal && !showConvertModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOpp.company_name}</h2>
                <div className="text-sm text-gray-500 mt-0.5 flex gap-2">
                  <span>{selectedOpp.website || 'No website'}</span> • <span className="uppercase font-bold text-blue-600">{selectedOpp.stage}</span>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedOpp(null)} className="text-gray-500">Close</Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Qualification */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Qualification & Evidence</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-800">
                  {selectedOpp.evidence?.reason_for_match || 'No qualification evidence recorded.'}
                </div>
              </div>

              {/* History */}
              {selectedOpp.contact_history && selectedOpp.contact_history.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact History</h3>
                  <div className="space-y-3">
                    {selectedOpp.contact_history.map((h: any, i: number) => (
                      <div key={i} className="border border-gray-100 p-3 rounded-lg bg-white shadow-sm flex gap-3">
                        <div className="mt-1">
                          {h.type === 'RESPONSE' ? <Mail className="w-4 h-4 text-emerald-500" /> : <Send className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-500 mb-1">{new Date(h.timestamp).toLocaleString()} • {h.type}</div>
                          <div className="text-sm text-gray-800">{h.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Outcome */}
              {selectedOpp.evidence?.conversion_evidence && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Verified Business Outcome
                  </h3>
                  <div className="text-sm text-emerald-900 mb-2">{selectedOpp.evidence.conversion_evidence}</div>
                  {selectedOpp.evidence.conversion_value && <div className="text-sm font-bold text-emerald-700">Value: {selectedOpp.evidence.conversion_value}</div>}
                </div>
              )}

            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-between items-center">
              <div>
                {selectedOpp.ai_classification && (
                  <div className="text-xs font-medium text-gray-500">AI Assessment: {selectedOpp.ai_classification}</div>
                )}
              </div>
              <div className="flex gap-2">
                {['CONTACTED', 'RESPONDED', 'SALES_QUALIFIED', 'PROPOSAL'].includes(selectedOpp.stage) && (
                  <>
                    <Button variant="outline" onClick={() => setShowResponseModal(true)}>Record Response</Button>
                    <Button variant="outline" onClick={requestFollowUp}>AI Follow-up</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowConvertModal(true)}>Record Outcome</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD RESPONSE MODAL */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Record Prospect Response</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-3 text-sm h-32 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste email response or notes here..."
              value={responseInput}
              onChange={(e) => setResponseInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>Cancel</Button>
              <Button onClick={submitResponse} disabled={!responseInput}>Save Response</Button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD CONVERSION MODAL */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Record Verified Outcome</h3>
            
            <div className="flex gap-4 mb-4">
              <button 
                className={`flex-1 p-3 rounded border-2 font-bold flex items-center justify-center gap-2 ${conversionOutcome === 'WON' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}
                onClick={() => setConversionOutcome('WON')}
              >
                <CheckCircle2 className="w-5 h-5" /> WON
              </button>
              <button 
                className={`flex-1 p-3 rounded border-2 font-bold flex items-center justify-center gap-2 ${conversionOutcome === 'LOST' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}
                onClick={() => setConversionOutcome('LOST')}
              >
                <XCircle className="w-5 h-5" /> LOST
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Evidence (Required)</label>
              <textarea
                className="w-full border border-gray-300 rounded p-2 text-sm h-20 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Contract signed, or declined due to budget..."
                value={conversionEvidence}
                onChange={(e) => setConversionEvidence(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value / Revenue (Optional)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. $10,000 ARR"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConvertModal(false)}>Cancel</Button>
              <Button 
                className={conversionOutcome === 'WON' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                onClick={submitConversion} 
                disabled={!conversionEvidence}
              >
                Verify & Save
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

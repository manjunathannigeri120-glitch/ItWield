import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Archive, Database, Globe, Search, Loader2, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Memory() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ memory_type: 'RULE', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [url, setUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data[0];
      if (!ws) {
        setLoading(false);
        return;
      }
      setWorkspace(ws);
      
      const memRes = await api.get('/workspaces/' + ws.id + '/memory');
      setMemories(memRes.data.memories || []);

      const discRes = await api.get('/workspaces/' + ws.id + '/discovery');
      setDiscoveries(discRes.data.discoveries || []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setAddError(null);
    try {
      await api.post('/workspaces/' + workspace.id + '/memory', {
        title: addForm.memory_type + ' added manually',
        content: addForm.content,
        category: addForm.memory_type
      });
      setShowAdd(false);
      setAddForm({ memory_type: 'RULE', content: '' });
      loadData();
    } catch (e: any) {
      setAddError(e.response?.data?.error || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const startDiscovery = async () => {
    if (!url) return;
    setDiscovering(true);
    try {
        await api.post('/workspaces/' + workspace.id + '/discovery', { url });
        setUrl('');
        loadData();
    } catch (e) {
        console.error(e);
    } finally {
        setDiscovering(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            Company Brain 2.0
          </h1>
          <p className="text-slate-500 mt-1">Shared organizational memory and evidence-aware context.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center mb-4 text-slate-800">
            <Globe className="w-5 h-5 mr-2 text-indigo-500" /> Company Discovery Engine
        </h2>
        <div className="flex space-x-3 mb-6">
            <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} className="max-w-md" />
            <Button onClick={startDiscovery} disabled={discovering || !url}>
                {discovering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />} 
                Discover
            </Button>
        </div>
        {discoveries.length > 0 && (
            <div className="space-y-3">
                {discoveries.map(d => (
                    <div key={d.id} className="p-4 rounded border bg-slate-50 flex justify-between items-center">
                        <div>
                            <div className="font-medium text-slate-800">{d.url}</div>
                            <div className="text-sm text-slate-500 flex items-center mt-1">
                                Status: <span className="ml-1 font-semibold text-indigo-600">{d.status}</span>
                                {d.pages_crawled > 0 && <span className="ml-4">Pages: {d.pages_crawled}</span>}
                                {d.result_summary && <span className="ml-4">Found: {d.result_summary.items_found} items</span>}
                            </div>
                            {d.error_message && <div className="text-xs text-red-500 mt-1">{d.error_message}</div>}
                        </div>
                        <div className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
          <h2 className="text-xl font-semibold text-slate-800">Memory Repository</h2>
          <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Memory
          </Button>
      </div>

      {showAdd && (
        <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full border rounded-md p-2 bg-white"
                    value={addForm.memory_type}
                    onChange={e => setAddForm({...addForm, memory_type: e.target.value})}
                  >
                    <option value="STRATEGIC_CONTEXT">Strategic Context</option>
                    <option value="CUSTOMER_CONTEXT">Customer Context</option>
                    <option value="MARKET_CONTEXT">Market Context</option>
                    <option value="FINANCIAL_CONTEXT">Financial Context</option>
                    <option value="TECHNICAL_CONTEXT">Technical Context</option>
                    <option value="OPERATIONAL_CONTEXT">Operational Context</option>
                    <option value="DECISION">Decision</option>
                    <option value="LESSON">Lesson</option>
                    <option value="FAILURE">Failure</option>
                    <option value="RULE">Business Rule</option>
                    <option value="FACT">Company Fact</option>
                    <option value="PREFERENCE">Preference</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <Input 
                    placeholder="E.g. Our primary audience is enterprise B2B."
                    value={addForm.content}
                    onChange={e => setAddForm({...addForm, content: e.target.value})}
                  />
                </div>
              </div>
              {addError && <div className="text-sm text-red-600 font-medium">{addError}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>Save Memory</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map(m => (
          <div key={m.id} className={"p-5 bg-white border rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group " + (m.freshness_status === 'SUPERSEDED' ? 'border-dashed border-slate-300 opacity-60' : 'border-slate-200')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={"text-[10px] uppercase font-bold px-2 py-1 rounded " + 
                  (m.category === 'RULE' ? "bg-amber-100 text-amber-800" :
                   m.category === 'DECISION' ? "bg-purple-100 text-purple-800" :
                   m.category === 'LESSON' || m.category === 'OUTCOME' ? "bg-emerald-100 text-emerald-800" :
                   m.category === 'FAILURE' ? "bg-red-100 text-red-800" : 
                   "bg-blue-100 text-blue-800")
                }>
                  {m.category || m.memory_type}
                </span>
                
                <span className={"text-[10px] uppercase font-semibold px-2 py-1 rounded border " + 
                  (m.source_type === 'WEBSITE_DISCOVERY' ? "border-green-200 text-green-700 bg-green-50" : 
                   m.source_type === 'OWNER' ? "border-indigo-200 text-indigo-700 bg-indigo-50" :
                   "border-slate-200 text-slate-600 bg-slate-50")
                }>
                  {m.source_type}
                </span>

                {m.freshness_status && (
                    <span className={"text-[10px] uppercase font-semibold px-2 py-1 rounded flex items-center " + 
                      (m.contradicts ? "text-orange-700 bg-orange-100 border border-orange-200" :
                       m.freshness_status === 'CURRENT' ? "text-slate-500" : 
                       m.freshness_status === 'AGING' ? "text-amber-600 bg-amber-50" : 
                       m.freshness_status === 'SUPERSEDED' ? "text-slate-400 bg-slate-100" : 
                       "text-red-500 bg-red-50")
                    }>
                      {m.contradicts ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                       m.freshness_status === 'CURRENT' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       m.freshness_status === 'AGING' ? <Clock className="w-3 h-3 mr-1" /> :
                       m.freshness_status === 'SUPERSEDED' ? <Archive className="w-3 h-3 mr-1" /> :
                       m.freshness_status === 'STALE' ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                      {m.contradicts ? 'CONTRADICTED' : m.freshness_status}
                    </span>
                )}
              </div>
            </div>
            
            <p className={"text-sm " + (m.freshness_status === 'SUPERSEDED' ? 'text-slate-500 line-through' : 'text-slate-700 font-medium')}>{m.content}</p>
            
            {m.evidence && (
              <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700">Evidence ({m.evidence.evidence_type || 'SOURCE'}): </span>
                {m.evidence.excerpt || m.evidence.reason || JSON.stringify(m.evidence)}
                {m.evidence.url && <div className="text-[10px] text-slate-400 mt-1 truncate">Source: {m.evidence.url}</div>}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
               <div>Verified: {m.verification_status || 'UNVERIFIED'}</div>
               <div>{new Date(m.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
      {memories.length === 0 && <div className="text-center p-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed">Company Brain is empty. Run a discovery or add a memory.</div>}
    </div>
  );
}


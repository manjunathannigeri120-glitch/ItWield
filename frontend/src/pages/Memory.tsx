import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bot, Plus, Archive, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Memory() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ memory_type: 'RULE', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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
      
      const memRes = await api.get(`/workspaces/${ws.id}/memory?includeArchived=false`);
      setMemories(memRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: any) => {
    e.preventDefault();
    setAddError(null);
    setSubmitting(true);
    
    if (!addForm.content.trim()) {
      setAddError("Content cannot be empty");
      setSubmitting(false);
      return;
    }

    try {
      await api.post(`/workspaces/${workspace.id}/memory`, addForm);
      setAddForm({ memory_type: 'RULE', content: '' });
      setShowAdd(false);
      await loadData();
    } catch (err: any) {
      setAddError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.put(`/workspaces/${workspace.id}/memory/${id}`, { status: 'archived' });
      await loadData();
    } catch (err) {
      console.error("Failed to archive memory");
    }
  };

  if (loading) return <div className="p-8">Loading company memory...</div>;

  const ownerMemories = memories.filter(m => m.source_type === 'OWNER');
  const systemMemories = memories.filter(m => m.source_type !== 'OWNER');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Memory</h1>
          <p className="text-gray-500 mt-1">Teach ItWield how your business operates.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Memory
        </Button>
      </div>

      {showAdd && (
        <Card className="border-indigo-100 shadow-md bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Add Owner Steering</CardTitle>
            <CardDescription>Add a rule, fact, or preference that the AI CEO must follow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full md:w-64 border rounded-md p-2 text-sm bg-white"
                  value={addForm.memory_type}
                  onChange={e => setAddForm({...addForm, memory_type: e.target.value})}
                >
                  <option value="RULE">Business Rule</option>
                  <option value="FACT">Company Fact</option>
                  <option value="PREFERENCE">Preference</option>
                  <option value="DECISION">Decision</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea 
                  className="w-full border rounded-md p-3 text-sm bg-white"
                  rows={3}
                  placeholder={
                    addForm.memory_type === 'RULE' ? "e.g. Never contact prospects on weekends." :
                    addForm.memory_type === 'FACT' ? "e.g. Our target customers are Indian small businesses." :
                    addForm.memory_type === 'PREFERENCE' ? "e.g. Keep customer outreach concise and professional." :
                    "e.g. Focus customer acquisition on Bengaluru before expanding nationally."
                  }
                  value={addForm.content}
                  onChange={e => setAddForm({...addForm, content: e.target.value})}
                />
              </div>

              {addError && <div className="text-sm text-red-600 font-medium">{addError}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Memory'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {memories.length === 0 && !showAdd && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Your company memory is empty.</h3>
          <p className="text-gray-500 mt-1 max-w-md mx-auto">
            Add rules, facts, preferences, and decisions so ItWield can operate with your business context.
          </p>
          <Button onClick={() => setShowAdd(true)} className="mt-6">Add First Memory</Button>
        </div>
      )}

      {ownerMemories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Owner Steering
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownerMemories.map(mem => (
              <Card key={mem.id} className="border-l-4 border-l-indigo-600 shadow-sm relative group">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {mem.memory_type} • OWNER CONTROLLED
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 font-medium mt-2">{mem.content}</p>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-500">Active</span>
                  <button 
                    onClick={() => handleArchive(mem.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                  >
                    <Archive className="w-3 h-3" /> Archive
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {systemMemories.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-500" />
            AI Generated Memory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMemories.map(mem => (
              <Card key={mem.id} className="border-l-4 border-l-gray-300 shadow-sm relative">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {mem.memory_type} • AI GENERATED
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">{mem.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-4">{mem.content}</p>
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t flex justify-between items-center">
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    {mem.status === 'VERIFIED' ? 'Verified' : 'Active'}
                  </span>
                  <span className="text-xs text-gray-400">Source: {mem.source_type}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    c = f.read()

state_inject = """  const [missions, setMissions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [cooReview, setCooReview] = useState<any>(null);
  const [goalInput, setGoalInput] = useState('');
  const [goalSubmitting, setGoalSubmitting] = useState(false);"""
c = c.replace("  const [missions, setMissions] = useState<any[]>([]);", state_inject)

submit_logic = """
  const handleCreateGoal = async () => {
    if (!goalInput.trim()) return;
    setGoalSubmitting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/goals`, { input: goalInput });
      setGoalInput('');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to create goal');
    } finally {
      setGoalSubmitting(false);
    }
  };

  const loadData = async () => {"""
c = c.replace("  const loadData = async () => {", submit_logic)

promise_all_old = """      const [whileAwayRes, agentsRes, ceoBriefingRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/while-away`),
        api.get(`/agents/workspace/${ws.id}`),
        api.get(`/workspaces/${ws.id}/ceo-briefing`)
      ]);

      setWhileAwayData(whileAwayRes.data);
      setAgents(agentsRes.data || []);
      setCeoBriefingData(ceoBriefingRes.data);"""

promise_all_new = """      const [whileAwayRes, agentsRes, ceoBriefingRes, goalsRes, cooRes] = await Promise.all([
        api.get(`/workspaces/${ws.id}/while-away`),
        api.get(`/agents/workspace/${ws.id}`),
        api.get(`/workspaces/${ws.id}/ceo-briefing`),
        api.get(`/workspaces/${ws.id}/goals`).catch(() => ({ data: [] })),
        api.get(`/workspaces/${ws.id}/goals/what-next`).catch(() => ({ data: null }))
      ]);

      setWhileAwayData(whileAwayRes.data);
      setAgents(agentsRes.data || []);
      setCeoBriefingData(ceoBriefingRes.data);
      setGoals(goalsRes.data || []);
      setCooReview(cooRes.data);"""
c = c.replace(promise_all_old, promise_all_new)

ui_injection = """
      {/* WHAT SHOULD MY COMPANY DO NEXT? */}
      {cooReview && (
        <Card className="mb-8 border-2 border-indigo-200 shadow-md bg-indigo-50/30">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1 rounded">COO</span> What Should My Company Do Next?
            </h2>
            <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm mt-4">
              <h3 className="font-bold text-lg text-gray-900">{cooReview.whatNext?.priority}</h3>
              <p className="text-sm text-gray-600 mt-1 font-medium">{cooReview.whatNext?.why}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Impact</span>
                  {cooReview.whatNext?.impact}
                </div>
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Recommended Action</span>
                  {cooReview.whatNext?.action}
                </div>
              </div>
            </div>
            
            {cooReview.bottlenecks?.length > 0 && (
              <div className="mt-4 border-t border-indigo-100 pt-4">
                <h3 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">Active Business Bottlenecks</h3>
                <div className="space-y-2">
                  {cooReview.bottlenecks.map((b: any) => (
                    <div key={b.id} className="bg-red-50 text-red-900 p-3 rounded border border-red-100 flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm">{b.category} Bottleneck</div>
                        <div className="text-xs mt-1">{b.evidence}</div>
                        <div className="text-xs italic text-red-700 mt-1">{b.explanation}</div>
                      </div>
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase">{b.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BUSINESS GOALS */}
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Business Outcomes</h2>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border-2 border-slate-300 rounded-lg p-3 text-lg focus:border-indigo-500 outline-none" 
            placeholder="Tell ItWield what you want your business to achieve (e.g. 'Get me 20 customers')" 
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateGoal()}
          />
          <Button className="h-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-lg text-white" onClick={handleCreateGoal} disabled={goalSubmitting}>
            {goalSubmitting ? 'Planning...' : 'Command'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          {goals.map(g => (
            <Card key={g.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{g.objective}</h3>
                    <div className="text-sm text-gray-500 mt-1">Goal interpretation from: "{g.raw_input}"</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    g.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    g.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                    g.status === 'STALLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Target</div>
                    <div className="text-lg font-semibold">{g.target || 'N/A'} {g.target_metric}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Current Progress</div>
                    <div className="text-lg font-semibold">{g.current_metric || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Gap</div>
                    <div className="text-lg font-semibold">{g.target ? (g.target - (g.current_metric || 0)) : 'N/A'}</div>
                  </div>
                </div>

                {g.missing_data && g.missing_data.length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded flex flex-col gap-1">
                    <span className="text-amber-800 text-sm font-bold">DATA NOT AVAILABLE</span>
                    <span className="text-amber-700 text-xs">To measure this goal, connect: {g.missing_data.join(', ')}</span>
                  </div>
                )}

                {g.missions && g.missions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Active Execution Missions</h4>
                    <div className="space-y-2">
                      {g.missions.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-white border rounded">
                          <span className="font-medium text-gray-800">{m.objective}</span>
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{m.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
"""

c = c.replace("{showMissionWizard && (", ui_injection + "\n      {showMissionWizard && (")

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(c)

print('patched Dashboard.tsx safely')

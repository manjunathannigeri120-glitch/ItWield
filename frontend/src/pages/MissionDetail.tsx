import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MissionDetail() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [missionId]);

  const loadData = async () => {
    try {
      if (!workspace) {
        const wsRes = await api.get('/workspaces');
        const ws = wsRes.data.find((w: any) => w.status === 'operating');
        if (!ws) {
            setError("No operating workspace found.");
            setLoading(false);
            return;
        }
        setWorkspace(ws);
        await fetchMissionDetail(ws.id);
      } else {
        await fetchMissionDetail(workspace.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Mission data is temporarily unavailable.");
      setLoading(false);
    }
  };

  const fetchMissionDetail = async (wsId: string) => {
    try {
      const res = await api.get(`/workspaces/${wsId}/missions/${missionId}`);
      setData(res.data);
      setError(null);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setError("Mission not found.");
      } else {
        setError("Mission data is temporarily unavailable.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <div className="p-8">Loading mission details...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8">Unable to load this mission.</div>;

  const { mission, progress, results, tasks, activity, approvals, authority, learnings } = data;
  const observations = learnings ? learnings.filter((l: any) => l.memory_type === 'OBSERVATION') : [];
  const insights = learnings ? learnings.filter((l: any) => l.memory_type === 'INSIGHT') : [];
  const hypotheses = learnings ? learnings.filter((l: any) => l.memory_type === 'HYPOTHESIS') : [];

  const progressPercent = progress.progress.percent ?? 0;
  const isMeasurable = progress.progress.measurable;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{mission.type.replace(/_/g, ' ')}</div>
          <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
        </div>
        <div className="flex space-x-3 items-center">
          <span className={`px-3 py-1 rounded font-bold text-sm uppercase
            ${mission.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          `}>{mission.status}</span>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Why is this mission running?</h2>
          <div className="bg-indigo-50 text-indigo-900 p-4 rounded-lg border border-indigo-100 mb-6 text-sm">
            <span className="font-bold block mb-1">Business Purpose:</span>
            {mission.business_goal?.objective || 'This mission drives operational baseline requirements.'}
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Execution Objective</h2>
        <p className="text-gray-800">{mission.objective}</p>
        
        {mission.success_criteria && (
          <div className="mt-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Success Criteria</h2>
            <p className="text-gray-800">{mission.success_criteria}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress & State */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Outcome Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Verified Business Outcomes</span>
                  <span className="font-bold text-emerald-600">
                    {results.verified} {mission.target_count ? `/ ${mission.target_count}` : 'Verified Results'}
                  </span>
                </div>
                {isMeasurable ? (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic mt-2">Quantitative target not defined for this outcome. Tracking verified results incrementally.</div>
                )}
                {results.unverified > 0 && (
                  <div className="text-sm text-amber-600 mt-2 font-medium">
                    + {results.unverified} outcomes awaiting verification
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Execution Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Planned Tasks</div>
                  <div className="text-xl font-bold">{tasks.planned}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Pending Execution</div>
                  <div className="text-xl font-bold text-amber-600">{tasks.pending}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Currently Running</div>
                  <div className="text-xl font-bold text-blue-600">{tasks.running}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Completed Tasks</div>
                  <div className="text-xl font-bold text-green-600">{tasks.completed}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Current State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase">What AI Is Doing</h4>
                  <p className="text-sm font-medium mt-1">
                    {tasks.running > 0 ? "Executing active tasks..." : progress.nextAction}
                  </p>
                </div>
                {progress.blocker ? (
                  <div className="bg-red-50 text-red-800 p-3 rounded text-sm border border-red-200">
                    <span className="font-bold block mb-1">BLOCKER: {progress.blocker.type}</span>
                    {progress.blocker.description}
                  </div>
                ) : (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                    No blocker
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {data.plan && (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Mission Plan</CardTitle>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border">v{data.plan.version} {data.plan.status}</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.plan.steps.map((step: any) => (
                  <div key={step.id} className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {step.status === 'COMPLETED' ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">✓</div>
                      ) : step.status === 'RUNNING' ? (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">●</div>
                      ) : step.status === 'BLOCKED' || step.status === 'FAILED' ? (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">!</div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className={`font-semibold text-sm ${step.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          Step {step.order}: {step.title}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          step.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                          step.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          step.status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

                    {/* Mission Learning */}
          <Card>
            <CardHeader>
              <CardTitle>Mission Learning</CardTitle>
            </CardHeader>
            <CardContent>
              {(!learnings || learnings.length === 0) ? (
                <p className="text-sm text-gray-500 italic">No verified learnings yet.</p>
              ) : (
                <div className="space-y-6">
                  {observations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Verified Observations</h4>
                      <div className="space-y-3">
                        {observations.map((o: any) => (
                          <div key={o.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">{o.content}</p>
                            <p className="text-xs text-blue-600 mt-1 italic">Source: {o.evidence_summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Emerging Insights</h4>
                      <div className="space-y-3">
                        {insights.map((i: any) => (
                          <div key={i.id} className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
                            <p className="text-sm font-medium text-purple-900">{i.content}</p>
                            <p className="text-xs text-purple-600 mt-1 italic">Evidence: {i.evidence_summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hypotheses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hypotheses</h4>
                      <div className="space-y-3">
                        {hypotheses.map((h: any) => (
                          <div key={h.id} className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium text-amber-900">{h.content}</p>
                              <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded ml-2">LOW CONFIDENCE</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Tab-like view */}
          <Card>
            <CardHeader>
              <CardTitle>Verified Results ({results.verified})</CardTitle>
            </CardHeader>
            <CardContent>
              {results.recent.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No verified results yet.</p>
              ) : (
                <div className="space-y-4">
                  {results.recent.filter((r:any) => r.verification_status === 'VERIFIED').map((r: any) => (
                    <div key={r.id} className="border p-4 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase">{r.result_type}</span>
                        <span className="text-xs text-gray-400">{new Date(r.verified_at || r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-medium mb-2">{r.summary || 'Verified result'}</div>
                      {r.evidence && Object.keys(r.evidence).length > 0 ? (
                        <div className="bg-white p-3 border rounded text-xs overflow-auto">
                          {r.evidence.Company && <div><strong>Company:</strong> {r.evidence.Company}</div>}
                          {r.evidence.Website && <div><strong>Website:</strong> <a href={r.evidence.Website} target="_blank" rel="noreferrer" className="text-blue-500 underline">{r.evidence.Website}</a></div>}
                          {r.evidence['Reason for match'] && <div><strong>Reason:</strong> {r.evidence['Reason for match']}</div>}
                          {r.evidence['Public source'] && <div><strong>Source:</strong> {r.evidence['Public source']}</div>}
                          {!r.evidence.Company && <pre className="text-gray-700 whitespace-pre-wrap">{JSON.stringify(r.evidence, null, 2)}</pre>}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">Evidence unavailable</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-bold text-green-700 mb-2 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Allowed</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {authority.allowed.map((a: string) => <li key={a}>{a}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-amber-700 mb-2 flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>Requires Approval</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {authority.requires_approval.map((a: string) => <li key={a}>{a}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-2 flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Prohibited</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {authority.prohibited.map((a: string) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activity.slice(0, 10).map((a: any) => (
                    <div key={a.id} className="text-sm">
                      <div className="text-gray-800 font-medium">{a.event_type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No approvals required</p>
              ) : (
                <div className="space-y-4">
                  {approvals.map((a: any) => (
                    <div key={a.id} className="text-sm border-b pb-2 last:border-0">
                      <div className="font-medium text-amber-700">{a.action_type || 'Approval needed'}</div>
                      <div className="text-gray-600 text-xs mt-1">{a.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



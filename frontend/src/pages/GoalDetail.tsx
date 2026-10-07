import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LiveTerminal } from '../components/LiveTerminal';

export function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = async () => {
    if (!goalId) return;
    setLoading(true);
    try {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating');
      if (!ws) throw new Error('No operating workspace found');
      

      const res = await api.get(`/workspaces/${ws.id}/goals`);
      const matchedGoal = res.data.find((g: any) => g.id === goalId);
      if (!matchedGoal) throw new Error('Goal not found');
      setGoal(matchedGoal);
    } catch (err: any) {
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading goal details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!goal) return null;

      const isCustomerGoal = goal.target_metric?.toLowerCase().includes('customer') || goal.objective.toLowerCase().includes('customer');
    
    // Phase 4 - DATA NOT AVAILABLE SEMANTICS
    // The measurement source is available UNLESS the specific authoritative source failed.
    let isAvailable = true;
    if (isCustomerGoal) {
      isAvailable = !goal.missing_data?.includes('Customer conversion data could not be queried.');
    } else {
      isAvailable = (!goal.missing_data || goal.missing_data.length === 0);
    }
  
  let progressText = '';
  if (!isAvailable) {
    progressText = 'Measurement data unavailable';
  } else {
    progressText = `${goal.current_metric || 0} / ${goal.target || 0} ${goal.target_metric || 'verified'}`;
  }

  const gap = goal.target ? Math.max(0, goal.target - (goal.current_metric || 0)) : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="text-gray-500 hover:text-indigo-600 transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{goal.objective}</h1>
          <p className="text-gray-500 mt-1">Goal interpretation from: "{goal.raw_input}"</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchGoal}>
            Verify Now
          </Button>
          <Button variant="destructive" onClick={async () => {
            if (!confirm('Are you sure you want to delete this goal?')) return;
            try {
              const wsId = localStorage.getItem('itwield_workspace_id');
              await api.delete(`/workspaces/${wsId}/goals/${goalId}`);
              window.location.href = '/dashboard';
            } catch(e: any) {
              alert('Failed to delete goal: ' + (e?.response?.data?.error || e?.message));
            }
          }}>
            Delete Goal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider">Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goal.target || 0} {goal.target_metric}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-indigo-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${!isAvailable ? 'text-amber-600 text-lg' : 'text-gray-900'}`}>
              {progressText}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider">Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gap}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Measurement Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700">Source</div>
            <div className="flex items-center mt-1">
              {isCustomerGoal ? (
                <>
                  <span className="font-medium text-gray-900">Internal CRM &rarr; Opportunities</span>
                  <span className={`ml-3 px-2 py-1 text-xs font-bold rounded ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isAvailable ? '? Available' : 'Unavailable'}
                  </span>
                </>
              ) : (
                <span className="text-gray-600">Dynamic (based on objective)</span>
              )}
            </div>
            {!isAvailable && (
              <p className="text-sm text-amber-700 mt-2 bg-amber-50 border border-amber-200 p-2 rounded">
                DATA NOT AVAILABLE. Missing: {goal.missing_data?.join(', ')}
              </p>
            )}
          </div>
          
          <div>
            <div className="text-sm font-semibold text-gray-700">Verification Definition</div>
            <div className="text-gray-600 mt-1">{isCustomerGoal ? 'stage = CONVERTED' : goal.success_definition}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700">Evidence</div>
            <div className="text-gray-600 mt-1">{isCustomerGoal ? `${goal.current_metric || 0} converted opportunities` : 'Pending'}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700">Status</div>
            <div className="mt-1">
              <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded uppercase tracking-wider">
                {goal.status}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700">Current Blocker</div>
            <div className="text-gray-600 mt-1">
              {!isAvailable 
                ? 'Cannot connect to required data source.'
                : goal.current_metric === 0 
                  ? 'No verified customers yet.' 
                  : goal.status === 'COMPLETED'
                    ? 'None (Achieved)'
                    : 'Insufficient verified progress to meet target.'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {goal.missions && goal.missions.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Contributing Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.missions.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">{m.objective}</div>
                    <div className="text-sm text-gray-500 mt-1">{m.type}</div>
                  </div>
                  <div>
                    <span className="px-2 py-1 text-xs font-bold bg-white border rounded text-slate-600">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}







import re

with open('frontend/src/pages/GoalDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''  const { goalId } = useParams<{ goalId: string }>();
  const { workspace } = useAuth();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = async () => {
    if (!workspace || !goalId) return;
    setLoading(true);
    try {
      // The API returns all goals, we filter on the frontend to avoid creating a new API endpoint.
      // This endpoint automatically triggers verifyGoalProgress under the hood.
      const res = await api.get(/workspaces/${workspace.id}/goals);
      const matchedGoal = res.data.find((g: any) => g.id === goalId);
      if (!matchedGoal) {
        throw new Error('Goal not found');
      }
      setGoal(matchedGoal);
    } catch (err: any) {
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [workspace, goalId]);'''

new_block = '''  const { goalId } = useParams<{ goalId: string }>();
  const [workspace, setWorkspace] = useState<any>(null);
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
      setWorkspace(ws);

      // The API returns all goals, we filter on the frontend to avoid creating a new API endpoint.
      // This endpoint automatically triggers verifyGoalProgress under the hood.
      const res = await api.get(/workspaces/${ws.id}/goals);
      const matchedGoal = res.data.find((g: any) => g.id === goalId);
      if (!matchedGoal) {
        throw new Error('Goal not found');
      }
      setGoal(matchedGoal);
    } catch (err: any) {
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [goalId]);'''

# Need to fix up string interpolation issues in my python string
old_block = old_block.replace('${workspace.id}', '')
new_block = new_block.replace('${ws.id}', '')

content = content.replace(old_block, new_block)

with open('frontend/src/pages/GoalDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

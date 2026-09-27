import re

path = 'frontend/src/pages/Settings.tsx'
with open(path, 'r') as f:
    c = f.read()

new_plan_settings = """
function PlanSettings({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/plan`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  const cancelMutation = useMutation({
    mutationFn: async () => await api.post(`/workspaces/${workspaceId}/subscription/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan', workspaceId] })
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => await api.post(`/workspaces/${workspaceId}/subscription/reactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan', workspaceId] })
  });

  if (!workspaceId) return null;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading plan data...</div>;

  const { subscription, usage, entitlements } = planData || {};

  return (
    <Card className="mt-8 border-2 border-slate-900 shadow-md">
      <CardHeader>
        <CardTitle>Plan & Billing</CardTitle>
        <CardDescription>Manage your subscription and limits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-lg">{subscription?.plan_id?.replace('_', ' ') || 'SOLO BUILDER'} Plan</h3>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
              subscription?.status === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
              subscription?.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {subscription?.status || 'ACTIVE'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {subscription?.cancel_at_period_end 
              ? `Cancels at the end of billing period (${new Date(subscription?.current_period_end).toLocaleDateString()})` 
              : `Renews on ${new Date(subscription?.current_period_end).toLocaleDateString()}`}
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm">AI Workers Usage</span>
            <span className="text-sm font-semibold">{usage?.metrics?.workers?.current || 0} / {usage?.metrics?.workers?.limit === -1 ? 'Unlimited' : usage?.metrics?.workers?.limit}</span>
          </div>
          {usage?.metrics?.workers?.limit !== -1 && (
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((usage?.metrics?.workers?.current || 0) / (usage?.metrics?.workers?.limit || 25)) * 100)}%` }}></div>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 mb-2">
            <span className="font-medium text-sm">Mission Usage</span>
            <span className="text-sm font-semibold">{usage?.metrics?.missions?.current || 0} / {usage?.metrics?.missions?.limit === -1 ? 'Unlimited' : usage?.metrics?.missions?.limit}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => alert('Billing portal integration pending in next milestone.')}>
            Upgrade Plan
          </Button>
          {subscription?.cancel_at_period_end ? (
            <Button variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50" onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
              {reactivateMutation.isPending ? 'Processing...' : 'Reactivate Subscription'}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => { if (confirm('Cancel subscription? You will retain access until the end of the billing period.')) cancelMutation.mutate() }} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
"""

# Replace the existing PlanSettings completely.
c = re.sub(r'function PlanSettings.*?export function Settings', new_plan_settings + '\nexport function Settings', c, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(c)

print('updated PlanSettings UI')

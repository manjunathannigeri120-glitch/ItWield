import re

path = 'frontend/src/pages/Settings.tsx'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "export function Settings() {",
    """
function PlanSettings({ workspaceId }: { workspaceId: string }) {
  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/plan`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  if (!workspaceId) return null;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading plan data...</div>;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Plan & Billing</CardTitle>
        <CardDescription>Manage your subscription and limits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{planData?.plan || 'SOLO_BUILDER'} Plan</h3>
          <p className="text-sm text-slate-500">Your current active subscription.</p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">AI Workers Usage</span>
            <span className="text-sm font-semibold">{planData?.usage?.workers || 0} / {planData?.entitlements?.max_workers || 25}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, ((planData?.usage?.workers || 0) / (planData?.entitlements?.max_workers || 25)) * 100)}%` }}></div>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => alert('Billing portal integration pending in next milestone.')}>
          Manage Billing (Upgrade)
        </Button>
      </CardContent>
    </Card>
  );
}

export function Settings() {"""
)

# Insert the component at the end of the return statement before the final </div>
c = c.replace(
    "      </div>\n    </div>\n  );\n}\n",
    "        <PlanSettings workspaceId={workspaces?.find(w => w.status === 'operating' || w.status === 'ACTIVE' || w.status === 'operating' || true)?.id || ''} />\n      </div>\n    </div>\n  );\n}\n"
)

# Ensure the replace logic above didn't miss
c = re.sub(
    r'(<Card>[\s\S]*?</Card>\s*</div>\s*)$',
    r'\1\n        {workspaces && workspaces.length > 0 && <PlanSettings workspaceId={workspaces[0].id} />}\n      </div>',
    c
)

with open(path, 'w') as f:
    f.write(c)

print('patched Settings.tsx')

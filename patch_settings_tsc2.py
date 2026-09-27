import re
with open('frontend/src/pages/Settings.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    "</Card>\n      </div>\n\nfunction ConnectionsManager()",
    "</Card>\n        {workspaces && workspaces.length > 0 && <PlanSettings workspaceId={workspaces.find((w: any) => w.status === 'operating' || true)?.id || ''} />}\n      </div>\n\nfunction ConnectionsManager()"
)

with open('frontend/src/pages/Settings.tsx', 'w') as f:
    f.write(c)
print('inserted')

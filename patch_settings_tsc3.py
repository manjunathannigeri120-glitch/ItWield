import re
with open('frontend/src/pages/Settings.tsx', 'r') as f:
    c = f.read()

# Let's just find the last </Card> before function ConnectionsManager
idx = c.find('function ConnectionsManager()')
if idx != -1:
    before = c[:idx]
    after = c[idx:]
    last_card = before.rfind('</Card>')
    if last_card != -1:
        c = before[:last_card+7] + "\n        {workspaces && workspaces.length > 0 && <PlanSettings workspaceId={workspaces[0].id} />}\n" + before[last_card+7:] + after
        with open('frontend/src/pages/Settings.tsx', 'w') as f:
            f.write(c)
        print('success')

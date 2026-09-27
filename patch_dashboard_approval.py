import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    "<p className=\"text-sm text-gray-500 italic\">No active incidents or approvals required.</p>",
    "<p className=\"text-sm text-gray-500 italic\">No actions currently require your approval.</p>"
)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(c)

import re

with open('backend/src/tests/ceoGoalAction.test.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "resolve({ data: [{ id: 'a1', name: 'Competitor Analyst', capabilities: ['COMPETITIVE_ANALYSIS'] }] });",
    "resolve({ data: { id: 'a1', name: 'Competitor Analyst', capabilities: ['COMPETITIVE_ANALYSIS'] } });"
)

with open('backend/src/tests/ceoGoalAction.test.ts', 'w') as f:
    f.write(c)


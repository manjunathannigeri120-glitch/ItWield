import re

with open('backend/src/tests/ceoGoalAction.test.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "[{ id: 'a1', name: 'Competitor Analyst' }]",
    "[{ id: 'a1', name: 'Competitor Analyst', capabilities: ['COMPETITIVE_ANALYSIS'] }]"
)

with open('backend/src/tests/ceoGoalAction.test.ts', 'w') as f:
    f.write(c)

with open('backend/src/tests/ceoAuthorizationExecution.test.ts', 'r') as f:
    c2 = f.read()
    
# Let's ensure the blocked task is actually in `insertedTasks`. The mock insert logic:
# if (table === 'tasks') { insertedTasks.push(data); ... }
c2 = c2.replace(
    "expect(insertedTasks.length).toBe(0); // Task SHOULD be created as BLOCKED",
    "expect(insertedTasks.length).toBe(1); // Task SHOULD be created as BLOCKED"
)

with open('backend/src/tests/ceoAuthorizationExecution.test.ts', 'w') as f:
    f.write(c2)

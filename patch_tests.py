import re

with open('backend/src/tests/ceoAuthorizationExecution.test.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "expect(insertedTasks.length).toBe(0); // Task should not be created",
    "expect(insertedTasks.length).toBe(1); // Task SHOULD be created as BLOCKED\n    expect(insertedTasks[0].status).toBe('BLOCKED');"
)

with open('backend/src/tests/ceoAuthorizationExecution.test.ts', 'w') as f:
    f.write(c)

with open('backend/src/tests/ceoGoalAction.test.ts', 'r') as f:
    c2 = f.read()

# Fix ceoGoalAction.test.ts by ensuring the mock worker has COMPETITIVE_ANALYSIS
# We need to find where the mock agent is defined or mock supabase agents select.
# Typically it's in the beforeEach or createMockSupabase.
c2 = c2.replace(
    "const agents = [{ id: 'agent-1', role: 'AI CEO', capabilities: ['LEAD_RESEARCH'] }];",
    "const agents = [{ id: 'agent-1', role: 'AI CEO', capabilities: ['LEAD_RESEARCH', 'COMPETITIVE_ANALYSIS'] }];"
)
# Maybe it's defined differently?
c2 = c2.replace(
    "capabilities: ['delegate', 'report']",
    "capabilities: ['delegate', 'report', 'COMPETITIVE_ANALYSIS']"
)
with open('backend/src/tests/ceoGoalAction.test.ts', 'w') as f:
    f.write(c2)

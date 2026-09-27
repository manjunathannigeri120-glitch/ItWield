import re

# Fix ceoRouting
path = 'backend/src/tests/ceoRouting.test.ts'
with open(path, 'r') as f:
    c = f.read()

c = re.sub(
    r'const base: any = \{[\s\S]*?update: vi\.fn',
    '''const base: any = {
          select: vi.fn(() => base),
          eq: vi.fn(() => base),
          neq: vi.fn(() => base),
          in: vi.fn(() => base),
          single: vi.fn().mockResolvedValue({ data: { id: 'cmo', capabilities: ['LEAD_RESEARCH'] } }),
          order: vi.fn(() => base),
          limit: vi.fn(() => base),
          update: vi.fn''',
    c
)
with open(path, 'w') as f:
    f.write(c)

# Fix ceoGoalAction
path = 'backend/src/tests/ceoGoalAction.test.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1' }",
    "{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1', capabilities: ['COMPETITIVE_ANALYSIS'] }"
)
# Make sure we didn't miss something else in single mock
c = c.replace(
    "single: vi.fn(() => Promise.resolve({ data: table === 'workspaces' ? { id: 'ws-1', company_goals: 'Crush the competition' } : null })),",
    "single: vi.fn(() => Promise.resolve({ data: table === 'workspaces' ? { id: 'ws-1', company_goals: 'Crush the competition' } : (table === 'agents' ? { id: 'cmo-1', capabilities: ['COMPETITIVE_ANALYSIS'] } : null) })),"
)
with open(path, 'w') as f:
    f.write(c)

# Fix commandCenter error 500. We can just print the error to see why it fails.
print('patched')

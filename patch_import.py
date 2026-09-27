import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "const { ActionRegistry } = await import('../workflows/ActionRegistry');",
    "const { ActionRegistry } = await import('../workflows/actions/ActionRegistry');"
)

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)

with open('backend/src/tests/missionOrchestratorStall.test.ts', 'r') as f:
    c2 = f.read()
    c2 = c2.replace(
        "vi.spyOn(WorkforceIntegrityService, 'validateAssignment').mockResolvedValue({ valid: true });",
        "vi.spyOn(WorkforceIntegrityService, 'validateAssignment').mockResolvedValue({ valid: true, status: 'VALID', reason: 'ok' } as any);"
    )

with open('backend/src/tests/missionOrchestratorStall.test.ts', 'w') as f:
    f.write(c2)

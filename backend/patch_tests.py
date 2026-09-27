import re

with open('backend/src/tests/businessActions.test.ts', 'r') as f:
    c = f.read()

c = c.replace("status: 'FAILED',\n      error: expect.stringContaining('CONNECTION_REQUIRED: web_search')",
              "status: 'BLOCKED',\n      error: expect.stringContaining('CONNECTION_REQUIRED: web_search')")
c = c.replace("status: 'FAILED',\n      error: expect.stringContaining('CONNECTION_REQUIRED: github')",
              "status: 'BLOCKED',\n      error: expect.stringContaining('CONNECTION_REQUIRED: github')")

with open('backend/src/tests/businessActions.test.ts', 'w') as f:
    f.write(c)

print("Patched businessActions.test.ts")

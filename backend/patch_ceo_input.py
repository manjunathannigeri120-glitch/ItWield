import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

# We need to inject default inputs for DATA_TRANSFORMATION if taskType === 'DATA_TRANSFORMATION'
pattern = r"input:\s*\{\s*task_type:\s*taskType,\s*delegate_to:\s*assignee\.id\s*\}"
replacement = """input: {
                  task_type: taskType,
                  delegate_to: assignee.id,
                  ...(taskType === 'DATA_TRANSFORMATION' ? { input: "dummy data", operations: [{ type: 'uppercase' }] } : {})
                }"""

if re.search(pattern, c):
    c = re.sub(pattern, replacement, c)
    print("Patched CEOService to provide valid input to DATA_TRANSFORMATION")
else:
    print("Pattern not found!")

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)

import re

with open('backend/src/services/BusinessGoalInterpreter.ts', 'r') as f:
    c = f.read()
c = c.replace("response.content", "response.choices[0].message.content!")
with open('backend/src/services/BusinessGoalInterpreter.ts', 'w') as f:
    f.write(c)

with open('backend/src/services/OutcomePlannerService.ts', 'r') as f:
    c = f.read()
c = c.replace("response.content", "response.choices[0].message.content!")
with open('backend/src/services/OutcomePlannerService.ts', 'w') as f:
    f.write(c)

# Fix commandCenter
with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()
if "let cooReview;" not in c:
    c = c.replace("const { data: goals }", "let cooReview;\n      const { data: goals }")
with open('backend/src/api/commandCenter.ts', 'w') as f:
    f.write(c)

print('patched')

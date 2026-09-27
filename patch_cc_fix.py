import re
with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()

c = c.replace("      goals: goals || [],\n      cooReview,\n      goals,", "      goals: goals || [],\n      cooReview,")

with open('backend/src/api/commandCenter.ts', 'w') as f:
    f.write(c)

print('fixed commandCenter.ts')

import re

with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()

# Fix the import
if 'import { COOService }' not in c:
    c = "import { COOService } from '../services/COOService';\n" + c

# Fix the goals redeclaration
c = c.replace("const { data: goals } = await supabase.from('business_goals')", "const { data: businessGoals } = await supabase.from('business_goals')")
c = c.replace("goals: goals || [],\n      cooReview,", "goals: businessGoals || [],\n      cooReview,")

with open('backend/src/api/commandCenter.ts', 'w') as f:
    f.write(c)

print('fixed commandCenter variables')

import re

with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()

c = c.replace("const goals = [];", "let goals: any[] = [];")
c = c.replace("const { data: goals } = await supabase.from('business_goals')", "const { data: bgData } = await supabase.from('business_goals')")
c = c.replace("goals = bgData || [];", "goals = bgData || goals;") # if we want to combine or overwrite
# wait, better to just use businessGoals.

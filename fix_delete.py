import re

with open('backend/src/api/goals.ts', 'r', encoding='utf-8') as f:
    data = f.read()

pattern = r'''    const \{ error \} = await req\.supabase
      \.from\('business_goals'\)
      \.delete\(\)
      \.eq\('id', goalId\)
      \.eq\('workspace_id', workspaceId\);'''

replacement = '''    // Cascade delete related entities first
    await req.supabase.from('tasks').delete().eq('goal_id', goalId);
    await req.supabase.from('workflow_runs').delete().eq('goal_id', goalId);
    
    const { error } = await req.supabase
      .from('business_goals')
      .delete()
      .eq('id', goalId)
      .eq('workspace_id', workspaceId);'''

new_data = re.sub(pattern, replacement, data)
with open('backend/src/api/goals.ts', 'w', encoding='utf-8') as f:
    f.write(new_data)

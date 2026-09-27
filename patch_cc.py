import re

with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()

# Check if COOService is imported
if 'COOService' not in c:
    c = c.replace("import { CompanyStateService } from '../services/CompanyStateService';", "import { CompanyStateService } from '../services/CompanyStateService';\nimport { COOService } from '../services/COOService';")

# Add goals and COO to promise all
promise_all = """      ] = await Promise.all([
        supabase.from('agents').select('*').eq('workspace_id', workspaceId),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('approvals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('mission_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('opportunities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100),
        supabase.from('management_items').select('*').eq('workspace_id', workspaceId).order('priority', { ascending: true }),
        supabase.from('ceo_decisions').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20)
      ]);"""

replacement_all = """      ] = await Promise.all([
        supabase.from('agents').select('*').eq('workspace_id', workspaceId),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('approvals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('mission_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
        supabase.from('opportunities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100),
        supabase.from('management_items').select('*').eq('workspace_id', workspaceId).order('priority', { ascending: true }),
        supabase.from('ceo_decisions').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20)
      ]);
      const { data: goals } = await supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      let cooReview;
      try {
        cooReview = await COOService.executeOperationalReview(supabase, workspaceId);
      } catch(e) {
        cooReview = { whatNext: { priority: 'Unknown', action: 'None' }, cooSummary: 'COO Review failed' };
      }"""

if "await COOService.executeOperationalReview" not in c:
    c = c.replace(promise_all, replacement_all)

# Inject into response payload
payload = "companyStatus,"
new_payload = "companyStatus,\n      goals: goals || [],\n      cooReview,"
if "goals: goals || []" not in c:
    c = c.replace(payload, new_payload)

with open('backend/src/api/commandCenter.ts', 'w') as f:
    f.write(c)

print("patched commandCenter")

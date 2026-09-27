import re

with open('backend/src/api/commandCenter.ts', 'r') as f:
    c = f.read()

# 1. Imports
if 'COOService' not in c:
    c = c.replace("import { CompanyStateService } from '../services/CompanyStateService';", "import { CompanyStateService } from '../services/CompanyStateService';\nimport { COOService } from '../services/COOService';")

# 2. Add queries before payload
injection = """
    const { data: goals } = await supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    let cooReview;
    try {
      cooReview = await COOService.executeOperationalReview(supabase, workspaceId);
    } catch (e) {
      cooReview = { whatNext: { priority: 'Unknown', action: 'None' }, cooSummary: 'COO Review failed' };
    }

    const payload = {"""
    
if "let cooReview;" not in c:
    c = c.replace("    const payload = {", injection)

# 3. Add to payload
if "goals: goals || []," not in c:
    c = c.replace("companyStatus,", "companyStatus,\n      goals: goals || [],\n      cooReview,")

with open('backend/src/api/commandCenter.ts', 'w') as f:
    f.write(c)

print('done')

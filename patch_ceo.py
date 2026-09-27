import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

import_stmt = "import { ContinuousReplanningService } from './ContinuousReplanningService';"
if 'ContinuousReplanningService' not in c:
    c = c.replace("import { CompanyStateService } from './CompanyStateService';", "import { CompanyStateService } from './CompanyStateService';\n" + import_stmt)

# Insert call right after stale task recovery or at the end of try block
insert_logic = """
      try {
        await ContinuousReplanningService.evaluateReplanning(supabase, workspaceId);
      } catch (e) {
        console.error('[CEOService] Replanning error:', e);
      }
"""
if "ContinuousReplanningService.evaluateReplanning" not in c:
    c = c.replace("await ManagementIntelligenceService.syncIncidents(supabase, workspaceId);", "await ManagementIntelligenceService.syncIncidents(supabase, workspaceId);\n" + insert_logic)

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)

print('patched CEOService')

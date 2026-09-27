const fs = require('fs');

// Fix agents.ts
let path = 'backend/src/api/agents.ts';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/checkWorkerLimit\(req\.supabase, workspaceId\)/g, "checkWorkerLimit(req.supabase, workspaceId as string)");
fs.writeFileSync(path, c);

// Fix workspaces.ts
path = 'backend/src/api/workspaces.ts';
c = fs.readFileSync(path, 'utf8');
c = c.replace(/checkWorkerLimit\(req\.supabase, workspaceId\)/g, "checkWorkerLimit(req.supabase, workspaceId as string)");
c = c.replace(/getWorkspaceEntitlements\(req\.supabase, workspaceId\)/g, "getWorkspaceEntitlements(req.supabase, workspaceId as string)");
c = c.replace(/eq\('workspace_id', workspaceId\)/g, "eq('workspace_id', workspaceId as string)");
fs.writeFileSync(path, c);

// Fix ceoRouting.test.ts
path = 'backend/src/tests/ceoRouting.test.ts';
c = fs.readFileSync(path, 'utf8');
c = c.replace(/single: vi\.fn\(\)\.mockResolvedValue\(\{ data: \{ id: 'cmo', capabilities: \['LEAD_RESEARCH'\] \} \}\),\s*single: vi\.fn/g, "single: vi.fn");
fs.writeFileSync(path, c);

console.log('patched ts errors');

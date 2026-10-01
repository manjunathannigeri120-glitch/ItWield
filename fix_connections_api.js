const fs = require('fs');
let file = 'backend/src/api/connections.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix router.post('/')
let fixPost = `router.post('/', async (req: AuthRequest, res) => {
    // Manual fallback for dev / webhook usage
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return res.status(400).json({ error: 'Missing x-workspace-id header' });
    if (!req.supabase) return res.json({ success: true, mock: true });

    const { provider, name, credentials, metadata, capabilities } = req.body;
    
    if (!provider || typeof provider !== 'string') {
        return res.status(400).json({ error: 'Missing required field: provider' });
    }
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (!credentials || typeof credentials !== 'object') {
        return res.status(400).json({ error: 'Missing required field: credentials' });
    }

    const encryptedCredentials = encryptObject(credentials);

    const { data, error } = await req.supabase
        .from('company_systems')
        .insert({
            workspace_id: workspaceId,
            system_type: provider,
            display_name: name,
            connection_id: encryptedCredentials,
            metadata: metadata || {},
            capabilities: capabilities || []
        })
        .select('id, workspace_id, system_type, display_name, status, metadata, capabilities, created_at, updated_at')
        .single();`;

content = content.replace(/router\.post\('\/', async \(req: AuthRequest, res\) => \{[\s\S]*?\.single\(\);/, fixPost);

fs.writeFileSync(file, content);

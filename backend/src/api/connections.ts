import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { encryptObject } from '../utils/encryption';
import crypto from 'crypto';
import { getServiceSupabase } from '../db/supabaseClient';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return res.status(400).json({ error: 'Missing x-workspace-id header' });
    if (!req.supabase) return res.json([]);

    const { data, error } = await req.supabase
        .from('connections')
        .select('id, workspace_id, provider, name, status, metadata, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Connections GET] DB error:', error.message);
        return res.status(500).json({ error: 'Failed to load connections' });
    }
    res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
    // Manual fallback for dev / webhook usage
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return res.status(400).json({ error: 'Missing x-workspace-id header' });
    if (!req.supabase) return res.json({ success: true, mock: true });

    const { provider, name, credentials, metadata } = req.body;
    
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
        .from('connections')
        .insert({
            workspace_id: workspaceId,
            provider,
            name,
            credentials: encryptedCredentials,
            metadata: metadata || {}
        })
        .select('id, workspace_id, provider, name, status, metadata, created_at, updated_at')
        .single();

    if (error) {
        console.error('[Connections POST] DB error:', error.message);
        return res.status(500).json({ error: 'Failed to create connection' });
    }
    res.json(data);
});


router.delete('/:id', async (req: AuthRequest, res) => {
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return res.status(400).json({ error: 'Missing x-workspace-id header' });
    if (!req.supabase) return res.json({ success: true });

    const { id } = req.params;

    const { error } = await req.supabase
        .from('connections')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);

    if (error) {
        console.error('[Connections DELETE] DB error:', error.message);
        return res.status(500).json({ error: 'Failed to delete connection' });
    }
    res.json({ success: true });
});

// OAuth Generate Link
router.get('/:provider/connect', async (req: AuthRequest, res) => {
    const { provider } = req.params;
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) return res.status(400).json({ error: 'Missing x-workspace-id header' });
    
    const serviceClient = getServiceSupabase();
    if (!serviceClient) {
        return res.json({ url: `http://localhost:5173/settings/connections/callback?state=mock&code=mock` });
    }

    const stateToken = crypto.randomBytes(32).toString('hex');

    // Save state in DB
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    const { error } = await serviceClient.from('oauth_states').insert({
        state_token: stateToken,
        user_id: req.user!.id,
        workspace_id: workspaceId,
        provider,
        expires_at: expiresAt
    });

    if (error) return res.status(500).json({ error: 'Failed to create OAuth state' });

    const redirectUri = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/settings/connections/callback` : 'http://localhost:5173/settings/connections/callback';

    let url = '';
    if (provider === 'google_sheets') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&access_type=offline&prompt=consent&state=${stateToken}`;
    } else if (provider === 'slack') {
        const clientId = process.env.SLACK_CLIENT_ID;
        // user_scope vs scope depending on slack bot vs user install. usually chat:write for bot
        url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=chat:write&state=${stateToken}`;
    } else if (provider === 'discord') {
        const clientId = process.env.DISCORD_CLIENT_ID;
        url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=webhook.incoming&state=${stateToken}`;
    } else {
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({ url });
});

// OAuth Callback Exchange
router.post('/:provider/callback', async (req: AuthRequest, res) => {
    const { provider } = req.params;
    const { state, code } = req.body;
    
    if (!state || !code) return res.status(400).json({ error: 'Missing state or code' });

    const serviceClient = getServiceSupabase();
    if (!serviceClient) {
        return res.json({ success: true, mock: true });
    }

    // Verify State
    const { data: stateData, error: stateError } = await serviceClient
        .from('oauth_states')
        .select('*')
        .eq('state_token', state)
        .single();
        
    if (stateError || !stateData) return res.status(400).json({ error: 'Invalid or expired state' });

    // Validate ownership
    if (stateData.user_id !== req.user!.id) return res.status(403).json({ error: 'State user mismatch' });
    if (stateData.provider !== provider) return res.status(400).json({ error: 'State provider mismatch' });
    if (new Date(stateData.expires_at) < new Date()) return res.status(400).json({ error: 'State expired' });

    // Clean up state (prevent replay)
    await serviceClient.from('oauth_states').delete().eq('id', stateData.id);

    const redirectUri = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/settings/connections/callback` : 'http://localhost:5173/settings/connections/callback';
    
    let credentials: any = {};
    let connectionName = `${provider} Connection`;

    try {
        if (provider === 'google_sheets') {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                    code,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                }).toString()
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Failed to exchange Google code');
            credentials = {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: tokenData.expires_in,
                expiry_date: Date.now() + (tokenData.expires_in * 1000)
            };
            connectionName = 'Google Account';
        } else if (provider === 'slack') {
            const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.SLACK_CLIENT_ID || '',
                    client_secret: process.env.SLACK_CLIENT_SECRET || '',
                    code,
                    redirect_uri: redirectUri
                }).toString()
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.ok) throw new Error(tokenData.error || 'Failed to exchange Slack code');
            credentials = { token: tokenData.access_token };
            connectionName = tokenData.team?.name ? `Slack: ${tokenData.team.name}` : 'Slack Workspace';
        } else if (provider === 'discord') {
            const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID || '',
                    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
                    code,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                }).toString()
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Failed to exchange Discord code');
            
            // Discord webhook flow
            if (tokenData.webhook) {
                credentials = { webhook_url: tokenData.webhook.url, channel_id: tokenData.webhook.channel_id };
                connectionName = tokenData.webhook.name || 'Discord Webhook';
            } else {
                credentials = { token: tokenData.access_token }; // or bot token depending on install
                connectionName = 'Discord Connection';
            }
        }
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }

    // Save connection securely
    const encryptedCredentials = encryptObject(credentials);

    const { data: conn, error: connError } = await req.supabase!
        .from('connections')
        .insert({
            workspace_id: stateData.workspace_id,
            provider,
            name: connectionName,
            credentials: encryptedCredentials,
            metadata: {}
        })
        .select('id, workspace_id, provider, name, status, metadata, created_at, updated_at')
        .single();

    if (connError) return res.status(500).json({ error: connError.message });
    res.json(conn);
});

export default router;

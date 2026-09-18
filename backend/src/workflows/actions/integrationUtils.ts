import { ActionContext } from './Action';
import { decryptObject } from '../../utils/encryption';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';


export async function getSecureConnection(context: ActionContext, connectionId: string, expectedProvider: string) {
    if (!context.supabase) {
        throw new Error('Supabase client required for connection lookup');
    }

    const { data, error } = await context.supabase
        .from('connections')
        .select('provider, credentials, status')
        .eq('id', connectionId)
        .eq('workspace_id', context.workspaceId)
        .single();

    if (error || !data) {
        throw new Error(`CONNECTION_NOT_FOUND: Unable to resolve connection ${connectionId}`);
    }

    if (data.status !== 'connected') {
        throw new Error('CONNECTION_UNAUTHORIZED: Connection is not active');
    }

    if (data.provider !== expectedProvider) {
        throw new Error(`INVALID_INTEGRATION_INPUT: Expected connection for ${expectedProvider}, but got ${data.provider}`);
    }

    try {
        let credentials = decryptObject(data.credentials);
        
        // Handle Google Token Refresh
        if (expectedProvider === 'google_sheets' && credentials.refresh_token && credentials.expiry_date) {
            if (Date.now() >= credentials.expiry_date) {
                // Token is expired, refresh it
                const refreshRes = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env.GOOGLE_CLIENT_ID || '',
                        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                        refresh_token: credentials.refresh_token,
                        grant_type: 'refresh_token'
                    }).toString()
                });
                const refreshData = await refreshRes.json();
                
                if (refreshRes.ok && refreshData.access_token) {
                    credentials.access_token = refreshData.access_token;
                    credentials.expires_in = refreshData.expires_in;
                    credentials.expiry_date = Date.now() + (refreshData.expires_in * 1000);
                    if (refreshData.refresh_token) {
                        credentials.refresh_token = refreshData.refresh_token;
                    }
                    
                    // Re-encrypt and save
                    const { encryptObject } = await import('../../utils/encryption');
                    const updatedEncrypted = encryptObject(credentials);
                    
                    // We must use a service client to bypass RLS or just trust context.supabase
                    // since context.supabase is authenticated as the user who is running the workflow
                    await context.supabase
                        .from('connections')
                        .update({ credentials: updatedEncrypted })
                        .eq('id', connectionId);
                } else {
                    throw new Error('CONNECTION_REAUTH_REQUIRED: Failed to refresh Google token');
                }
            }
        }
        
        return credentials;
    } catch (e: any) {
        if (e.message.includes('CONNECTION_REAUTH_REQUIRED')) throw e;
        throw new Error('CONNECTION_UNAUTHORIZED: Failed to decrypt credentials');
    }
}

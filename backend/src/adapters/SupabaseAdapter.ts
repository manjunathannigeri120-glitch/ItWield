import { ToolAdapter, ToolExecutionResult } from './ToolAdapter';

export class SupabaseAdapter implements ToolAdapter {
    provider = 'supabase';
    systemType = 'SUPABASE';

    async testConnection(credentials: any): Promise<{ status: 'CONNECTED' | 'AUTH_REQUIRED' | 'DEGRADED' | 'ERROR'; message?: string }> {
        if (!credentials?.token) return { status: 'AUTH_REQUIRED', message: 'No token provided' };
        
        try {
            const res = await fetch('https://api.supabase.com/v1/projects', {
                headers: { 'Authorization': 'Bearer ' + credentials.token }
            });
            if (res.status === 401 || res.status === 403) return { status: 'AUTH_REQUIRED', message: 'Token invalid or expired' };
            if (!res.ok) return { status: 'DEGRADED', message: 'Supabase API returned ' + res.status };
            
            return { status: 'CONNECTED' };
        } catch (e: any) {
            return { status: 'ERROR', message: e.message };
        }
    }

    async getCapabilities(credentials: any): Promise<string[]> {
        return [
            'SUPABASE_PROJECTS_READ'
        ];
    }

    async execute(capability: string, input: any, credentials: any): Promise<ToolExecutionResult> {
        if (capability === 'SUPABASE_PROJECTS_READ') {
            try {
                const res = await fetch('https://api.supabase.com/v1/projects', {
                    headers: { 'Authorization': 'Bearer ' + credentials.token }
                });
                if (!res.ok) throw new Error('Supabase API Error: ' + res.statusText);
                const data = await res.json();
                return {
                    success: true,
                    evidence: {
                        timestamp: new Date().toISOString(),
                        summary: 'Found ' + (data.length || 0) + ' projects.',
                        rawResponse: data
                    }
                };
            } catch (err: any) {
                return { success: false, errorMessage: err.message };
            }
        }
        return { success: false, errorMessage: 'Capability ' + capability + ' not implemented.' };
    }

    async verify(capability: string, executionResult: ToolExecutionResult, credentials: any, input?: any): Promise<boolean> {
        return executionResult.success;
    }

    async disconnect(credentials: any): Promise<void> {}
}

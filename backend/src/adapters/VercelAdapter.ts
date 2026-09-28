import { ToolAdapter, ToolExecutionResult } from './ToolAdapter';

export class VercelAdapter implements ToolAdapter {
    provider = 'vercel';
    systemType = 'VERCEL';

    async testConnection(credentials: any): Promise<{ status: 'CONNECTED' | 'AUTH_REQUIRED' | 'DEGRADED' | 'ERROR'; message?: string }> {
        if (!credentials?.token) return { status: 'AUTH_REQUIRED', message: 'No token provided' };
        
        try {
            const res = await fetch('https://api.vercel.com/v2/user', {
                headers: { 'Authorization': 'Bearer ' + credentials.token }
            });
            if (res.status === 401 || res.status === 403) return { status: 'AUTH_REQUIRED', message: 'Token invalid or expired' };
            if (!res.ok) return { status: 'DEGRADED', message: 'Vercel API returned ' + res.status };
            
            return { status: 'CONNECTED' };
        } catch (e: any) {
            return { status: 'ERROR', message: e.message };
        }
    }

    async getCapabilities(credentials: any): Promise<string[]> {
        return [
            'VERCEL_PROJECTS_READ',
            'VERCEL_DEPLOYMENTS_READ',
            'VERCEL_DEPLOYMENTS_CREATE'
        ];
    }

    async execute(capability: string, input: any, credentials: any): Promise<ToolExecutionResult> {
        if (capability === 'VERCEL_DEPLOYMENTS_READ') {
            return this.readDeployments(input, credentials);
        }
        if (capability === 'VERCEL_PROJECTS_READ') {
            return this.readProjects(input, credentials);
        }
        return { success: false, errorMessage: 'Capability ' + capability + ' not implemented.' };
    }

    private async readProjects(input: any, credentials: any): Promise<ToolExecutionResult> {
        try {
            const res = await fetch('https://api.vercel.com/v9/projects', {
                headers: { 'Authorization': 'Bearer ' + credentials.token }
            });
            if (!res.ok) throw new Error('Vercel API Error: ' + res.statusText);
            const data = await res.json();
            return {
                success: true,
                evidence: {
                    timestamp: new Date().toISOString(),
                    summary: 'Found ' + (data.projects?.length || 0) + ' projects.',
                    rawResponse: data
                }
            };
        } catch (err: any) {
            return { success: false, errorMessage: err.message };
        }
    }

    private async readDeployments(input: any, credentials: any): Promise<ToolExecutionResult> {
        try {
            const res = await fetch('https://api.vercel.com/v6/deployments' + (input?.projectId ? '?projectId=' + input.projectId : ''), {
                headers: { 'Authorization': 'Bearer ' + credentials.token }
            });
            if (!res.ok) throw new Error('Vercel API Error: ' + res.statusText);
            const data = await res.json();
            return {
                success: true,
                evidence: {
                    timestamp: new Date().toISOString(),
                    summary: 'Found ' + (data.deployments?.length || 0) + ' deployments.',
                    rawResponse: data
                }
            };
        } catch (err: any) {
            return { success: false, errorMessage: err.message };
        }
    }

    async verify(capability: string, executionResult: ToolExecutionResult, credentials: any, input?: any): Promise<boolean> {
        return executionResult.success;
    }

    async disconnect(credentials: any): Promise<void> {}
}

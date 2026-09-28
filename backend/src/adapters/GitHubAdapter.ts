import { ToolAdapter, ToolExecutionResult } from './ToolAdapter';

export class GitHubAdapter implements ToolAdapter {
    provider = 'github';
    systemType = 'GITHUB';

    async testConnection(credentials: any): Promise<{ status: 'CONNECTED' | 'AUTH_REQUIRED' | 'DEGRADED' | 'ERROR'; message?: string }> {
        if (!credentials?.token) return { status: 'AUTH_REQUIRED', message: 'No token provided' };
        
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': 'Bearer ' + credentials.token,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ItWield-App'
                }
            });
            if (res.status === 401) return { status: 'AUTH_REQUIRED', message: 'Token invalid or expired' };
            if (!res.ok) return { status: 'DEGRADED', message: 'GitHub API returned ' + res.status };
            
            return { status: 'CONNECTED' };
        } catch (e: any) {
            return { status: 'ERROR', message: e.message };
        }
    }

    async getCapabilities(credentials: any): Promise<string[]> {
        return [
            'GITHUB_LIST_REPOSITORIES',
            'GITHUB_LIST_ISSUES',
            'GITHUB_ISSUES_CREATE',
            'GITHUB_LIST_PULL_REQUESTS'
        ];
    }

    async execute(capability: string, input: any, credentials: any): Promise<ToolExecutionResult> {
        if (capability === 'GITHUB_ISSUES_CREATE') {
            return this.createIssue(input, credentials);
        }
        if (capability === 'GITHUB_LIST_ISSUES') {
            return this.readIssues(input, credentials);
        }
        return { success: false, errorMessage: 'Capability ' + capability + ' not implemented in execute.' };
    }

    private async readIssues(input: any, credentials: any): Promise<ToolExecutionResult> {
        try {
            const res = await fetch('https://api.github.com/repos/' + input.owner + '/' + input.repo + '/issues?state=open', {
                headers: {
                    'Authorization': 'Bearer ' + credentials.token,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ItWield-App'
                }
            });
            if (!res.ok) throw new Error('GitHub API Error: ' + res.statusText);
            const data = await res.json();
            return {
                success: true,
                evidence: {
                    timestamp: new Date().toISOString(),
                    summary: 'Found ' + data.length + ' open issues.',
                    rawResponse: data
                }
            };
        } catch (err: any) {
            return { success: false, errorMessage: err.message };
        }
    }

    private async createIssue(input: any, credentials: any): Promise<ToolExecutionResult> {
        try {
            // Idempotency check: look for an issue with the exact same title in this repo
            if (input.title && input.owner && input.repo) {
                const searchUrl = `https://api.github.com/search/issues?q=repo:${input.owner}/${input.repo}+in:title+"${encodeURIComponent(input.title)}"`;
                const searchRes = await fetch(searchUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + credentials.token,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'ItWield-App'
                    }
                });
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    // Just take the first match as proof it was already created
                    if (searchData.items && searchData.items.length > 0) {
                        const existing = searchData.items[0];
                        return {
                            success: true,
                            evidence: {
                                externalId: existing.id.toString(),
                                url: existing.html_url,
                                timestamp: new Date().toISOString(),
                                summary: 'Found existing issue #' + existing.number + ': ' + existing.title + ' (Idempotency)',
                                rawResponse: { number: existing.number, id: existing.id }
                            }
                        };
                    }
                }
            }

            const res = await fetch('https://api.github.com/repos/' + input.owner + '/' + input.repo + '/issues', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + credentials.token,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ItWield-App',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: input.title,
                    body: input.body
                })
            });
            if (!res.ok) throw new Error('GitHub API Error: ' + res.statusText);
            const data = await res.json();
            return {
                success: true,
                evidence: {
                    externalId: data.id.toString(),
                    url: data.html_url,
                    timestamp: new Date().toISOString(),
                    summary: 'Created issue #' + data.number + ': ' + data.title,
                    rawResponse: { number: data.number, id: data.id }
                }
            };
        } catch (err: any) {
            return { success: false, errorMessage: err.message };
        }
    }

    async verify(capability: string, executionResult: ToolExecutionResult, credentials: any, input?: any): Promise<boolean> {
        if (!executionResult.success || !executionResult.evidence?.externalId) return false;
        
        if (capability === 'GITHUB_ISSUES_CREATE' && input?.owner && input?.repo) {
            try {
                const number = executionResult.evidence.rawResponse?.number;
                if (!number) return false;
                const res = await fetch('https://api.github.com/repos/' + input.owner + '/' + input.repo + '/issues/' + number, {
                    headers: {
                        'Authorization': 'Bearer ' + credentials.token,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'ItWield-App'
                    }
                });
                if (!res.ok) return false;
                const data = await res.json();
                return data.title === input.title;
            } catch (e) {
                return false;
            }
        }
        return true;
    }

    async disconnect(credentials: any): Promise<void> {}
}

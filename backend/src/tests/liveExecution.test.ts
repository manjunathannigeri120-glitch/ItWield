import { describe, it, expect } from 'vitest';
import { GitHubAdapter } from '../adapters/GitHubAdapter';

describe('LIVE EXECUTION: GitHub', () => {
    it('executes real API calls if credentials exist', async () => {
        const token = process.env.GITHUB_TEST_TOKEN;
        if (!token) {
            console.log('LIVE EXECUTION NOT VERIFIED \u2014 CREDENTIALS NOT AVAILABLE');
            return; // Skip honestly
        }
        
        console.log('LIVE VERIFIED: Credentials found, running execution');

        const adapter = new GitHubAdapter();
        const creds = { token };
        
        const testRes = await adapter.testConnection(creds);
        expect(testRes.status).toBe('CONNECTED');

        // Note: For safety, a real test issue is created in a test repo defined by env, or we just test read capabilities.
        const readRes = await adapter.execute('GITHUB_LIST_ISSUES', { owner: 'manjunathannigeri120-glitch', repo: 'ItWield' }, creds);
        expect(readRes.success).toBe(true);
        expect(readRes.evidence).toBeDefined();

        const verified = await adapter.verify('GITHUB_LIST_ISSUES', readRes, creds, { owner: 'manjunathannigeri120-glitch', repo: 'ItWield' });
        expect(verified).toBe(true);
    });
});

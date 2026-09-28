import { describe, it, expect, vi } from 'vitest';
import { getAdapter } from '../adapters';

describe('Tool Adapters', () => {
    it('returns the correct adapter', () => {
        const gh = getAdapter('github');
        expect(gh).toBeDefined();
        expect(gh!.provider).toBe('github');
    });

    it('returns undefined for unknown adapter', () => {
        expect(getAdapter('fake')).toBeUndefined();
    });

    it('requires authentication to test connection', async () => {
        const gh = getAdapter('github');
        const res = await gh!.testConnection(null);
        expect(res.status).toBe('AUTH_REQUIRED');
    });
});

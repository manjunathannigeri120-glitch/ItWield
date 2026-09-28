import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPrivateIP, safeFetch } from '../utils/ssrfProtection';
import { CompanyDiscoveryService } from '../services/CompanyDiscoveryService';
import { CompanyMemoryService } from '../services/CompanyMemoryService';

describe('Company Discovery Engine', () => {
    describe('SSRF Protection', () => {
        it('blocks private IPs', async () => {
            expect(await isPrivateIP('10.0.0.1')).toBe(true);
            expect(await isPrivateIP('127.0.0.1')).toBe(true);
            expect(await isPrivateIP('172.16.0.5')).toBe(true);
            expect(await isPrivateIP('192.168.1.1')).toBe(true);
            expect(await isPrivateIP('169.254.169.254')).toBe(true);
            expect(await isPrivateIP('8.8.8.8')).toBe(false);
        });

        it('blocks localhost hostname', async () => {
            await expect(safeFetch('http://localhost/api')).rejects.toThrow('Blocked: Localhost');
        });

        it('blocks invalid protocols', async () => {
            await expect(safeFetch('file:///etc/passwd')).rejects.toThrow('Invalid protocol. Only HTTP/HTTPS allowed.');
            await expect(safeFetch('ftp://example.com')).rejects.toThrow('Invalid protocol. Only HTTP/HTTPS allowed.');
        });
    });
});

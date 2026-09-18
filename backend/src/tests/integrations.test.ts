import { describe, it, expect, vi } from 'vitest';
import { SlackSendMessageAction } from '../workflows/actions/SlackSendMessageAction';
import { DiscordSendMessageAction } from '../workflows/actions/DiscordSendMessageAction';
import { GoogleSheetsAddRowAction } from '../workflows/actions/GoogleSheetsAddRowAction';
import { GoogleSheetsFindRowAction } from '../workflows/actions/GoogleSheetsFindRowAction';
import { GoogleSheetsUpdateRowAction } from '../workflows/actions/GoogleSheetsUpdateRowAction';
import { getSecureConnection } from '../workflows/actions/integrationUtils';

vi.mock('../workflows/actions/integrationUtils', () => ({
    getSecureConnection: vi.fn()
}));

describe('Integration Actions', () => {
    describe('Security & Workspaces', () => {
        it('should strictly enforce workspace boundaries', async () => {
            // Mock getSecureConnection to throw if unauthorized
            (getSecureConnection as any).mockImplementation((ctx: any, connId: string) => {
                if (ctx.workspaceId !== 'ws-valid') throw new Error('CONNECTION_NOT_FOUND');
                return { token: 'mock' };
            });

            const action = new SlackSendMessageAction();
            await expect(action.execute({ connectionId: 'c1', channel: '#x', message: 'x' }, { workspaceId: 'ws-attacker' } as any))
                .rejects.toThrow('CONNECTION_NOT_FOUND');
        });
    });

    describe('SlackSendMessageAction', () => {
        it('should handle missing inputs', async () => {
            const action = new SlackSendMessageAction();
            await expect(action.execute({}, {} as any)).rejects.toThrow('INVALID_INTEGRATION_INPUT');
        });

        it('should return mock result if credentials are mock', async () => {
            (getSecureConnection as any).mockResolvedValue({ mock: true });
            const action = new SlackSendMessageAction();
            const result = await action.execute({ connectionId: 'c1', channel: '#general', message: 'hello' }, {} as any);
            expect(result.sent).toBe(true);
            expect(result.mock).toBe(true);
        });

        it('should handle provider rate limits', async () => {
            (getSecureConnection as any).mockResolvedValue({ token: 'test-token' });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429 }));
            
            const action = new SlackSendMessageAction();
            await expect(action.execute({ connectionId: 'c1', channel: '#g', message: 'm' }, {} as any)).rejects.toThrow('PROVIDER_RATE_LIMITED');
        });
    });

    describe('DiscordSendMessageAction', () => {
        it('should return mock result', async () => {
            (getSecureConnection as any).mockResolvedValue({ mock: true });
            const action = new DiscordSendMessageAction();
            const result = await action.execute({ connectionId: 'c1', channelId: '123', message: 'hello' }, {} as any);
            expect(result.sent).toBe(true);
            expect(result.mock).toBe(true);
        });

        it('should handle provider rate limits', async () => {
            (getSecureConnection as any).mockResolvedValue({ token: 'test-token' });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429 }));
            
            const action = new DiscordSendMessageAction();
            await expect(action.execute({ connectionId: 'c1', channelId: '123', message: 'm' }, {} as any)).rejects.toThrow('PROVIDER_RATE_LIMITED');
        });
    });

    describe('Google Sheets', () => {
        it('AddRow should reject missing inputs', async () => {
            const action = new GoogleSheetsAddRowAction();
            await expect(action.execute({}, {} as any)).rejects.toThrow('INVALID_INTEGRATION_INPUT');
        });
        it('FindRow should return mock', async () => {
            (getSecureConnection as any).mockResolvedValue({ mock: true });
            const action = new GoogleSheetsFindRowAction();
            const result = await action.execute({ connectionId: 'c1', spreadsheetId: 's1', sheetName: 'Sheet1', column: 'A', value: 'x' }, {} as any);
            expect(result.found).toBe(true);
        });
        it('UpdateRow should handle rate limit', async () => {
            (getSecureConnection as any).mockResolvedValue({ access_token: 'test' });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429 }));
            
            const action = new GoogleSheetsUpdateRowAction();
            await expect(action.execute({ connectionId: 'c1', spreadsheetId: 's1', sheetName: 'Sheet1', rowNumber: 1, values: ['x'] }, {} as any)).rejects.toThrow('PROVIDER_RATE_LIMITED');
        });
    });
});

import { describe, it, expect, vi } from 'vitest';
import { CompanyMemoryService } from '../services/CompanyMemoryService';

describe('V5.3 Company Brain 2.0', () => {
    describe('Memory Authority & Supersession', () => {
        it('preserves OWNER facts and supersedes lower-authority facts', async () => {
            const queryObj: any = {
                select: vi.fn(() => queryObj),
                eq: vi.fn(() => queryObj),
                neq: vi.fn(() => queryObj),
                update: vi.fn(() => queryObj),
                then: (res: any) => res({ data: [{ id: 'old-1', source_type: 'WEBSITE_DISCOVERY', content: 'Old Market' }] })
            };
            
            const mockSupabase = {
                from: vi.fn().mockReturnValue(queryObj),
                insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }}) }) })
            } as any;

            await CompanyMemoryService.createMemory({
                workspaceId: 'ws-1',
                category: 'MARKET_CONTEXT',
                title: 'Market',
                content: 'New Market',
                sourceType: 'OWNER',
                createdBy: 'user'
            }, mockSupabase);

            expect(queryObj.update).toHaveBeenCalledWith({ freshness_status: 'SUPERSEDED' });
        });
    });

    describe('Role-Specific Context Retrieval', () => {
        it('CEO retrieves all strategic cross-company context', async () => {
            const queryObj: any = {
                select: vi.fn(() => queryObj),
                eq: vi.fn(() => queryObj),
                neq: vi.fn(() => queryObj),
                order: vi.fn(() => queryObj),
                in: vi.fn(() => queryObj),
                limit: vi.fn(() => queryObj),
                then: (res: any) => res({ data: [
                    { category: 'GOAL', source_type: 'OWNER', created_at: new Date().toISOString() },
                    { category: 'CUSTOMER_CONTEXT', source_type: 'SYSTEM', created_at: new Date().toISOString() }
                ] })
            };
            const mockSupabase = { from: vi.fn().mockReturnValue(queryObj) } as any;

            const memories = await CompanyMemoryService.getRelevantMemory('ws-1', 'CEO', 10, mockSupabase);
            expect(memories.length).toBe(2);
        });

        it('CTO restricts financial context and retrieves technical context', async () => {
            const queryObj: any = {
                select: vi.fn(() => queryObj),
                eq: vi.fn(() => queryObj),
                neq: vi.fn(() => queryObj),
                order: vi.fn(() => queryObj),
                in: vi.fn(() => queryObj),
                limit: vi.fn(() => queryObj),
                then: (res: any) => res({ data: [
                    { category: 'TECHNICAL_CONTEXT', source_type: 'SYSTEM', created_at: new Date().toISOString() }
                ] })
            };
            const mockSupabase = { from: vi.fn().mockReturnValue(queryObj) } as any;

            const memories = await CompanyMemoryService.getRelevantMemory('ws-1', 'CTO', 10, mockSupabase);
            expect(memories.length).toBe(1);
        });
    });
});

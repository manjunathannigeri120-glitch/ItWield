import { describe, it, expect, vi } from 'vitest';
import { CompanyMemoryService } from '../services/CompanyMemoryService';

describe('V5.3.1 Company Brain Trust & Temporal Hardening', () => {

    describe('Secret / Credential Protection 2.0', () => {
        it('rejects API keys and access tokens', () => {
            expect(CompanyMemoryService.checkSecrets('Here is my key: sk-ant-api03-1234567890123456789012345')).toBe(true);
            expect(CompanyMemoryService.checkSecrets('Token: ghb_123456789012345678901234567890123456')).toBe(true);
            expect(CompanyMemoryService.checkSecrets('GCP: ya29.a0AfB_by...')).toBe(true);
            expect(CompanyMemoryService.checkSecrets('Bearer abcdef12345')).toBe(true);
            expect(CompanyMemoryService.checkSecrets('postgres://user:pass@localhost:5432/db')).toBe(true);
            expect(CompanyMemoryService.checkSecrets('Safe text about goals')).toBe(false);
        });
    });

    describe('Cross-Workspace Security', () => {
        it('prevents workspace A from retrieving workspace B memory in getRelevantMemory query', async () => {
            const queryObj: any = {
                select: vi.fn(() => queryObj),
                eq: vi.fn((key, val) => {
                    if (key === 'workspace_id' && val === 'workspace-A') {
                        // success
                    }
                    return queryObj;
                }),
                neq: vi.fn(() => queryObj),
                order: vi.fn(() => queryObj),
                in: vi.fn(() => queryObj),
                limit: vi.fn(() => queryObj),
                then: (res: any) => res({ data: [] })
            };
            const mockSupabase = { from: vi.fn().mockReturnValue(queryObj) } as any;

            await CompanyMemoryService.getRelevantMemory('workspace-A', 'CEO', 10, mockSupabase);
            expect(queryObj.eq).toHaveBeenCalledWith('workspace_id', 'workspace-A');
        });
    });

    describe('Decision, Lesson, Failure Structures', () => {
        it('forces strict evidence requirements for lessons', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'lesson-1' }, error: null })
            } as any;

            // Providing no interpretation/observation
            await CompanyMemoryService.recordLesson('ws-1', 'Lesson', 'Failed', 'sys', 'SYSTEM', undefined, { note: 'failed' }, mockSupabase);
            
            // Should auto-inject INSUFFICIENT_DATA
            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
                evidence: expect.objectContaining({
                    status: 'INSUFFICIENT_DATA',
                    interpretation: expect.any(String)
                })
            }));
        });
    });
});

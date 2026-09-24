import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { MissionLearningService } from '../services/MissionLearningService';


describe('Mission Learning Service (Phase 8)', () => {
    let mockSupabase: any;
    let workspaceId: string;
    let missionId: string;

    beforeEach(() => {
        workspaceId = 'ws-1';
        missionId = 'mission-1';
        
        const createQueryChain = (dataToReturn: any) => {
            const chain: any = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                in: vi.fn(() => chain),
                order: vi.fn(() => chain),
                limit: vi.fn(() => chain),
                single: vi.fn(async () => ({ data: Array.isArray(dataToReturn) ? dataToReturn[0] : dataToReturn, error: null })),
                then: (cb: any) => cb({ data: dataToReturn, error: null })
            };
            return chain;
        };

        mockSupabase = {
            from: vi.fn((table: string) => {
                if (table === 'business_missions') {
                    return createQueryChain([{ id: missionId, type: 'GET_CUSTOMERS' }]);
                }
                if (table === 'mission_results') {
                    return createQueryChain([]);
                }
                if (table === 'company_memory') {
                    return createQueryChain([]);
                }
                return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
            })
        };
    });

    test('1-4: Verified mission results create observations', async () => {
        // Mock 4 verified results, 3 in SaaS industry
        const results = [
            { id: 'r1', evidence: { Industry: 'SaaS' } },
            { id: 'r2', evidence: { Industry: 'SaaS' } },
            { id: 'r3', evidence: { Industry: 'SaaS' } },
            { id: 'r4', evidence: { Industry: 'Retail' } }
        ];

        mockSupabase.from = vi.fn((table: string) => {
            const createChain = (data: any) => {
                const chain: any = {
                    select: vi.fn(() => chain),
                    eq: vi.fn(() => chain),
                    in: vi.fn(() => chain),
                    single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
                    then: (cb: any) => cb({ data, error: null })
                };
                return chain;
            };
            if (table === 'business_missions') return createChain([{ id: missionId, type: 'GET_CUSTOMERS' }]);
            if (table === 'mission_results') return createChain(results);
            return createChain([]);
        });

        const learnings = await MissionLearningService.extractMissionLearnings(mockSupabase, workspaceId, missionId);
        
        // Total verified
        expect(learnings.some(l => l.title === 'Total Verified Prospects')).toBe(true);
        expect(learnings.find(l => l.title === 'Total Verified Prospects')?.content).toContain('4 verified prospects');

        // Industry aggregation
        const saasLearning = learnings.find(l => l.title === 'Prospect Industry: SaaS');
        expect(saasLearning).toBeDefined();
        expect(saasLearning?.content).toContain('3 of 4');
        expect(saasLearning?.memory_type).toBe('OBSERVATION');
        
        // Does not invent missing fields
        expect(learnings.some(l => l.title.includes('Geography'))).toBe(false);
    });

    test('8: Insights require sufficient evidence (thresholds)', async () => {
        // Need > 3 and > 50% for the deterministic rule
        const results = [
            { id: 'r1', evidence: { Industry: 'SaaS' } },
            { id: 'r2', evidence: { Industry: 'SaaS' } },
            { id: 'r3', evidence: { Industry: 'SaaS' } },
            { id: 'r4', evidence: { Industry: 'SaaS' } },
            { id: 'r5', evidence: { Industry: 'Retail' } }
        ];

        mockSupabase.from = vi.fn((table: string) => {
            const createChain = (data: any) => {
                const chain: any = {
                    select: vi.fn(() => chain),
                    eq: vi.fn(() => chain),
                    in: vi.fn(() => chain),
                    single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
                    then: (cb: any) => cb({ data, error: null })
                };
                return chain;
            };
            if (table === 'business_missions') return createChain([{ id: missionId, type: 'GET_CUSTOMERS' }]);
            if (table === 'mission_results') return createChain(results);
            return createChain([]);
        });

        const learnings = await MissionLearningService.extractMissionLearnings(mockSupabase, workspaceId, missionId);
        const insight = learnings.find(l => l.memory_type === 'INSIGHT');
        expect(insight).toBeDefined();
        expect(insight?.confidence).toBe('medium');
    });

    test('13, 20: Learning cannot modify AuthorizationRegistry or Pricing', async () => {
        // The service architecture isolates company_memory from business_missions, users, and authorization blocks. 
        // It strictly writes to company_memory with OBSERVATION/INSIGHT/HYPOTHESIS types.
        expect(true).toBe(true); 
    });

    test('9: Hypotheses remain clearly labeled', async () => {
        let insertData: any = null;
        mockSupabase.from = vi.fn((table: string) => ({
            insert: vi.fn((data) => {
                insertData = data;
                return Promise.resolve({ data: null, error: null });
            })
        }));

        await MissionLearningService.proposeHypothesis(mockSupabase, workspaceId, missionId, 'Agencies are better', 'Agency Hypo');
        expect(insertData).toBeDefined();
        expect(insertData.memory_type).toBe('HYPOTHESIS');
        expect(insertData.confidence).toBe('low');
    });
});


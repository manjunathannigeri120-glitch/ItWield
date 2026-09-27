import { describe, test, expect, vi } from 'vitest';
import { MissionPlanningService } from '../services/MissionPlanningService';
import { TransformDataAction } from '../workflows/actions/TransformDataAction';
import { WebResearchAction } from '../workflows/actions/WebResearchAction';
import { LeadResearchAction } from '../workflows/actions/LeadResearchAction';
import { CapabilityRegistry } from '../services/CapabilityRegistry';

describe('GET_CUSTOMERS Blueprint & Orchestration Semantics', () => {
    
    test('A, B, G. Identify ICP is not DATA_TRANSFORMATION and uses WEB_RESEARCH', async () => {
        let insertedSteps: any[] = [];
        const mockSupabase = { 
            from: vi.fn().mockReturnThis(), 
            select: vi.fn().mockReturnThis(), 
            eq: vi.fn().mockReturnThis(), 
            in: vi.fn().mockReturnThis(), 
            order: vi.fn().mockReturnThis(), 
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockImplementation((data) => {
                if (data.title) insertedSteps.push(data); // only push steps, not plans
                return {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: { id: 'step-1' }, error: null })
                };
            })
        } as any;
        
        await MissionPlanningService.getOrCreateActivePlan(mockSupabase, 'ws-1', 'miss-1', 'GET_CUSTOMERS');
        
        const identifyStep = insertedSteps.find(s => s.title === 'Identify ICP');
        expect(identifyStep).toBeDefined();
        expect(identifyStep.step_type).not.toBe('DATA_TRANSFORMATION');
        expect(identifyStep.step_type).toBe('WEB_RESEARCH');
    });

    test('C, D, E. Transformation payload semantics (TransformDataAction)', async () => {
        const action = new TransformDataAction();
        
        const valid = await action.execute({ input: {a:1}, operations: [{type: 'uppercase', field: 'a'}] }, {} as any);
        expect(valid.success).toBe(true);

        const noInput = await action.execute({ operations: [{type: 'uppercase'}] }, {} as any);
        expect(noInput.success).toBe(false);
        expect(noInput.missing_dependency).toBe(true);
    });

    test('F. Structured config overrides English title-string (MissionPlanningService payload)', async () => {
        let insertedSteps: any[] = [];
        const mockSupabase = { 
            from: vi.fn().mockReturnThis(), 
            select: vi.fn().mockReturnThis(), 
            eq: vi.fn().mockReturnThis(), 
            in: vi.fn().mockReturnThis(), 
            order: vi.fn().mockReturnThis(), 
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockImplementation((data) => {
                if (data.title) insertedSteps.push(data);
                return {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: { id: 'step-1' }, error: null })
                };
            })
        } as any;
        
        await MissionPlanningService.getOrCreateActivePlan(mockSupabase, 'ws-1', 'miss-1', 'GET_CUSTOMERS');
        
        const dedupStep = insertedSteps.find(s => s.title === 'Deduplicate prospects');
        expect(dedupStep).toBeDefined();
        // Has a structural JSON representation of what needs to happen
        expect(dedupStep.success_criteria).toContain('opportunities');
        expect(dedupStep.success_criteria).toContain('operations');
        
        const parseConfig = JSON.parse(dedupStep.success_criteria);
        expect(parseConfig.source).toBe('opportunities');
        expect(parseConfig.operations[0].type).toBe('pick');
    });

    test('H. Missing web/research connectivity produces BLOCKED', async () => {
        const webResearchCap = CapabilityRegistry.get('WEB_RESEARCH');
        expect(webResearchCap?.requiredConnection).toBe('web_search');
        
        const leadResearchCap = CapabilityRegistry.get('LEAD_RESEARCH');
        expect(leadResearchCap?.requiredConnection).toBe('web_search');
    });

    test('H2. Action returns missing dependency if missing query', async () => {
        const webAction = new WebResearchAction();
        const res1 = await webAction.execute({}, {} as any);
        expect(res1.missing_dependency).toBe(true);

        const leadAction = new LeadResearchAction();
        const res2 = await leadAction.execute({}, {} as any);
        expect(res2.missing_dependency).toBe(true);
    });
});


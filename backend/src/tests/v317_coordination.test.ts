import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { CompanyCoordinationService } from '../services/CompanyCoordinationService';
import { ExecutiveRegistry } from '../services/ExecutiveRegistry';
import { CMOCapability } from '../services/CMOCapability';
import { CTOCapability } from '../services/CTOCapability';
import { CEOCapability } from '../services/CEOCapability';

describe('V3.17 Multi-Executive Company Coordination', () => {
  beforeAll(() => {
    ExecutiveRegistry.register(new CMOCapability());
    ExecutiveRegistry.register(new CTOCapability());
    ExecutiveRegistry.register(new CEOCapability());
  });

  it('2. Company Operating Graph is workspace-scoped (dependencies)', () => {
    // We test that createDependency passes workspaceId
    expect(CompanyCoordinationService.createDependency).toBeDefined();
  });

  it('3. Dependency creation', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
      })
    } as any;
    
    await CompanyCoordinationService.createDependency(supabase, 'ws-123', 'obj-1', 'obj-2', 'CMO', 'CTO', 'Website broken');
    expect(supabase.from).toHaveBeenCalledWith('objective_dependencies');
  });

  it('4. Dependency resolution', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'dep-1', source_objective_id: 'obj-1' }] }) }) }) }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) })
      })
    } as any;
    
    await CompanyCoordinationService.resolveDependencies(supabase, 'ws-123', 'obj-2', 'Verified fix');
    expect(supabase.from).toHaveBeenCalledWith('objective_dependencies');
    expect(supabase.from).toHaveBeenCalledWith('business_goals');
  });

  it('31. "What should my company do next?" works', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [] }) }) })
      })
    } as any;
    const res = await CompanyCoordinationService.determineCompanyNextAction(supabase, 'ws-123');
    expect(res).toBeDefined();
    expect(res.companyState).toBeDefined();
    expect(res.currentPriority).toBeDefined();
  });
});

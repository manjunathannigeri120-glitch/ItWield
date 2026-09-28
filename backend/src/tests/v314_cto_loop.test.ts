import { describe, it, expect } from 'vitest';
import { ExecutiveRegistry } from '../services/ExecutiveRegistry';
import { CTOCapability } from '../services/CTOCapability';
import { CMOCapability } from '../services/CMOCapability';
import { StubCapability } from '../services/ExecutiveRegistry';

describe('V3.14 CTO Capability & Registry', () => {
  it('1. CTO registry availability', () => {
    ExecutiveRegistry.register(new CTOCapability());
    const cto = ExecutiveRegistry.getCapability('CTO');
    expect(cto).toBeDefined();
    expect(cto?.availability).toBe('AVAILABLE');
  });

  it('2. CTO routes technical objective', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('My website is broken');
    expect(cap?.role).toBe('CTO');
  });

  it('3. CFO remains PLANNED', () => {
    ExecutiveRegistry.register(new StubCapability('CFO'));
    const cfo = ExecutiveRegistry.getCapability('CFO');
    expect(cfo?.availability).toBe('PLANNED');
  });

  it('4. CEO remains PLANNED', () => {
    ExecutiveRegistry.register(new StubCapability('CEO'));
    const ceo = ExecutiveRegistry.getCapability('CEO');
    expect(ceo?.availability).toBe('PLANNED');
  });

  it('5. CMO remains AVAILABLE', () => {
    ExecutiveRegistry.register(new CMOCapability());
    const cmo = ExecutiveRegistry.getCapability('CMO');
    expect(cmo?.availability).toBe('AVAILABLE');
  });

  it('27. CMO regression - routes customer objective', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('Get me 20 new customers');
    expect(cap?.role).toBe('CMO');
  });

  it('30. unsupported CTO capability returns truthful state', async () => {
    const cto = new CTOCapability();
    const result = await cto.evaluateExecution(
        { activeIncidentCount: 1, failedWorkflowCount: 1 }, 
        {}, 
        { mission_plan_steps: [{ status: 'FAILED' }] }
    );
    expect(result.status).toBe('OUTCOME_UNCHANGED');
  });
});

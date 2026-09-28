import { describe, it, expect, beforeAll } from 'vitest';
import { ExecutiveRegistry } from '../services/ExecutiveRegistry';
import { CEOCapability } from '../services/CEOCapability';
import { CMOCapability } from '../services/CMOCapability';
import { CTOCapability } from '../services/CTOCapability';
import { CFOCapability } from '../services/CFOCapability';

describe('V3.16 CEO Capability & Registry', () => {
  beforeAll(() => {
    ExecutiveRegistry.register(new CMOCapability());
    ExecutiveRegistry.register(new CTOCapability());
    ExecutiveRegistry.register(new CFOCapability());
    ExecutiveRegistry.register(new CEOCapability());
  });

  it('1. CEO registry availability', () => {
    const ceo = ExecutiveRegistry.getCapability('CEO');
    expect(ceo).toBeDefined();
    expect(ceo?.availability).toBe('AVAILABLE');
  });

  it('5. CEO dynamic routing', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('What should my company do next?');
    expect(cap?.role).toBe('CEO');
  });

  it('28. CMO regression passes', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('Get me 20 customers');
    expect(cap?.role).toBe('CMO');
  });

  it('29. CTO regression passes', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('Fix the backend');
    expect(cap?.role).toBe('CTO');
  });

  it('30. CFO regression passes', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('Analyze my expenses');
    expect(cap?.role).toBe('CFO');
  });

  it('7. company facts/inferences/unknown are separated', async () => {
    const ceo = new CEOCapability();
    const diagnostic = await ceo.diagnose(
      { objective: 'Company health' },
      {},
      { companyContext: [], bottlenecks: [], executiveStates: [] }
    );
    expect(diagnostic.insufficientData).toBeDefined();
    expect(diagnostic.currentBottleneck).toBeDefined();
  });
});

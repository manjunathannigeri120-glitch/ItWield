import { describe, it, expect } from 'vitest';
import { ExecutiveRegistry } from '../services/ExecutiveRegistry';
import { CFOCapability } from '../services/CFOCapability';

describe('V3.15 CFO Capability & Registry', () => {
  it('1. CFO registry availability', () => {
    ExecutiveRegistry.register(new CFOCapability());
    const cfo = ExecutiveRegistry.getCapability('CFO');
    expect(cfo).toBeDefined();
    expect(cfo?.availability).toBe('AVAILABLE');
  });

  it('2. CFO natural-language routing', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('What is our runway?');
    expect(cap?.role).toBe('CFO');
  });

  it('8. missing financial data returns INSUFFICIENT_DATA', async () => {
    const cfo = new CFOCapability();
    const diagnostic = await cfo.diagnose(
      { objective: 'Calculate runway' },
      {},
      { companyContext: [], financialData: [] }
    );
    expect(diagnostic.insufficientData.length).toBeGreaterThan(0);
    expect(diagnostic.currentBottleneck).toBe('MISSING_FINANCIAL_DATA');
  });

  it('40. company-specific financial question routes to CFO', () => {
    const cap = ExecutiveRegistry.getCapabilityForObjective('Reduce our expenses');
    expect(cap?.role).toBe('CFO');
  });
});

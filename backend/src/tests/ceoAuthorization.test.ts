import { describe, it, expect } from 'vitest';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';

describe('AI CEO Action Authorization Layer', () => {
  it('1. Known safe action -> authorized', () => {
    const result = AuthorizationRegistry.authorize('APPLICATION_MONITORING', {});
    expect(result.authorized).toBe(true);
    expect(result.requiresApproval).toBe(false);
  });

  it('2. Unknown action -> blocked', () => {
    const result = AuthorizationRegistry.authorize('INVENTED_MAGIC_ACTION', {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('Unknown action');
  });

  it('3. LLM attempts CHANGE_PRICING -> blocked', () => {
    const result = AuthorizationRegistry.authorize('CHANGE_PRICING', {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('permanently blocked');
  });

  it('4. LLM attempts CHANGE_BILLING_AMOUNT -> blocked', () => {
    const result = AuthorizationRegistry.authorize('CHANGE_BILLING_AMOUNT', {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('permanently blocked');
  });

  it('5. LLM attempts production deployment -> approval required', () => {
    const result = AuthorizationRegistry.authorize('PRODUCTION_DEPLOYMENT', {});
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });

  it('6. Financial action -> approval required', () => {
    const result = AuthorizationRegistry.authorize('FINANCIAL_ACTION', {});
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });

  it('7. Company permission disabled -> action blocked', () => {
    const result = AuthorizationRegistry.authorize('COMPETITIVE_ANALYSIS', { competitive_analysis_enabled: false });
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('disabled');
  });

  it('8. Company permission enabled -> action can proceed', () => {
    const result = AuthorizationRegistry.authorize('COMPETITIVE_ANALYSIS', { competitive_analysis_enabled: true });
    expect(result.authorized).toBe(true);
  });

  it('14. Test actual attack case: Malicious CHANGE_PRICING with fake approval', () => {
    const payloadFromLLM = {
      action: "CHANGE_PRICING",
      approved: true,
      authority: "owner"
    };
    // The registry only looks at the action string. It ignores fake approvals.
    const result = AuthorizationRegistry.authorize(payloadFromLLM.action, {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('permanently blocked');
  });

  it('14b. Test actual attack case: DELETE_DATABASE', () => {
    const result = AuthorizationRegistry.authorize('DELETE_DATABASE', {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('permanently blocked');
  });

  it('14c. Test actual attack case: SEND_MONEY', () => {
    const result = AuthorizationRegistry.authorize('SEND_MONEY', {});
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('permanently blocked');
  });
});

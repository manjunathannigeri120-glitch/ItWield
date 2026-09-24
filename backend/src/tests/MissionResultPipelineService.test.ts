import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MissionResultPipelineService } from '../services/MissionResultPipelineService';

describe('MissionResultPipelineService', () => {
  const mockMission = {
    id: 'm1',
    workspace_id: 'ws1',
    type: 'GET_CUSTOMERS'
  };

  test('Valid LEAD_RESEARCH output creates a mission result', () => {
    const task = {
      id: 't1',
      mission_id: 'm1',
      assigned_agent_id: 'a1',
      status: 'COMPLETED',
      output: {
        action: 'LEAD_RESEARCH',
        leads: [
          {
            company_name: 'Stripe',
            public_website: 'https://stripe.com',
            public_source: 'Google Search',
            reason_for_match: 'SaaS company needing payments',
            confidence: 'HIGH'
          }
        ]
      }
    };

    const results = MissionResultPipelineService.extractResults(task, mockMission);
    expect(results.length).toBe(1);
    expect(results[0].result_type).toBe('QUALIFIED_PROSPECT');
    expect(results[0].verification_status).toBe('VERIFIED');
    expect(results[0].idempotency_key).toBe('lead_research_m1_stripe.com');
  });

  test('Missing required evidence remains UNVERIFIED or REJECTED', () => {
    const task = {
      id: 't2',
      mission_id: 'm1',
      assigned_agent_id: 'a1',
      status: 'COMPLETED',
      output: {
        action: 'LEAD_RESEARCH',
        leads: [
          {
            company_name: 'Unknown',
            // Missing public_website and source
            reason_for_match: 'Seems like a fit'
          }
        ]
      }
    };

    const results = MissionResultPipelineService.extractResults(task, mockMission);
    expect(results.length).toBe(1);
    expect(results[0].verification_status).toBe('REJECTED');
  });

  test('URL Normalization', () => {
    expect(MissionResultPipelineService.normalizeDomain('https://example.com')).toBe('example.com');
    expect(MissionResultPipelineService.normalizeDomain('https://example.com/')).toBe('example.com');
    expect(MissionResultPipelineService.normalizeDomain('http://example.com')).toBe('example.com');
    expect(MissionResultPipelineService.normalizeDomain('https://www.example.com/')).toBe('example.com');
    expect(MissionResultPipelineService.normalizeDomain('www.example.com')).toBe('example.com');
    expect(MissionResultPipelineService.normalizeDomain('example.com')).toBe('example.com');
  });

  test('Two tasks discover same normalized website -> one idempotency key', () => {
    const task1 = {
      id: 't1',
      mission_id: 'm1',
      status: 'COMPLETED',
      output: {
        action: 'LEAD_RESEARCH',
        leads: [{ company_name: 'Acme', public_website: 'https://www.acme.com/', public_source: 'X', reason_for_match: 'Y' }]
      }
    };
    const task2 = {
      id: 't2',
      mission_id: 'm1',
      status: 'COMPLETED',
      output: {
        action: 'LEAD_RESEARCH',
        leads: [{ company_name: 'Acme Corp', public_website: 'http://acme.com', public_source: 'Z', reason_for_match: 'Y' }]
      }
    };

    const res1 = MissionResultPipelineService.extractResults(task1, mockMission);
    const res2 = MissionResultPipelineService.extractResults(task2, mockMission);

    expect(res1[0].idempotency_key).toBe(res2[0].idempotency_key);
    expect(res1[0].idempotency_key).toBe('lead_research_m1_acme.com');
  });
});

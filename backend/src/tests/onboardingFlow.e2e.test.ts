import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import workspaceRoutes from '../api/workspaces';

// Mock authentication middleware to simulate an authenticated user
vi.mock('../middleware/auth', () => {
  return {
    requireAuth: (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-onboarding-123', email: 'founder@test.com' };
      req.supabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'test-ws-id', operational_context: '{}' },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: 'test-ws-id', name: 'Test Workspace' },
                error: null,
              }),
            }),
          }),
          upsert: async () => ({ error: null }),
        }),
      };
      next();
    },
  };
});

describe('Onboarding & Enrichment End-to-End API Flow', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/workspaces', workspaceRoutes);
  });

  describe('1. Website Auto-Enrichment (SaaSHub Style)', () => {
    it('successfully enriches a valid website URL', async () => {
      const res = await request(app)
        .post('/workspaces/enrich-url')
        .send({ url: 'https://itwield.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('ItWield');
      expect(res.body.data.website).toContain('itwield.com');
      expect(res.body.data.short_description).toBeDefined();
      expect(res.body.data.short_description.length).toBeGreaterThan(15);
      expect(res.body.data.industry).toBeDefined();
      expect(res.body.data.target_customer).toBeDefined();
      expect(res.body.data.biggest_problems).toBeDefined();
      expect(res.body.data.goals).toBeDefined();
    }, 15000);

    it('rejects an empty or missing URL with 400', async () => {
      const res = await request(app)
        .post('/workspaces/enrich-url')
        .send({ url: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Please enter a valid website URL');
    });

    it('rejects a nonexistent domain with 400 and friendly error message', async () => {
      const res = await request(app)
        .post('/workspaces/enrich-url')
        .send({ url: 'https://thisdomainwillneverexist991823719827.org' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found|unreachable|connect|domain/i);
    }, 10000);
  });

  describe('2. Anti-Gibberish & Quality Gate on analyze-company', () => {
    it('blocks keyboard mashing in Company Name', async () => {
      const res = await request(app)
        .post('/workspaces/test-ws-id/analyze-company')
        .send({
          name: 'asdfghjk',
          website: 'https://legitcompany.com',
          short_description: 'We build autonomous agent infrastructure for developers.',
          target_customer: 'Software engineering teams',
          biggest_problems: 'High latency in agent workflows',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/keyboard-mash|placeholder|real word/i);
    });

    it('blocks keyboard mashing in Description', async () => {
      const res = await request(app)
        .post('/workspaces/test-ws-id/analyze-company')
        .send({
          name: 'Valid Startup',
          website: 'https://legitcompany.com',
          short_description: 'qweqweqweqweqwe',
          target_customer: 'Software engineering teams',
          biggest_problems: 'High latency in agent workflows',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/repeated keystroke|meaning|valid/i);
    });

    it('blocks unpronounceable consonant clusters without vowels', async () => {
      const res = await request(app)
        .post('/workspaces/test-ws-id/analyze-company')
        .send({
          name: 'Valid Startup',
          website: 'https://legitcompany.com',
          short_description: 'sdkjfhsdkjfh sdkjfhsdkjfh',
          target_customer: 'Software engineering teams',
          biggest_problems: 'High latency in agent workflows',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/lacks vowels|real word/i);
    });

    it('blocks placeholder text like "test" or "lorem ipsum"', async () => {
      const res = await request(app)
        .post('/workspaces/test-ws-id/analyze-company')
        .send({
          name: 'test',
          website: 'https://legitcompany.com',
          short_description: 'We build autonomous agent infrastructure for developers.',
          target_customer: 'Software engineering teams',
          biggest_problems: 'High latency in agent workflows',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/placeholder|test text/i);
    });

    it('successfully accepts valid, meaningful business context', async () => {
      const res = await request(app)
        .post('/workspaces/test-ws-id/analyze-company')
        .send({
          name: 'NovaDesk AI',
          website: 'https://novadesk.io',
          industry: 'B2B Customer Support',
          short_description: 'Automated 24/7 customer support agents that resolve tickets across Zendesk and Slack.',
          target_customer: 'Mid-market SaaS companies with lean support teams',
          primary_market: 'Global / North America',
          goals: 'Reduce first response time to under 60 seconds and automate 70% of tier 1 tickets.',
          biggest_problems: 'Support ticket backlogs during non-working hours and weekend coverage gaps.',
        });

      expect(res.status).toBe(200);
    });
  });
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import apiRoutes from './api';
import { startScheduler } from './workflows/scheduler';
import crypto from 'crypto';
import { assertProductionConfig } from './utils/configValidator';

dotenv.config();
assertProductionConfig();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const port = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production, restrict to explicit allowed origin(s).
// In development, allow localhost:5173 by default.
const rawOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  // Automatically support www. and non-www variants to prevent CORS errors
  const allowedOrigins = new Set(rawOrigins);
  for (const origin of rawOrigins) {
    if (origin.startsWith('https://itwield.com')) allowedOrigins.add('https://www.itwield.com');
    if (origin.startsWith('https://www.itwield.com')) allowedOrigins.add('https://itwield.com');
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      
      // Do not throw a synchronous 500 error for bad CORS! Let it cleanly fail CORS.
      return callback(null, false);
    },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-request-id']
}));

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0'); // Browsers have their own CSP; legacy header disabled
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Global baseline rate-limiting: 5,000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health',
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply rate limiting to all requests
app.use(globalLimiter);

// ─── Body Size Limits ─────────────────────────────────────────────────────────
// Default express.json() allows 100kb. Webhooks get their own smaller limit.
app.use('/api/v1/webhooks', express.json({ limit: '64kb' }));
app.use(express.json({ limit: '512kb' }));

// ─── Request ID + Structured Logger ───────────────────────────────────────────
app.use((req: any, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  // Log method + path only — never log full body (may contain tokens)
  console.log(JSON.stringify({ ts: new Date().toISOString(), requestId, method: req.method, path: req.path }));
  next();
});


// Register Workflow Actions
import { ActionRegistry } from './workflows/actions/ActionRegistry';
import { HttpAction } from './workflows/actions/HttpAction';
import { AiAgentAction } from './workflows/actions/AiAgentAction';
import { ConditionAction } from './workflows/actions/ConditionAction';
import { SendEmailAction } from './workflows/actions/SendEmailAction';
import { StoreDataAction } from './workflows/actions/StoreDataAction';
import { TransformDataAction } from './workflows/actions/TransformDataAction';
import { SlackSendMessageAction } from './workflows/actions/SlackSendMessageAction';
import { DiscordSendMessageAction } from './workflows/actions/DiscordSendMessageAction';
import { GoogleSheetsAddRowAction } from './workflows/actions/GoogleSheetsAddRowAction';
import { GoogleSheetsFindRowAction } from './workflows/actions/GoogleSheetsFindRowAction';
import { GoogleSheetsUpdateRowAction } from './workflows/actions/GoogleSheetsUpdateRowAction';

import { HealthCheckAction } from './workflows/actions/HealthCheckAction';

ActionRegistry.register(new HttpAction());
ActionRegistry.register(new AiAgentAction());
ActionRegistry.register(new ConditionAction());
ActionRegistry.register(new SendEmailAction());
ActionRegistry.register(new StoreDataAction());
ActionRegistry.register(new TransformDataAction());
import { OutreachDraftingAction } from './workflows/actions/OutreachDraftingAction';
ActionRegistry.register(new OutreachDraftingAction());
import { AwaitOutreachApprovalsAction } from './workflows/actions/AwaitOutreachApprovalsAction';
ActionRegistry.register(new AwaitOutreachApprovalsAction());


ActionRegistry.register(new SlackSendMessageAction());
ActionRegistry.register(new DiscordSendMessageAction());
ActionRegistry.register(new GoogleSheetsAddRowAction());
ActionRegistry.register(new GoogleSheetsFindRowAction());
ActionRegistry.register(new GoogleSheetsUpdateRowAction());
ActionRegistry.register(new HealthCheckAction());

import { WebResearchAction } from './workflows/actions/WebResearchAction';
import { LeadResearchAction } from './workflows/actions/LeadResearchAction';
import { CompetitorResearchAction } from './workflows/actions/CompetitorResearchAction';
import { GenerateBusinessReportAction } from './workflows/actions/GenerateBusinessReportAction';
import { CompetitorAnalysisAction } from './workflows/actions/CompetitorAnalysisAction';
import { GithubGetRepositoryActivityAction } from './workflows/actions/GithubGetRepositoryActivityAction';
import { SlackReadChannelAction } from './workflows/actions/SlackReadChannelAction';
import { GitHubPullRequestAction } from './workflows/actions/GitHubPullRequestAction';
import { GithubReadFileAction } from './workflows/actions/GithubReadFileAction';

ActionRegistry.register(new WebResearchAction());
ActionRegistry.register(new LeadResearchAction());
ActionRegistry.register(new CompetitorResearchAction());
ActionRegistry.register(new GenerateBusinessReportAction());
ActionRegistry.register(new CompetitorAnalysisAction());
ActionRegistry.register(new GithubGetRepositoryActivityAction());
ActionRegistry.register(new GitHubPullRequestAction());
ActionRegistry.register(new GithubReadFileAction());
ActionRegistry.register(new SlackReadChannelAction());


app.use('/api/v1', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start scheduler
startScheduler();

app.listen(port, () => {
  console.log(`ItWield backend running on port ${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('WARN: SUPABASE_URL and/or SUPABASE_SERVICE_KEY missing. Falling back to in-memory mock DB.');
  }
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.warn('WARN: OPENAI_API_KEY missing. Falling back to MockProvider for AI.');
  }
});


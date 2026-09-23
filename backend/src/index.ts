import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api';
import { startScheduler } from './workflows/scheduler';
import crypto from 'crypto';
import { assertProductionConfig } from './utils/configValidator';

dotenv.config();
assertProductionConfig();

const app = express();

const port = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production, restrict to explicit allowed origin(s).
// In development, allow localhost:5173 by default.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, health checks, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
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
ActionRegistry.register(new SlackSendMessageAction());
ActionRegistry.register(new DiscordSendMessageAction());
ActionRegistry.register(new GoogleSheetsAddRowAction());
ActionRegistry.register(new GoogleSheetsFindRowAction());
ActionRegistry.register(new GoogleSheetsUpdateRowAction());
ActionRegistry.register(new HealthCheckAction());


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
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARN: OPENAI_API_KEY missing. Falling back to MockProvider for AI.');
  }
});

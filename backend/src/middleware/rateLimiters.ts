import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for AI Chat & LLM operations (30 req / 5 min per user/IP)
 */
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip || 'anonymous',
  message: { error: 'Too many AI requests. Please wait a moment before sending more messages.' }
});

/**
 * Rate limiter for Payment / Subscription creations (10 req / 10 min per user/IP)
 */
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip || 'anonymous',
  message: { error: 'Payment request limit reached. Please wait 10 minutes before retrying.' }
});

/**
 * Rate limiter for file uploads to Knowledge Base (10 uploads / 15 min per user/IP)
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip || 'anonymous',
  message: { error: 'Upload limit reached. Maximum 10 documents per 15 minutes.' }
});

/**
 * Rate limiter for Auth endpoints (10 attempts / 15 min per IP)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.ip || 'anonymous',
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

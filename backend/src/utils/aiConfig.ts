export function ensureAIProvider() {
  if (!process.env.OPENROUTER_API_KEY && !process.env.VITEST && process.env.NODE_ENV !== 'test') {
    throw new Error('LLM_AUTH_REQUIRED');
  }
}
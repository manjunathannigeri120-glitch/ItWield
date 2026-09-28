export function ensureAIProvider() {
  if (process.env.NODE_ENV === 'production' && !process.env.OPENROUTER_API_KEY) {
    throw new Error('AI provider configuration is unavailable.');
  }
}
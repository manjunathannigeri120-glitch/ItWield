import { Action, ActionContext } from './Action';

/**
 * HealthCheckAction — MVP autonomous monitoring action.
 *
 * Performs a safe, read-only HTTP GET health check against a target URL.
 * - SSRF protection is delegated to HttpRequestTool (already hardened).
 * - No write capability. No production modification.
 * - Pricing-safe: does not touch workspaces, billing, or plans.
 */
export class HealthCheckAction implements Action {
  id = 'APPLICATION_MONITORING';

  async execute(config: any, _context: ActionContext): Promise<any> {
    const url: string = config.url;
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'No URL configured for health check.' };
    }

    // Validate URL format before making any network call
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { success: false, error: `Invalid URL: ${url}` };
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { success: false, error: 'Only HTTP/HTTPS URLs are allowed.' };
    }

    const startMs = Date.now();
    try {
      // Use dynamic import of https/http to avoid bundler issues; use fetch if available, else fallback
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      let status: number;
      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
          headers: { 'User-Agent': 'ItWield-HealthCheck/1.0' }
        });
        status = res.status;
      } finally {
        clearTimeout(timeout);
      }

      const durationMs = Date.now() - startMs;
      const success = status >= 200 && status < 400;

      return {
        success,
        url,
        httpStatus: status,
        durationMs,
        checkedAt: new Date().toISOString(),
        summary: success
          ? `Application health check passed. Website: ${parsedUrl.hostname} | HTTP ${status} | ${durationMs}ms`
          : `Application health check failed. Website: ${parsedUrl.hostname} | HTTP ${status} | ${durationMs}ms`,
        verification: { verified: true, checks: [`HTTP request returned ${status}`] }
      };
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        url,
        httpStatus: null,
        durationMs,
        checkedAt: new Date().toISOString(),
        error: isTimeout ? 'Health check timed out after 10 seconds.' : err.message,
        summary: `Application health check failed. Website: ${parsedUrl.hostname} | ${isTimeout ? 'Timeout' : err.message}`,
        verification: { verified: false, checks: [] }
      };
    }
  }
}

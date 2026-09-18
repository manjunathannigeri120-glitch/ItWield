/**
 * V1.3: Shared fetch wrapper with AbortController-based timeout.
 * Used by all integration actions to prevent indefinite hangs.
 */

export const DEFAULT_ACTION_TIMEOUT_MS = 15_000; // 15 seconds

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_ACTION_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`PROVIDER_TIMEOUT: Request to ${new URL(url).hostname} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

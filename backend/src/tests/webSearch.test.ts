import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSearchTool } from '../tools/webSearch';
import { TavilySearchProvider } from '../services/webSearchProvider';

describe('WebSearchTool', () => {
  const mockContext = { workspaceId: 'ws1', userId: 'u1', runId: 'r1' };

  it('rejects invalid input', async () => {
    const tool = new WebSearchTool();
    await expect(tool.execute({ wrong_arg: 'test' }, mockContext)).rejects.toThrow();
  });

  // Note: Detailed testing of the execution requires mocking getSearchProvider.
  // The actual Tavily provider is also tested below.
});

describe('TavilySearchProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('handles provider success', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [{ title: 'Test', url: 'http://test.com', content: 'content' }]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new TavilySearchProvider('key');
    const result = await provider.search('test query');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test');
  });

  it('handles provider failure', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Bad Request'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new TavilySearchProvider('key');
    await expect(provider.search('test')).rejects.toThrow('Tavily search failed: Bad Request');
  });

  it('aborts on timeout', async () => {
    const timeoutError = new Error('AbortError');
    timeoutError.name = 'AbortError';
    (global.fetch as any).mockRejectedValue(timeoutError);

    const provider = new TavilySearchProvider('key');
    await expect(provider.search('test')).rejects.toThrow('Web search timed out');
  });
});

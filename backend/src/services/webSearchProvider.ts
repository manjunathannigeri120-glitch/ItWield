import dotenv from 'dotenv';
dotenv.config();

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface WebSearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

export class MockSearchProvider implements WebSearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    await new Promise(r => setTimeout(r, 1000));
    return [
      {
        title: "Mock Search Result",
        url: "https://example.com/mock",
        content: `This is a mock search result for: ${query}. Configure TAVILY_API_KEY for real results.`
      }
    ];
  }
}

export class TavilySearchProvider implements WebSearchProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    const timeoutMs = process.env.WEB_SEARCH_TIMEOUT_MS ? parseInt(process.env.WEB_SEARCH_TIMEOUT_MS, 10) : 10000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          search_depth: "basic",
          max_results: 5,
          include_images: false
        }),
        signal: controller.signal as any
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Web search timed out after ${timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(id);
    }
  }
}

export function getSearchProvider(): WebSearchProvider {
  const key = process.env.TAVILY_API_KEY;
  if (key) {
    return new TavilySearchProvider(key);
  }
  return new MockSearchProvider();
}

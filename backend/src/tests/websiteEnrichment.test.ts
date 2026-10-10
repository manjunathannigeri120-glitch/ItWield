import { describe, it, expect, vi } from 'vitest';
import { WebsiteEnrichmentService } from '../services/WebsiteEnrichmentService';

describe('WebsiteEnrichmentService', () => {
  it('normalizes URLs correctly', () => {
    expect(WebsiteEnrichmentService.normalizeUrl('itwield.com')).toBe('https://itwield.com');
    expect(WebsiteEnrichmentService.normalizeUrl('http://mysite.org/app')).toBe('http://mysite.org/app');
    expect(WebsiteEnrichmentService.normalizeUrl('   https://linear.app  ')).toBe('https://linear.app');
  });

  it('blocks localhost and cloud metadata SSRF', async () => {
    await expect(WebsiteEnrichmentService.fetchHtml('http://localhost:3000')).rejects.toThrow('Localhost addresses cannot be accessed.');
    await expect(WebsiteEnrichmentService.fetchHtml('http://127.0.0.1:8080')).rejects.toThrow('Localhost addresses cannot be accessed.');
    await expect(WebsiteEnrichmentService.fetchHtml('http://169.254.169.254/latest/meta-data')).rejects.toThrow('Cloud metadata endpoints are restricted.');
  });

  it('extracts metadata from HTML accurately', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ItWield - Autonomous AI Executive Team for Startups</title>
          <meta name="description" content="Deploy an autonomous AI CMO and AI SDR with human-in-the-loop approvals." />
          <meta property="og:site_name" content="ItWield" />
          <meta property="og:title" content="ItWield AI Platform" />
          <link rel="icon" href="/favicon.png" />
        </head>
        <body>
          <h1>Autonomous Executive Operations</h1>
          <h2>Founder Approvals Center</h2>
          <p>ItWield empowers founders to run growth campaigns with supervised autonomous workflows.</p>
        </body>
      </html>
    `;

    const metadata = WebsiteEnrichmentService.extractMetadata(html, 'https://itwield.com');
    expect(metadata.title).toBe('ItWield - Autonomous AI Executive Team for Startups');
    expect(metadata.metaDescription).toBe('Deploy an autonomous AI CMO and AI SDR with human-in-the-loop approvals.');
    expect(metadata.ogSiteName).toBe('ItWield');
    expect(metadata.faviconUrl).toBe('https://itwield.com/favicon.png');
    expect(metadata.headings).toContain('Autonomous Executive Operations');
    expect(metadata.bodyText).toContain('Founder Approvals Center');
  });

  it('rejects parked domains and blank pages', () => {
    const blankMetadata = {
      title: 'Blank',
      metaDescription: '',
      ogTitle: '',
      ogSiteName: '',
      ogDescription: '',
      faviconUrl: '',
      headings: [],
      bodyText: 'Under Construction'
    };

    expect(() => WebsiteEnrichmentService.checkContentIntegrity(blankMetadata)).toThrow();
  });
});

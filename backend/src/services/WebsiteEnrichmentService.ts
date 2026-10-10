import axios from 'axios';
import http from 'http';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';
import OpenAI from 'openai';
import { isPrivateIP } from '../utils/ssrfProtection';
import { validateTextMeaning } from '../utils/gibberishValidator';

const lookupAsync = promisify(dns.lookup);

export interface EnrichedWebsiteData {
  name: string;
  website: string;
  short_description: string;
  industry: string;
  target_customer: string;
  primary_market: string;
  biggest_problems: string;
  goals: string;
  logo_url?: string;
}

const safeLookup = (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
) => {
  let cb = callback;
  let opts = options;
  if (typeof options === 'function') {
    cb = options;
    opts = {};
  }

  dns.lookup(hostname, opts, async (err, address, family) => {
    if (err) return cb(err, address, family);

    let checkAddr = '';
    if (typeof address === 'string') {
      checkAddr = address;
    } else if (Array.isArray(address as any) && (address as any).length > 0) {
      checkAddr = (address as any)[0].address;
    }

    if (checkAddr && (await isPrivateIP(checkAddr))) {
      return cb(new Error('Blocked: Resolves to private IP'), address, family);
    }

    cb(null, address, family);
  });
};

const httpAgent = new http.Agent({ lookup: safeLookup as any });
const httpsAgent = new https.Agent({ lookup: safeLookup as any });

export class WebsiteEnrichmentService {
  /**
   * Normalizes a user-entered URL (adds https:// if missing, removes trailing spaces/slashes).
   */
  static normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url;
  }

  /**
   * Fetches the website HTML safely with SSRF protection, timeout, and redirect handling.
   */
  static async fetchHtml(urlStr: string): Promise<{ html: string; finalUrl: string }> {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS URLs are supported.');
    }

    if (parsed.hostname.toLowerCase() === 'localhost' || parsed.hostname === '127.0.0.1') {
      throw new Error('Localhost addresses cannot be accessed.');
    }

    if (parsed.hostname === '169.254.169.254') {
      throw new Error('Cloud metadata endpoints are restricted.');
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 ItWieldBot/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    let response;
    try {
      response = await axios.get(urlStr, {
        timeout: 8000,
        maxContentLength: 3000000, // 3MB limit
        responseType: 'text',
        maxRedirects: 3,
        httpAgent,
        httpsAgent,
        headers,
        validateStatus: (status) => status >= 200 && status < 400,
      });
    } catch (err: any) {
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        throw new Error(`Domain not found. Please check that "${parsed.hostname}" exists and is spelled correctly.`);
      }
      if (err.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused by "${parsed.hostname}". The server might be down.`);
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new Error(`Website took too long to respond (timeout). Please try again.`);
      }
      if (err.response?.status === 404) {
        throw new Error(`Website returned a 404 Not Found error.`);
      }
      if (err.response?.status >= 500) {
        throw new Error(`Website returned a server error (${err.response.status}).`);
      }
      throw new Error(err.message || 'Could not reach the website.');
    }

    return {
      html: response.data as string,
      finalUrl: response.request?.res?.responseUrl || urlStr,
    };
  }

  /**
   * Parses raw HTML into structured metadata and extracts clean visible text.
   */
  static extractMetadata(html: string, baseUrl: string) {
    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Meta Description
    const metaDescMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    // OG Title & Description
    const ogTitleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';

    const ogSiteNameMatch =
      html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:site_name["']/i);
    const ogSiteName = ogSiteNameMatch ? ogSiteNameMatch[1].trim() : '';

    const ogDescMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';

    // Favicon / Logo
    let faviconUrl = '';
    const iconMatch =
      html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
    if (iconMatch && iconMatch[1]) {
      try {
        faviconUrl = new URL(iconMatch[1], baseUrl).toString();
      } catch (e) {
        faviconUrl = '';
      }
    }
    if (!faviconUrl) {
      try {
        faviconUrl = new URL('/favicon.ico', baseUrl).toString();
      } catch (e) {}
    }

    // Headings
    const headings: string[] = [];
    const hMatches = html.matchAll(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi);
    for (const match of hMatches) {
      const cleanH = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanH.length > 2 && cleanH.length < 150) {
        headings.push(cleanH);
      }
      if (headings.length >= 8) break;
    }

    // Body visible text (stripped)
    let bodyText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (bodyText.length > 4000) {
      bodyText = bodyText.substring(0, 4000);
    }

    return {
      title,
      metaDescription,
      ogTitle,
      ogSiteName,
      ogDescription,
      faviconUrl,
      headings: headings.slice(0, 5),
      bodyText,
    };
  }

  /**
   * Detects parked domains, empty placeholders, or gibberish pages.
   */
  static checkContentIntegrity(metadata: ReturnType<typeof WebsiteEnrichmentService.extractMetadata>) {
    const fullContent = `${metadata.title} ${metadata.metaDescription} ${metadata.bodyText}`.toLowerCase();

    // Check minimum content length
    if (fullContent.trim().length < 40) {
      throw new Error(
        'The website exists but contains little or no readable content. Please enter details manually.'
      );
    }

    // Check parked domain keywords
    const parkedKeywords = [
      'buy this domain',
      'domain is for sale',
      'this domain is parked',
      'domain name has been reserved',
      'under construction',
      'default web site page',
      'apache2 ubuntu default page',
      'welcome to nginx',
      'renew your domain',
    ];

    for (const keyword of parkedKeywords) {
      if (fullContent.includes(keyword) && fullContent.length < 500) {
        throw new Error(
          `This domain appears to be parked, inactive, or under construction (${keyword}). Please provide an active website.`
        );
      }
    }
  }

  /**
   * Uses AI (OpenRouter / GPT-4o-mini) to synthesize clean company context from extracted text.
   */
  static async synthesizeCompanyProfile(
    metadata: ReturnType<typeof WebsiteEnrichmentService.extractMetadata>,
    websiteUrl: string
  ): Promise<EnrichedWebsiteData> {
    const parsedUrl = new URL(websiteUrl);
    const domainFallback = parsedUrl.hostname.replace(/^www\./i, '').split('.')[0];
    const capitalizedFallbackName =
      domainFallback.charAt(0).toUpperCase() + domainFallback.slice(1);

    // Prepare Heuristic Fallback
    const cleanTitle = (metadata.ogSiteName || metadata.ogTitle || metadata.title)
      .split(/[-|•—:]/)[0]
      .trim() || capitalizedFallbackName;

    const fallbackDescription =
      metadata.ogDescription ||
      metadata.metaDescription ||
      (metadata.headings.length > 0 ? metadata.headings.join('. ') : '') ||
      metadata.bodyText.substring(0, 160) + '...';

    const fallbackData: EnrichedWebsiteData = {
      name: cleanTitle,
      website: websiteUrl,
      short_description: fallbackDescription.substring(0, 250),
      industry: 'Technology / B2B SaaS',
      target_customer: 'Startup founders, growth teams, and business owners',
      primary_market: 'Global, English-speaking',
      biggest_problems: 'Manual operations, slow pipeline growth, and high operational overhead',
      goals: 'Automate sales outreach, scale marketing campaigns, and acquire qualified customers',
      logo_url: metadata.faviconUrl,
    };

    // If OpenRouter is configured, leverage AI for deep semantic extraction
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const client = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY,
        });

        const prompt = `Analyze this website data and extract structured company profile fields for an AI management workspace.
Website URL: ${websiteUrl}
Title: ${metadata.title}
Site Name: ${metadata.ogSiteName}
Meta Description: ${metadata.metaDescription || metadata.ogDescription}
Key Headings: ${metadata.headings.join(' | ')}
Body Content: ${metadata.bodyText.substring(0, 2500)}

Respond strictly with a JSON object:
{
  "name": "Clean brand or company name (without taglines or SEO suffixes)",
  "short_description": "Precise 1-2 sentence description explaining what the company/product does and its value proposition",
  "industry": "Industry or category (e.g. B2B SaaS, E-Commerce, Developer Tools, Marketing Agency, AI & Automation, FinTech, Healthcare)",
  "target_customer": "Ideal customer profile (e.g. Early-stage founders, B2B sales reps, Mid-market agencies, E-commerce store owners)",
  "primary_market": "Primary market or geography (e.g. Global, North America, English-speaking)",
  "biggest_problems": "1-2 primary pain points or business constraints this company helps solve or faces",
  "goals": "1-2 strategic growth goals for this company",
  "is_meaningful_business": true,
  "gibberish_detected": false
}`;

        const response = await client.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert SaaS business analyst. You extract clean, authentic business facts and detect meaningless or spam websites. Output ONLY valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });

        const parsedContent = JSON.parse(
          response.choices[0]?.message?.content || '{}'
        );

        if (parsedContent.gibberish_detected || parsedContent.is_meaningful_business === false) {
          throw new Error('The website does not appear to contain a meaningful business or product.');
        }

        if (parsedContent.name && parsedContent.short_description) {
          return {
            name: parsedContent.name.trim(),
            website: websiteUrl,
            short_description: parsedContent.short_description.trim(),
            industry: parsedContent.industry?.trim() || fallbackData.industry,
            target_customer: parsedContent.target_customer?.trim() || fallbackData.target_customer,
            primary_market: parsedContent.primary_market?.trim() || fallbackData.primary_market,
            biggest_problems: parsedContent.biggest_problems?.trim() || fallbackData.biggest_problems,
            goals: parsedContent.goals?.trim() || fallbackData.goals,
            logo_url: metadata.faviconUrl,
          };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('meaningful business')) {
          throw err;
        }
        console.warn('AI enrichment fallback used:', err.message);
      }
    }

    return fallbackData;
  }

  /**
   * Main entry point: validates URL, fetches HTML, checks integrity, and returns enriched data.
   */
  static async enrichFromUrl(rawUrl: string): Promise<EnrichedWebsiteData> {
    const normalizedUrl = this.normalizeUrl(rawUrl);

    // Validate URL syntax
    try {
      new URL(normalizedUrl);
    } catch (e) {
      throw new Error('Please enter a valid website URL (e.g. https://yourcompany.com).');
    }

    // Fetch HTML
    const { html, finalUrl } = await this.fetchHtml(normalizedUrl);

    // Extract metadata
    const metadata = this.extractMetadata(html, finalUrl);

    // Check integrity & parked domains
    this.checkContentIntegrity(metadata);

    // Synthesize structured company profile
    const enriched = await this.synthesizeCompanyProfile(metadata, finalUrl);

    // Validate synthesized fields against gibberish
    const nameValidation = validateTextMeaning(enriched.name, {
      minChars: 2,
      minWords: 1,
      fieldName: 'Company Name',
    });
    if (!nameValidation.isValid) {
      throw new Error(`Invalid extracted company name: ${nameValidation.reason}`);
    }

    const descValidation = validateTextMeaning(enriched.short_description, {
      minChars: 10,
      minWords: 2,
      fieldName: 'Description',
    });
    if (!descValidation.isValid) {
      throw new Error(`Invalid extracted description: ${descValidation.reason}`);
    }

    return enriched;
  }
}

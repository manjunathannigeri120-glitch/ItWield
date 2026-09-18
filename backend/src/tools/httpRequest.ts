import { z } from 'zod';
import { Tool, ToolContext } from './Tool';
import axios from 'axios';
import dns from 'dns/promises';
import { URL } from 'url';

export class HttpRequestTool extends Tool {
  name = 'http_request';
  description = 'Fetch data or post data to a remote URL securely.';
  
  schema = z.object({
    url: z.string().describe('The absolute URL to request.'),
    method: z.string().describe('HTTP method, e.g. GET or POST'),
    headers: z.record(z.string(), z.string()).optional().describe('Optional HTTP headers'),
    body: z.string().optional().describe('Optional JSON body string for POST requests.')
  });

  async execute(args: any, context: ToolContext): Promise<any> {
    const { url, method, headers, body } = this.schema.parse(args);

    let currentUrl = url;
    let redirects = 0;
    const MAX_REDIRECTS = 3;
    let finalResponse: any = null;

    while (redirects <= MAX_REDIRECTS) {
      // 1. SSRF URL Validation
      let parsedUrl;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (e) {
        return { error: `Invalid URL format: ${currentUrl}` };
      }

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { error: 'Only HTTP and HTTPS protocols are allowed.' };
      }

      // Check if hostname resolves to a private IP
      try {
        const lookup = await dns.lookup(parsedUrl.hostname);
        if (this.isPrivateIP(lookup.address)) {
          return { error: `SSRF blocked: Hostname resolves to a private or blocked IP address (${lookup.address})` };
        }
      } catch (e) {
        return { error: 'Failed to resolve hostname.' };
      }

      // 2. Execute Request (without automatic redirects)
      try {
        const axiosConfig: any = {
          url: currentUrl,
          method: method.toUpperCase(),
          headers: headers || {},
          timeout: 10000, // 10s timeout
          maxRedirects: 0, // We handle redirects manually for SSRF safety
          validateStatus: (status: number) => status < 500 // Don't throw on 3xx or 4xx
        };

        if (axiosConfig.method === 'POST' && body) {
          try {
            axiosConfig.data = JSON.parse(body);
          } catch (e) {
            axiosConfig.data = body;
          }
        }

        const response = await axios(axiosConfig);

        // Check if redirect
        if (response.status >= 300 && response.status < 400 && response.headers.location) {
          redirects++;
          if (redirects > MAX_REDIRECTS) {
            return { error: 'Too many redirects.' };
          }
          currentUrl = new URL(response.headers.location, currentUrl).toString();
          continue; // loop again to validate the new URL
        }

        finalResponse = response;
        break; // Request successful, not a redirect
      } catch (error: any) {
        return { error: `HTTP request failed: ${error.message}` };
      }
    }

    if (!finalResponse) {
      return { error: 'Request failed to return a response.' };
    }

    // 3. Size enforcement
    let dataStr = typeof finalResponse.data === 'object' 
      ? JSON.stringify(finalResponse.data) 
      : String(finalResponse.data);

    const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2MB
    if (Buffer.byteLength(dataStr, 'utf-8') > MAX_RESPONSE_SIZE) {
      return { error: 'Response exceeded maximum allowed size (2MB).' };
    }

    // Truncate to 20k chars for LLM context safety
    if (dataStr.length > 20000) {
      dataStr = dataStr.substring(0, 20000) + '... [TRUNCATED]';
    }

    return { status: finalResponse.status, data: dataStr };
  }

  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length === 4) { // IPv4
      if (parts[0] === '10') return true;
      if (parts[0] === '127') return true;
      if (parts[0] === '169' && parts[1] === '254') return true;
      if (parts[0] === '172' && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) return true;
      if (parts[0] === '192' && parts[1] === '168') return true;
      if (parts[0] === '0') return true; // 0.0.0.0
    } else if (ip.includes(':')) { // IPv6
      if (ip === '::1') return true;
      if (ip.toLowerCase().startsWith('fe80')) return true;
      if (ip.toLowerCase().startsWith('fc00') || ip.toLowerCase().startsWith('fd')) return true;
    }
    return false;
  }
}

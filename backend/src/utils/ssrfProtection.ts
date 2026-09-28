import dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';
import http from 'http';
import https from 'https';

const lookupAsync = promisify(dns.lookup);

export async function isPrivateIP(ip: string): Promise<boolean> {
    if (ip === '::1') return true;
    if (ip.startsWith('fc00:') || ip.startsWith('fd')) return true; // Unique local
    if (ip.startsWith('fe80:')) return true; // Link local

    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16
    if (parts[0] === 0) return true; // 0.0.0.0
    return false;
}

const safeLookup = async (hostname: string, options: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
    try {
        const result = await lookupAsync(hostname, options);
        let address = '';
        let family = 4;
        
        if (typeof result === 'string') {
            address = result;
        } else if (Array.isArray(result) && result.length > 0) {
            address = result[0].address;
            family = result[0].family;
        } else if (result && typeof result === 'object' && 'address' in result) {
            address = (result as any).address;
            family = (result as any).family;
        }

        if (await isPrivateIP(address)) {
            return callback(new Error('Blocked: Resolves to private IP'), '', 4);
        }
        callback(null, address, family);
    } catch (err: any) {
        callback(err, '', 4);
    }
};

const httpAgent = new http.Agent({ lookup: safeLookup as any });
const httpsAgent = new https.Agent({ lookup: safeLookup as any });

export async function safeFetch(urlStr: string): Promise<string> {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Invalid protocol. Only HTTP/HTTPS allowed.');
    }
    
    if (url.hostname === '169.254.169.254') {
        throw new Error('Blocked: Metadata IP');
    }
    if (url.hostname.toLowerCase() === 'localhost') {
        throw new Error('Blocked: Localhost');
    }

    const response = await axios.get(urlStr, {
        timeout: 5000,
        maxContentLength: 2000000, // 2MB max
        responseType: 'text',
        maxRedirects: 0, // Block redirects by default to prevent redirect-to-private bypass
        httpAgent,
        httpsAgent,
        validateStatus: (status) => status >= 200 && status < 400
    });

    if (response.status >= 300 && response.status < 400) {
        // We only allow 1 hop manually
        const location = response.headers.location;
        if (!location) throw new Error('Redirect with no location');
        const nextUrl = new URL(location, urlStr);
        
        const res2 = await axios.get(nextUrl.toString(), {
            timeout: 5000,
            maxContentLength: 2000000,
            responseType: 'text',
            maxRedirects: 0,
            httpAgent,
            httpsAgent
        });
        response.data = res2.data;
        response.headers = res2.headers;
    }

    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/json')) {
        throw new Error('Blocked: Invalid content type. Expected text/html or text/plain.');
    }

    let text = response.data;
    if (typeof text === 'string') {
        text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        text = text.replace(/<[^>]+>/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        if (text.length > 20000) {
            text = text.substring(0, 20000);
        }
    } else {
        text = JSON.stringify(text).substring(0, 20000);
    }

    return text;
}

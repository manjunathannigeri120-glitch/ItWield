import dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';

const lookupAsync = promisify(dns.lookup);

export async function isPrivateIP(ip: string): Promise<boolean> {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16
    return false;
}

export async function safeFetch(urlStr: string): Promise<string> {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Invalid protocol. Only HTTP/HTTPS allowed.');
    }
    
    let lookup;
    try {
        lookup = await lookupAsync(url.hostname);
    } catch (e) {
        throw new Error('DNS resolution failed');
    }

    if (await isPrivateIP(lookup.address)) {
        throw new Error('Blocked: Resolves to private IP');
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
        maxRedirects: 2
    });

    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/json')) {
        throw new Error('Blocked: Invalid content type. Expected text/html or text/plain.');
    }

    // Strip HTML minimally to save tokens
    let text = response.data;
    if (typeof text === 'string') {
        // Basic HTML tag stripping
        text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        text = text.replace(/<[^>]+>/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        // Bound to ~20,000 characters
        if (text.length > 20000) {
            text = text.substring(0, 20000);
        }
    } else {
        text = JSON.stringify(text).substring(0, 20000);
    }

    return text;
}


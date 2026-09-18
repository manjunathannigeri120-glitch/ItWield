import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY;

  if (!keyStr) {
    if (process.env.NODE_ENV === 'production') {
      // Hard-fail in production — do not silently use a default key
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Development only: use a deterministic dev key and warn loudly
    console.warn('[SECURITY] ENCRYPTION_KEY not set. Using dev-only key. DO NOT use in production.');
    return crypto.createHash('sha256').update('dev-only-insecure-key-do-not-use').digest();
  }

  // Always hash to get exactly 32 bytes, regardless of input length or encoding
  return crypto.createHash('sha256').update(keyStr).digest();
}

export function encryptString(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptString(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function encryptObject(obj: any): string {
  return encryptString(JSON.stringify(obj));
}

export function decryptObject(encryptedText: string): any {
  return JSON.parse(decryptString(encryptedText));
}

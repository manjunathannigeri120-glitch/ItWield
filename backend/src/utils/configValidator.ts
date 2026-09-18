#!/usr/bin/env node
/**
 * V1.3: Production configuration validator
 * Run at startup to validate required environment variables.
 * Call validateProductionConfig() before starting the server.
 */

interface ConfigVar {
  name: string;
  required: boolean;
  description: string;
  validate?: (val: string) => string | null; // returns error message or null
}

const CONFIG_VARS: ConfigVar[] = [
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validate: (v) => v.startsWith('https://') ? null : 'Must be an HTTPS URL'
  },
  {
    name: 'SUPABASE_SERVICE_KEY',
    required: true,
    description: 'Supabase service role key (SERVER ONLY - never expose to frontend)'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (safe for frontend)'
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    description: 'AES-256-GCM encryption key for credentials. WARNING: losing this key makes stored credentials unrecoverable.',
    validate: (v) => v.length >= 16 ? null : 'Must be at least 16 characters'
  },
  {
    name: 'ALLOWED_ORIGINS',
    required: true,
    description: 'Comma-separated list of allowed CORS origins (e.g. https://yourdomain.com)',
    validate: (v) => {
      if (v === '*') return 'Wildcard origin (*) is not allowed in production';
      return null;
    }
  },
  {
    name: 'FRONTEND_URL',
    required: true,
    description: 'Frontend base URL for OAuth redirect URIs',
    validate: (v) => v.startsWith('https://') ? null : 'Must be an HTTPS URL in production'
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI workflow generation. If absent, AI generation uses mock mode.'
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID (required for Google Sheets integration)'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret (SERVER ONLY)'
  },
  {
    name: 'SLACK_CLIENT_ID',
    required: false,
    description: 'Slack OAuth client ID (required for Slack integration)'
  },
  {
    name: 'SLACK_CLIENT_SECRET',
    required: false,
    description: 'Slack OAuth client secret (SERVER ONLY)'
  },
  {
    name: 'DISCORD_CLIENT_ID',
    required: false,
    description: 'Discord OAuth client ID (required for Discord integration)'
  },
  {
    name: 'DISCORD_CLIENT_SECRET',
    required: false,
    description: 'Discord OAuth client secret (SERVER ONLY)'
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for sending emails'
  },
  {
    name: 'PORT',
    required: false,
    description: 'Backend server port (default: 3000)'
  }
];

export interface ConfigCheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductionConfig(): ConfigCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const configVar of CONFIG_VARS) {
    const value = process.env[configVar.name];

    if (!value) {
      if (configVar.required && isProduction) {
        errors.push(`MISSING REQUIRED: ${configVar.name} — ${configVar.description}`);
      } else if (!configVar.required) {
        warnings.push(`OPTIONAL NOT SET: ${configVar.name} — ${configVar.description}`);
      }
      continue;
    }

    if (configVar.validate) {
      const validationError = configVar.validate(value);
      if (validationError) {
        if (isProduction) {
          errors.push(`INVALID ${configVar.name}: ${validationError}`);
        } else {
          warnings.push(`CONFIG WARNING ${configVar.name}: ${validationError}`);
        }
      }
    }
  }

  // Production-specific additional checks
  if (isProduction) {
    if (!process.env.SUPABASE_URL?.includes('supabase.co') && !process.env.SUPABASE_URL?.startsWith('https://')) {
      warnings.push('SUPABASE_URL does not look like a production Supabase URL');
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Call this at server startup. In production, will exit if critical config is missing.
 */
export function assertProductionConfig(): void {
  const result = validateProductionConfig();

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[Config] WARN: ${w}`);
    }
  }

  if (!result.ok) {
    console.error('[Config] FATAL: Production configuration is invalid:');
    for (const e of result.errors) {
      console.error(`  ✗ ${e}`);
    }
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.log('[Config] Production configuration validated ✓');
  }
}

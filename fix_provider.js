const fs = require('fs');
let provider = fs.readFileSync('backend/src/ai/providerFactory.ts', 'utf8');

provider = provider.replace('let attempt = 0;', 'let attempt = 0;\n    let lastError: any = null;');
provider = provider.replace('const status = error?.status;', 'lastError = error;\n        const status = error?.status;');
provider = provider.replace("throw new Error('OpenRouter API failed and no fallback provider is configured or available.');", "throw new Error(`AI Provider failed: ${lastError?.message || 'Check your API Key balance'}`);");

fs.writeFileSync('backend/src/ai/providerFactory.ts', provider);

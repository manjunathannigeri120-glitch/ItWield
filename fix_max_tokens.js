const fs = require('fs');
let provider = fs.readFileSync('backend/src/ai/openaiProvider.ts', 'utf8');
provider = provider.replace('tools: tools && tools.length > 0 ? tools : undefined,', 'max_tokens: 2048,\n        tools: tools && tools.length > 0 ? tools : undefined,');
fs.writeFileSync('backend/src/ai/openaiProvider.ts', provider);

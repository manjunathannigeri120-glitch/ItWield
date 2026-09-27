const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

code = code.replace(/import OpenAI from 'openai';/g, `import { ProviderFactory } from '../ai/providerFactory';`);
code = code.replace(/const openai = new OpenAI\(\{[\s\S]*?baseURL: 'https:\/\/openrouter\.ai\/api\/v1'[\s\S]*?\}\);/g, `const provider = ProviderFactory.getInstance();`);
code = code.replace(/const response = await openai\.chat\.completions\.create\(\{[\s\S]*?model: 'openrouter\/free',[\s\S]*?messages: \[\s*\{ role: 'system', content: systemPrompt \}\s*\],[\s\S]*?response_format: \{ type: 'json_object' \}[\s\S]*?\}\);/g,
`const response = await provider.generateText([{ role: 'system', content: systemPrompt }], 'openrouter/free', undefined, undefined, { type: 'json_object' });`);

code = code.replace(/const response = await openai\.chat\.completions\.create\(\{[\s\S]*?model: 'openrouter\/free',[\s\S]*?messages: \[\s*\{ role: 'system', content: prompt \}\s*\],[\s\S]*?response_format: \{ type: 'json_object' \}[\s\S]*?\}\);/g,
`const response = await provider.generateText([{ role: 'system', content: prompt }], 'openrouter/free', undefined, undefined, { type: 'json_object' });`);

code = code.replace(/const content = response\.choices\[0\]\.message\.content \|\| '\{\}';/g, `const content = response.text || '{}';`);
code = code.replace(/ceoEvaluation = JSON\.parse\(response\.choices\[0\]\.message\.content \|\| '\{\}'\);/g, `ceoEvaluation = JSON.parse(response.text || '{}');`);

code = code.replace(/const \{ OpenAI \} = require\('openai'\);/g, '');

fs.writeFileSync('backend/src/services/CEOService.ts', code);

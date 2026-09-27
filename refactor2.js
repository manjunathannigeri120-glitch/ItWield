const fs = require('fs');
let code = fs.readFileSync('backend/src/workflows/workflowGenerator.ts', 'utf8');

code = code.replace(/import OpenAI from 'openai';/g, `import { ProviderFactory } from '../ai/providerFactory';`);

code = code.replace(/const openai = new OpenAI\(\{[\s\S]*?baseURL: 'https:\/\/openrouter\.ai\/api\/v1'[\s\S]*?\}\);/g, `const provider = ProviderFactory.getInstance();`);

code = code.replace(/const response = await openai\.chat\.completions\.create\(\{[\s\S]*?model: 'openrouter\/free',[\s\S]*?messages: \[\s*\{ role: 'system', content: systemPrompt \},\s*\{ role: 'user', content: userContent \}\s*\],[\s\S]*?response_format: \{ type: 'json_object' \},[\s\S]*?max_tokens: 4000,[\s\S]*?temperature: 0\.2[\s\S]*?\}\);/g,
`const response = await provider.generateText(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        'openrouter/free',
        0.2,
        undefined,
        { type: 'json_object' }
      );`);
      
code = code.replace(/rawContent = response\.choices\[0\]\.message\.content \|\| '';/g, `rawContent = response.text || '';`);

fs.writeFileSync('backend/src/workflows/workflowGenerator.ts', code);
console.log('Replaced workflow generator');

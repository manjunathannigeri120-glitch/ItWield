const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

// Replace first instance
code = code.replace(
    `        const response = await openai.chat.completions.create({
          model: 'openrouter/free',
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' }
        });
        const content = response.choices[0].message.content || '{}';`,
    `        const response = await provider.generateText(
          [{ role: 'system', content: systemPrompt }],
          'openrouter/free',
          undefined,
          undefined,
          { type: 'json_object' }
        );
        const content = response.text || '{}';`
);

// Replace second instance
code = code.replace(
    `const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'mock',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield CEO' }
    });`,
    `const provider = ProviderFactory.getInstance();`
);

code = code.replace(
    `        const response = await openai.chat.completions.create({
          model: 'openrouter/free',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' }
        });
        ceoEvaluation = JSON.parse(response.choices[0].message.content || '{}');`,
    `        const response = await provider.generateText(
          [{ role: 'system', content: prompt }],
          'openrouter/free',
          undefined,
          undefined,
          { type: 'json_object' }
        );
        ceoEvaluation = JSON.parse(response.text || '{}');`
);

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log('Replaced');

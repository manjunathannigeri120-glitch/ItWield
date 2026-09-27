const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/scheduler429.test.ts', 'utf8');

code = code.replace(/describe\('OpenRouter 429 Feedback Loop Fixes', \(\) => \{/g, 
`vi.mock('../ai/providerFactory', () => {
  return {
    ProviderFactory: {
      getInstance: vi.fn().mockReturnValue({
        generateText: vi.fn().mockResolvedValue({ text: '{}' })
      })
    }
  };
});

describe('OpenRouter 429 Feedback Loop Fixes', () => {`);

fs.writeFileSync('backend/src/tests/scheduler429.test.ts', code);
console.log('Fixed');

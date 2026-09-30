require('dotenv').config();
const { OpenAI } = require('openai');

async function testConnection() {
  console.log('Testing OpenRouter Connection...');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'mock',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'HTTP-Referer': 'https://itwield.com', 'X-Title': 'ItWield Validation' }
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: 'Respond with exactly: ITWIELD_LLM_CONNECTION_OK' }],
    });
    
    console.log('--- RESPONSE SUCCESS ---');
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error('--- RESPONSE FAILED ---');
    console.error(error.message);
  }
}

testConnection();

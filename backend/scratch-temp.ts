import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
  });

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      temperature: null as any
    });
    console.log('Success:', completion.choices[0].message.content);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
main();

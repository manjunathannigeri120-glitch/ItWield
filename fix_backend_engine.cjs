const fs = require('fs');

// 1. GIBBERISH FILTER IN WORKSPACES.TS
let wsFile = 'backend/src/api/workspaces.ts';
let wsContent = fs.readFileSync(wsFile, 'utf8');

const gibberishImport = `import { OpenAI } from 'openai';\n`;
if (!wsContent.includes('OpenAI')) {
    wsContent = gibberishImport + wsContent;
}

const targetPost = "const { data, error } = await req.supabase";
const gibberishLogic = `
      // --- GIBBERISH / QUALITY VALIDATOR ---
      if (req.body.operational_context && req.body.operational_context.trim().length > 0) {
        try {
          const openai = new OpenAI({ 
            apiKey: process.env.OPENROUTER_API_KEY || 'mock', 
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Validator' }
          });
          const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
          const validationPrompt = \`Analyze the following business description. Is it random gibberish/keyboard mashing, or a somewhat coherent description (even if very short)? Reply with ONLY a JSON object: {"is_valid": true/false, "reason": "..."} \\n\\nDescription: \${req.body.operational_context}\`;
          
          const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: validationPrompt }], response_format: { type: 'json_object' } });
          const text = response.choices[0].message.content.trim();
          const result = JSON.parse(text);
          if (!result.is_valid) {
             return res.status(400).json({ error: 'Please provide a real description of your business. The AI executives cannot operate on random text.' });
          }
        } catch (e) {
          console.error('Gibberish validation failed (skipping):', e);
        }
      }
      // -------------------------------------

      const { data, error } = await req.supabase`;

if (!wsContent.includes('GIBBERISH')) {
    // Only replace the first instance in POST /workspaces
    wsContent = wsContent.replace(
      /const \{ data, error \} = await req\.supabase\s*\.from\('workspaces'\)\s*\.insert/,
      (match) => gibberishLogic + "\n      .from('workspaces')\n      .insert"
    );
    fs.writeFileSync(wsFile, wsContent);
    console.log('Added Gibberish Filter');
}

// 2. COMPUTE ENGINE REFACTOR IN RUNTIME.TS
let runtimeFile = 'backend/src/agents/runtime.ts';
let runtimeContent = fs.readFileSync(runtimeFile, 'utf8');

const runtimeImport = `import { CreditService } from '../services/CreditService';\n`;
if (!runtimeContent.includes('CreditService')) {
    runtimeContent = runtimeImport + runtimeContent;
}

const loopTarget = "const result = await aiProvider.generateText(contextMessages, agent.model, agent.temperature, toolDefinitions);";
const computeLogic = `
        // --- COMPUTE CREDIT ENGINE DEDUCTION ---
        // Deduct 1 compute credit per reasoning cycle
        if (supabase) {
          const creditCheck = await CreditService.deductCredits(supabase, agent.workspace_id, 1);
          if (!creditCheck.allowed) {
             return "SYSTEM HALT: Insufficient compute credits. Your workspace has 0 AI credits remaining. Please upgrade your plan to resume autonomous operations.";
          }
        }
        // ---------------------------------------

        const result = await aiProvider.generateText(contextMessages, agent.model, agent.temperature, toolDefinitions);`;

if (!runtimeContent.includes('COMPUTE CREDIT ENGINE DEDUCTION')) {
    runtimeContent = runtimeContent.replace(loopTarget, computeLogic);
    fs.writeFileSync(runtimeFile, runtimeContent);
    console.log('Added Compute Engine to Runtime');
}

const fs = require('fs');
let file = 'backend/src/agents/runtime.ts';
let content = fs.readFileSync(file, 'utf8');

let saveUserMsg = `      // Save user message to DB
      if (supabase && userMessage) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage
        });
      }

      const aiProvider = this.getProvider();`;

content = content.replace(
  'const aiProvider = this.getProvider();',
  saveUserMsg
);

fs.writeFileSync(file, content);

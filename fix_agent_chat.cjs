const fs = require('fs');
let file = 'frontend/src/pages/AgentChat.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "setChatHistory(prev => [...prev, { role: 'ai', text: res.data.response || res.data.reply || \"No response received.\" }]);";
const fix = `
        if (res.data.credits !== undefined) {
          window.dispatchEvent(new CustomEvent('credits_updated', { detail: res.data.credits }));
        }
        ` + target;

if (!content.includes('credits_updated')) {
    content = content.replace(target, fix);
    // Add 402 check
    content = content.replace(
        "setChatHistory(prev => [...prev, { role: 'ai', text: 'I encountered an error.' }]);",
        "if (err.response?.status === 402) { setChatHistory(prev => [...prev, { role: 'ai', text: err.response.data.message }]); } else { setChatHistory(prev => [...prev, { role: 'ai', text: 'I encountered an error.' }]); }"
    );
    fs.writeFileSync(file, content);
}

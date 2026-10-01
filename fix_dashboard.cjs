const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "setChatHistory(prev => [...prev, { role: 'system', text: res.data.reply }]);";
const fix = `
        setChatHistory(prev => [...prev, { role: 'system', text: res.data.reply }]);
        if (res.data.credits !== undefined) {
          window.dispatchEvent(new CustomEvent('credits_updated', { detail: res.data.credits }));
        }
`;

if (!content.includes('credits_updated')) {
    content = content.replace(target, fix);
    content = content.replace(
        "setChatHistory(prev => [...prev, { role: 'system', text: \"I'm sorry, I encountered an error communicating with the executive team.\" }]);",
        "if (err.response?.status === 402) { setChatHistory(prev => [...prev, { role: 'system', text: err.response.data.message || 'Insufficient credits' }]); } else { setChatHistory(prev => [...prev, { role: 'system', text: \"I'm sorry, I encountered an error communicating with the executive team.\" }]); }"
    );
    fs.writeFileSync(file, content);
    console.log('Fixed Dashboard.tsx');
}

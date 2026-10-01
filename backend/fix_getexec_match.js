const fs = require('fs');
let file = 'src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const getExec = (r: string) => agents.find((a: any) => a.role === r || a.name === r);',
  'const getExec = (r: string) => agents.find((a: any) => (a.role && a.role.toUpperCase() === r.replace("AI ", "")) || (a.name && a.name.toUpperCase().includes(r.replace("AI ", ""))));'
);

// Hardcode a fallback ID just in case so the buttons are always clickable, the chat API handles it if needed
content = content.replace(/id: aiCeo\?\.id/g, 'id: aiCeo?.id || "ceo"');
content = content.replace(/id: aiCto\?\.id/g, 'id: aiCto?.id || "cto"');
content = content.replace(/id: aiCmo\?\.id/g, 'id: aiCmo?.id || "cmo"');
content = content.replace(/id: aiCoo\?\.id/g, 'id: aiCoo?.id || "coo"');
content = content.replace(/id: aiCfo\?\.id/g, 'id: aiCfo?.id || "cfo"');

fs.writeFileSync(file, content);

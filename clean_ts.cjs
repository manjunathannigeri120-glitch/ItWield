const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// We know line 28 is `const [isChatting, setIsChatting] = useState(false);`
lines = lines.filter((line) => !line.includes('const [isChatting, setIsChatting] = useState(false);'));

// Find sendChatMessage and delete the block
let newLines = [];
let insideSendChat = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.includes('const sendChatMessage = async')) {
    insideSendChat = true;
  }
  
  if (insideSendChat) {
    if (line.includes('{')) braceCount += (line.match(/{/g) || []).length;
    if (line.includes('}')) braceCount -= (line.match(/}/g) || []).length;
    
    if (braceCount === 0 && line.includes('}')) {
      insideSendChat = false;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(file, newLines.join('\n'));

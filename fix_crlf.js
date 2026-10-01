const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const \[isChatting.*?;\r?\n/g, '');
content = content.replace(/const chatEndRef.*?;\r?\n/g, '');
content = content.replace(/const \[chatInput.*?;\r?\n/g, '');
content = content.replace(/const \[chatHistory.*?;\r?\n/g, '');

const startIdx = content.indexOf('const sendChatMessage = async');
if (startIdx !== -1) {
  const endMarker = "setIsChatting(false);\r\n    };\r\n";
  let endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    const endMarker2 = "setIsChatting(false);\n    };\n";
    endIdx = content.indexOf(endMarker2, startIdx);
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx + endMarker2.length);
    }
  } else {
    content = content.substring(0, startIdx) + content.substring(endIdx + endMarker.length);
  }
}

fs.writeFileSync(file, content);

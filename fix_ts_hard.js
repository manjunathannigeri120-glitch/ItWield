const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the specific variables completely
content = content.replace(/const \[chatHistory, setChatHistory\] = useState<\{role: string, text: string\}\[\]>\(\[\]\);\n/g, '');
content = content.replace(/const \[chatInput, setChatInput\] = useState\(''\);\n/g, '');
content = content.replace(/const \[isChatting, setIsChatting\] = useState\(false\);\n/g, '');
content = content.replace(/const chatEndRef = useRef<HTMLDivElement>\(null\);\n/g, '');
content = content.replace(/import \{.*?ArrowRight.*?\} from 'lucide-react';\n/g, (match) => match.replace('ArrowRight, ', '').replace(', ArrowRight', ''));

// Find start of sendChatMessage
const startIdx = content.indexOf('const sendChatMessage = async');
if (startIdx !== -1) {
  // Find the end of it (the final closing brace)
  const endMarker = "setIsChatting(false);\n    };\n";
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    content = content.substring(0, startIdx) + content.substring(endIdx + endMarker.length);
  }
}

fs.writeFileSync(file, content);

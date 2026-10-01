const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove ArrowRight
content = content.replace(/ArrowRight,\s*/, '');
// Remove isChatting and setIsChatting
content = content.replace(/const \[isChatting, setIsChatting\] = useState\(false\);\n/, '');
// Remove chatInput
content = content.replace(/const \[chatInput, setChatInput\] = useState\(''\);\n/, '');
// Remove chatHistory
content = content.replace(/const \[chatHistory, setChatHistory\] = useState<any\[\]>\(\[\]\);\n/, '');
// Remove chatEndRef
content = content.replace(/const chatEndRef = useRef<HTMLDivElement>\(null\);\n/, '');

// Remove sendChatMessage block completely
content = content.replace(/const sendChatMessage = async[\s\S]*?};\n/, '');

fs.writeFileSync(file, content);

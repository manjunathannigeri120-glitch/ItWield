const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import React, \{.*?\} from 'react';/, 'import { useState, useEffect, useRef } from "react";');
content = content.replace(/const agents = agentsRes\.data \|\| \[\];/, '');
content = content.replace(/const \[chatHistory, setChatHistory\] = useState.*?;\n/g, '');
content = content.replace(/const \[chatInput, setChatInput\] = useState.*?;\n/g, '');

fs.writeFileSync(file, content);

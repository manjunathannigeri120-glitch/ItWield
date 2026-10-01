const fs = require('fs');
let connFile = 'frontend/src/pages/Connections.tsx';
let connContent = fs.readFileSync(connFile, 'utf8');
connContent = connContent.replace(/GithubIcon/g, 'GitBranch');
connContent = connContent.replace(/import { Check, GitBranch, Mail/g, 'import { Check, GitBranch, Mail');
fs.writeFileSync(connFile, connContent);

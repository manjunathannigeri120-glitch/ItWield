const fs = require('fs');
let appFile = 'frontend/src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(/import \{ Connections \} from '@\/pages\/Connections';/, 'import Connections from \'@/pages/Connections\';');
fs.writeFileSync(appFile, appContent);

let connFile = 'frontend/src/pages/Connections.tsx';
let connContent = fs.readFileSync(connFile, 'utf8');
connContent = connContent.replace(/Github/g, 'GithubIcon');
fs.writeFileSync(connFile, connContent);

const fs = require('fs');
let file = 'frontend/src/pages/Connections.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "import { Check, Github, Mail, Database, CreditCard, Cloud, AlertTriangle, Key } from 'lucide-react';",
  "import { Check, Github, Mail, Database, CreditCard, Cloud, AlertTriangle, Key, ShieldAlert } from 'lucide-react';"
);
fs.writeFileSync(file, content);

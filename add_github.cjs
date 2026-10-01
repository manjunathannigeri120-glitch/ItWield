const fs = require('fs');
let file = 'frontend/src/pages/Connections.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Source Control category
content = content.replace(
  "const CATEGORIES = [",
  "const CATEGORIES = [\n  { id: 'SOURCE_CONTROL', label: 'Source Control & Code', description: 'Allow the AI Engineering team to read code, open PRs, and deploy apps.', icon: <Code className=\"w-5 h-5 text-indigo-500\" /> },"
);
content = content.replace(
  "import { Shield, Key, AlertTriangle, Link as LinkIcon, Database, CheckCircle, HelpCircle, Activity, Settings, Plus, Send, RefreshCw, X, CreditCard, Globe } from 'lucide-react';",
  "import { Shield, Key, AlertTriangle, Link as LinkIcon, Database, CheckCircle, HelpCircle, Activity, Settings, Plus, Send, RefreshCw, X, CreditCard, Globe, Code } from 'lucide-react';"
);

// Add GitHub to sub-providers
content = content.replace(
  "const SUB_PROVIDERS: Record<string, string[]> = {",
  "const SUB_PROVIDERS: Record<string, string[]> = {\n  'SOURCE_CONTROL': ['GitHub', 'GitLab', 'Bitbucket'],"
);

// Update Capabilities for SOURCE_CONTROL
content = content.replace(
  "const CAPABILITIES: Record<string, any[]> = {",
  "const CAPABILITIES: Record<string, any[]> = {\n  'SOURCE_CONTROL': [\n    { id: 'READ_REPO', label: 'Read Source Code', risk: 'LOW' },\n    { id: 'CREATE_BRANCHES', label: 'Create Branches & Draft Code', risk: 'MEDIUM' },\n    { id: 'OPEN_PRS', label: 'Open Pull Requests (Requires Approval)', risk: 'MEDIUM' },\n    { id: 'COMMIT_TO_MAIN', label: 'Commit Directly to Main', risk: 'CRITICAL' }\n  ],"
);

fs.writeFileSync(file, content);
console.log('Added GitHub integration to Connections');

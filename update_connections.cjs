const fs = require('fs');
let file = 'frontend/src/pages/Connections.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Integrations
const extraIntegrations = `
  {
    id: 'SENDGRID',
    name: 'SendGrid (Email)',
    icon: Mail,
    description: 'Allow AI CMO to send automated marketing and outreach emails via Twilio SendGrid.',
    color: 'bg-blue-500',
    capabilities: [
      { id: 'READ_EMAILS', label: 'Read Emails', risk: 'LOW' },
      { id: 'DRAFT_EMAILS', label: 'Draft Emails (Requires Approval)', risk: 'LOW' },
      { id: 'SEND_EMAILS', label: 'Send Emails Autonomously', risk: 'HIGH' },
      { id: 'MANAGE_CONTACTS', label: 'Manage Contact Lists', risk: 'MEDIUM' }
    ]
  },
  {
    id: 'MAILGUN',
    name: 'Mailgun (Email)',
    icon: Mail,
    description: 'Allow AI CMO to send automated marketing and outreach emails via Mailgun.',
    color: 'bg-red-500',
    capabilities: [
      { id: 'READ_EMAILS', label: 'Read Emails', risk: 'LOW' },
      { id: 'DRAFT_EMAILS', label: 'Draft Emails (Requires Approval)', risk: 'LOW' },
      { id: 'SEND_EMAILS', label: 'Send Emails Autonomously', risk: 'HIGH' },
      { id: 'MANAGE_CONTACTS', label: 'Manage Contact Lists', risk: 'MEDIUM' }
    ]
  },
  {
    id: 'POSTMARK',
    name: 'Postmark (Email)',
    icon: Mail,
    description: 'Allow AI CMO to send automated marketing and outreach emails via Postmark.',
    color: 'bg-yellow-500',
    capabilities: [
      { id: 'READ_EMAILS', label: 'Read Emails', risk: 'LOW' },
      { id: 'DRAFT_EMAILS', label: 'Draft Emails (Requires Approval)', risk: 'LOW' },
      { id: 'SEND_EMAILS', label: 'Send Emails Autonomously', risk: 'HIGH' },
      { id: 'MANAGE_CONTACTS', label: 'Manage Contact Lists', risk: 'MEDIUM' }
    ]
  },`;

content = content.replace("  {\n    id: 'RESEND',", extraIntegrations + "\n  {\n    id: 'RESEND',");

// 2. Add fromEmail state
content = content.replace(
  "const [apiKey, setApiKey] = useState('');",
  "const [apiKey, setApiKey] = useState('');\n  const [fromEmail, setFromEmail] = useState('');"
);

// 3. Clear fromEmail on close/connect
content = content.replace(
  "setApiKey('');",
  "setApiKey('');\n        setFromEmail('');"
);
content = content.replace(
  "onClick={() => setConnectingTo(null)}",
  "onClick={() => { setConnectingTo(null); setFromEmail(''); }}"
);

// 4. Update api.post payload
content = content.replace(
  "credentials: { apiKey },",
  "credentials: { apiKey, fromEmail },"
);

// 5. Add input UI for Email Providers
const inputUI = `
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">API Key / Token</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="Paste your secret key here..."
                  />
                </div>
                {['RESEND', 'BREVO', 'SENDGRID', 'MAILGUN', 'POSTMARK'].includes(connectingTo || '') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sender (From) Email Address</label>
                    <input 
                      type="email" 
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                      placeholder="e.g. founder@yourcompany.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">This email must be verified in your email provider dashboard.</p>
                  </div>
                )}
`;

content = content.replace(
  /<div>\s*<label className="block text-sm font-semibold text-slate-700 mb-2">API Key \/ Token<\/label>[\s\S]*?<\/div>/,
  inputUI
);

fs.writeFileSync(file, content);
console.log('Updated Connections UI for Email Providers');

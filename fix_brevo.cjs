const fs = require('fs');
let file = 'frontend/src/pages/Connections.tsx';
let content = fs.readFileSync(file, 'utf8');

const brevoIntegration = `
  {
    id: 'BREVO',
    name: 'Brevo (Email)',
    icon: Mail,
    description: 'Allow AI CMO to send automated marketing and outreach emails via Brevo (Sendinblue).',
    color: 'bg-blue-600',
    capabilities: [
      { id: 'READ_EMAILS', label: 'Read Emails', risk: 'LOW' },
      { id: 'DRAFT_EMAILS', label: 'Draft Emails (Requires Approval)', risk: 'LOW' },
      { id: 'SEND_EMAILS', label: 'Send Emails Autonomously', risk: 'HIGH' },
      { id: 'MANAGE_CONTACTS', label: 'Manage Contact Lists', risk: 'MEDIUM' }
    ]
  },
`;

content = content.replace("id: 'RESEND',", brevoIntegration + "  {\n    id: 'RESEND',");

fs.writeFileSync(file, content);
console.log('Added Brevo to Connections.tsx');

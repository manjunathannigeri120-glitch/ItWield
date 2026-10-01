import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Check, GitBranch, Mail, Database, CreditCard, Cloud, AlertTriangle, Key, ShieldAlert } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'GITHUB',
    name: 'GitHub',
    icon: GitBranch,
    description: 'Allow AI CTO to read repos, investigate bugs, and submit Pull Requests.',
    color: 'bg-slate-900',
    capabilities: [
      { id: 'READ_REPOSITORY', label: 'Read Repository', risk: 'LOW' },
      { id: 'CREATE_ISSUE', label: 'Create Issues', risk: 'LOW' },
      { id: 'UPDATE_ISSUE', label: 'Update Issues', risk: 'MEDIUM' },
      { id: 'CREATE_PULL_REQUEST', label: 'Create Pull Requests', risk: 'MEDIUM' },
      { id: 'MERGE_PULL_REQUEST', label: 'Merge Pull Requests', risk: 'HIGH' }
    ],
    matches: ['GITHUB']
  },
  {
    id: 'EMAIL',
    name: 'Email Provider',
    icon: Mail,
    description: 'Allow AI CMO to send automated marketing and outreach emails.',
    color: 'bg-indigo-600',
    options: ['Resend', 'Brevo', 'MailerSend', 'Postmark', 'Twilio SendGrid', 'Amazon SES', 'Plunk', 'Other'],
    capabilities: [
      { id: 'READ_EMAILS', label: 'Read Emails', risk: 'LOW' },
      { id: 'DRAFT_EMAILS', label: 'Draft Emails (Requires Approval)', risk: 'LOW' },
      { id: 'SEND_EMAILS', label: 'Send Emails Autonomously', risk: 'HIGH' },
      { id: 'MANAGE_CONTACTS', label: 'Manage Contact Lists', risk: 'MEDIUM' }
    ],
    matches: ['RESEND', 'BREVO', 'MAILERSEND', 'POSTMARK', 'TWILIO_SENDGRID', 'AMAZON_SES', 'PLUNK', 'EMAIL']
  },
  {
    id: 'PAYMENTS',
    name: 'Payment Gateway',
    icon: CreditCard,
    description: 'Allow AI CFO to monitor revenue, subscriptions, and process refunds.',
    color: 'bg-purple-600',
    options: ['Stripe', 'Razorpay', 'PayPal', 'Braintree', 'Square', 'Other'],
    capabilities: [
      { id: 'READ_TRANSACTIONS', label: 'Read Transactions', risk: 'LOW' },
      { id: 'DRAFT_INVOICES', label: 'Draft Invoices (Requires Approval)', risk: 'LOW' },
      { id: 'PROCESS_REFUNDS', label: 'Process Refunds', risk: 'HIGH' }
    ],
    matches: ['STRIPE', 'RAZORPAY', 'PAYPAL', 'BRAINTREE', 'SQUARE', 'PAYMENTS']
  },
  {
    id: 'DEPLOYMENT',
    name: 'Cloud Hosting',
    icon: Cloud,
    description: 'Allow AI CTO to monitor deployments, rollback builds, and analyze logs.',
    color: 'bg-black',
    options: ['Vercel', 'Cloudflare', 'Netlify', 'Render', 'AWS', 'Other'],
    capabilities: [
      { id: 'READ_LOGS', label: 'Read Logs', risk: 'LOW' },
      { id: 'REDEPLOY', label: 'Redeploy Current Build', risk: 'MEDIUM' },
      { id: 'ROLLBACK', label: 'Rollback Deployments', risk: 'HIGH' }
    ],
    matches: ['VERCEL', 'CLOUDFLARE', 'NETLIFY', 'RENDER', 'AWS', 'DEPLOYMENT']
  }
];

export default function Connections() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  
  const { data: connections, refetch, isLoading } = useQuery({
    queryKey: ['connections', activeWorkspaceId],
    queryFn: async () => {
      const wsRes = await api.get('/workspaces');
      const ws = wsRes.data.find((w: any) => w.status === 'operating' || w.status === 'active' || w.status === 'ACTIVE');
      if (ws) setActiveWorkspaceId(ws.id);
      
      if (!ws?.id) return [];
      const res = await api.get(`/connections`, { headers: { 'x-workspace-id': ws.id } });
      return res.data;
    }
  });

  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [selectedSubProvider, setSelectedSubProvider] = useState<string>('');
  const [customSubProvider, setCustomSubProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCapability = (id: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const startConnecting = (integration: any) => {
      setConnectingTo(integration.id);
      setApiKey('');
      setFromEmail('');
      setSelectedCapabilities([]);
      if (integration.options && integration.options.length > 0) {
          setSelectedSubProvider(integration.options[0]);
      } else {
          setSelectedSubProvider(integration.id);
      }
      setCustomSubProvider('');
  };

  const handleConnect = async () => {
    if (!activeWorkspaceId || !connectingTo) return;
    setIsSubmitting(true);
    try {
      const integration = INTEGRATIONS.find(i => i.id === connectingTo);
      
      let finalProvider = connectingTo;
      if (integration?.options) {
          finalProvider = selectedSubProvider === 'Other' && customSubProvider 
              ? customSubProvider.toUpperCase().replace(/\s+/g, '_') 
              : selectedSubProvider.toUpperCase().replace(/\s+/g, '_');
      }

      await api.post(`/connections`, {
        provider: finalProvider,
        name: `${selectedSubProvider === 'Other' && customSubProvider ? customSubProvider : selectedSubProvider || integration?.name}`,
        credentials: { apiKey, fromEmail },
        capabilities: selectedCapabilities,
        metadata: { parentCategory: connectingTo, customProvider: selectedSubProvider === 'Other' ? customSubProvider : null }
      }, {
        headers: { 'x-workspace-id': activeWorkspaceId }
      });
      
      setConnectingTo(null);
      refetch();
    } catch (e: any) {
      alert("Error saving connection: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">External Systems & Integrations</h1>
        <p className="text-gray-500 mt-2">Connect external platforms and strictly configure what your AI executives are allowed to do.</p>
      </div>

      {connectingTo ? (
        <div className="max-w-2xl mx-auto">
          <Card className="border-slate-200 shadow-md">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="flex items-center gap-2">
                Configure {INTEGRATIONS.find(i => i.id === connectingTo)?.name} Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
                {INTEGRATIONS.find(i => i.id === connectingTo)?.options && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Provider</label>
                    <select 
                        value={selectedSubProvider} 
                        onChange={(e) => setSelectedSubProvider(e.target.value)}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        {INTEGRATIONS.find(i => i.id === connectingTo)?.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedSubProvider === 'Other' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Provider Name</label>
                    <input 
                      type="text" 
                      value={customSubProvider}
                      onChange={(e) => setCustomSubProvider(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                      placeholder="e.g. MyCustomEmailService"
                    />
                  </div>
                )}

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
                {connectingTo === 'EMAIL' && (
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Authorize Capabilities
                </label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                  {INTEGRATIONS.find(i => i.id === connectingTo)?.capabilities.map((cap) => (
                    <label key={cap.id} className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                          checked={selectedCapabilities.includes(cap.id)}
                          onChange={() => toggleCapability(cap.id)}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{cap.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            cap.risk === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                            cap.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            cap.risk === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {cap.risk} RISK
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{cap.id}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setConnectingTo(null); setFromEmail(''); }}>Cancel</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleConnect} disabled={!apiKey || isSubmitting || (selectedSubProvider === 'Other' && !customSubProvider)}>
                  <Key className="w-4 h-4 mr-2" /> Connect & Authorize
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATIONS.map(integration => {
            const connectedItems = connections?.filter((c: any) => integration.matches.includes(c.system_type) || c.system_type === integration.id) || [];
            const isConnected = connectedItems.length > 0;
            const Icon = integration.icon;

            return (
              <Card key={integration.id} className={`flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${isConnected ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}>
                {isConnected && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    {connectedItems.length} Connected
                  </div>
                )}
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${integration.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <p className="text-sm text-slate-600 mb-6 flex-1">
                    {integration.description}
                  </p>
                  
                  {isConnected ? (
                    <div className="space-y-4">
                      {connectedItems.map((cItem: any, idx: number) => (
                        <div key={idx} className="bg-emerald-50 p-3 rounded-md border border-emerald-100 mb-2">
                            <p className="text-sm font-bold text-emerald-900 mb-1">{cItem.display_name}</p>
                            <p className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" /> Authorized Capabilities
                            </p>
                            <div className="flex flex-wrap gap-1">
                            {cItem.capabilities && cItem.capabilities.length > 0 ? 
                                cItem.capabilities.map((cap: string, i: number) => (
                                <span key={i} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                                    {cap}
                                </span>
                                ))
                                : <span className="text-xs text-slate-500 italic">No capabilities authorized.</span>
                            }
                            </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => startConnecting(integration)}>
                        Add Another {integration.name}
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => startConnecting(integration)}>
                      Configure Connection
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

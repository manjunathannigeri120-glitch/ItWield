import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, Target, Globe, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { validateTextMeaning } from '@/lib/gibberishValidator';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL Auto-Enrichment State (SaaSHub style)
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Field-specific validation errors for instant feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSignOut = async () => {
    localStorage.removeItem('sb-mock-session');
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Step 1: Basics
  const [basics, setBasics] = useState({
    name: '',
    website: '',
    industry: '',
    short_description: ''
  });

  // Step 2: Context
  const [context, setContext] = useState({
    target_customer: '',
    primary_market: '',
    goals: '',
    biggest_problems: ''
  });

  // Automatically fetch & extract data from URL (SaaSHub style)
  const handleScanWebsite = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || urlInput || basics.website).trim();
    if (!targetUrl) {
      setScanError('Please enter a website or app URL to inspect.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanSuccess(false);
    setScanMessage('Connecting to website & verifying domain...');

    try {
      const res = await api.post('/workspaces/enrich-url', { url: targetUrl });
      
      if (res.data?.success && res.data?.data) {
        const enriched = res.data.data;

        // Auto-fill Step 1 fields
        setBasics(prev => ({
          ...prev,
          name: enriched.name || prev.name,
          website: enriched.website || targetUrl,
          industry: enriched.industry || prev.industry,
          short_description: enriched.short_description || prev.short_description
        }));

        // Also pre-fill Step 2 fields so the user doesn't have to start from scratch!
        setContext(prev => ({
          ...prev,
          target_customer: enriched.target_customer || prev.target_customer,
          primary_market: enriched.primary_market || prev.primary_market,
          goals: enriched.goals || prev.goals,
          biggest_problems: enriched.biggest_problems || prev.biggest_problems
        }));

        setUrlInput(enriched.website || targetUrl);
        setScanSuccess(true);
        setScanMessage(`Successfully extracted details from ${enriched.name || 'your website'}!`);
        setError(null);
        setFieldErrors({});
      } else {
        throw new Error(res.data?.error || 'Failed to inspect website.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Could not reach website. Please check the URL or fill in details manually.';
      setScanError(msg);
      setScanSuccess(false);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateBasics = async () => {
    setError(null);
    const newFieldErrors: Record<string, string> = {};

    // 1. Company Name Validation & Anti-Gibberish
    const nameVal = validateTextMeaning(basics.name, {
      minChars: 2,
      minWords: 1,
      fieldName: 'Company Name'
    });
    if (!nameVal.isValid) {
      newFieldErrors.name = nameVal.reason || 'Please enter a valid company name.';
    }

    // 2. Website URL Validation
    let trimmedWebsite = basics.website.trim();
    if (!trimmedWebsite) {
      newFieldErrors.website = 'Website or App link is required.';
    } else {
      if (!/^https?:\/\//i.test(trimmedWebsite)) {
        trimmedWebsite = `https://${trimmedWebsite}`;
        setBasics(prev => ({ ...prev, website: trimmedWebsite }));
      }
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
      if (!urlPattern.test(trimmedWebsite)) {
        newFieldErrors.website = 'Please enter a valid website URL (e.g. https://yourcompany.com).';
      }
    }

    // 3. Short Description Validation & Anti-Gibberish
    const descVal = validateTextMeaning(basics.short_description, {
      minChars: 10,
      minWords: 2,
      fieldName: 'Company Description'
    });
    if (!descVal.isValid) {
      newFieldErrors.short_description = descVal.reason || 'Please provide a meaningful description of what your business does.';
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setError('Please resolve the invalid or random fields before continuing.');
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    setError(null);
    const newFieldErrors: Record<string, string> = {};

    // 1. Target Customer Validation & Anti-Gibberish
    const custVal = validateTextMeaning(context.target_customer, {
      minChars: 3,
      minWords: 1,
      fieldName: 'Target Customer'
    });
    if (!custVal.isValid) {
      newFieldErrors.target_customer = custVal.reason || 'Please specify your target customer.';
    }

    // 2. Biggest Problems Validation & Anti-Gibberish
    const probVal = validateTextMeaning(context.biggest_problems, {
      minChars: 5,
      minWords: 1,
      fieldName: 'Business Problems'
    });
    if (!probVal.isValid) {
      newFieldErrors.biggest_problems = probVal.reason || 'Please specify at least one real business problem or constraint.';
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setError('Please provide meaningful information for your business context (random text is blocked).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Create Workspace
      const wsRes = await api.post('/workspaces', { name: basics.name.trim() });
      const workspaceId = wsRes.data.id;

      // 2. Analyze Company (Saves context to Company Memory with server-side anti-gibberish checks)
      await api.post(`/workspaces/${workspaceId}/analyze-company`, {
        ...basics,
        ...context
      });

      // 3. Activate Workspace
      await api.post(`/workspaces/${workspaceId}/activate`);

      // 4. Go to Dashboard
      navigate('/dashboard');
    } catch (e: any) {
      if (e.message === 'Network Error') {
        setError('Unable to connect to the server. Please try again in a moment.');
      } else if (e.response?.status >= 500) {
        setError('Our servers are currently starting up. Please wait a moment and try again.');
      } else {
        setError(e.response?.data?.error || 'Failed to complete setup. Please verify your details.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Set Up Your AI Company</h1>
          <p className="text-slate-400 mt-2">
            Connect your website or enter your details. ItWield learns your operations to act as your autonomous executive team.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* STEP 1: WEBSITE AUTO-DISCOVERY & BASICS */}
        {step === 1 && (
          <Card className="shadow-2xl border-slate-800 bg-slate-950/70 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800/80 pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <Globe className="w-5 h-5 text-indigo-400" /> Company Basics
                </CardTitle>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Step 1 of 2
                </span>
              </div>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Enter your website URL to auto-extract company details, or enter them manually.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* SAA-HUB STYLE AUTO-INSPECTION BOX */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Quick Auto-Fill with Website URL
                  </label>
                  <span className="text-xs text-slate-400">Powered by AI Discovery</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (scanError) setScanError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanWebsite();
                      }
                    }}
                    placeholder="e.g. https://yourcompany.com or yourcompany.com"
                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 flex-1"
                    disabled={isScanning}
                  />
                  <Button
                    type="button"
                    onClick={() => handleScanWebsite()}
                    disabled={isScanning || !urlInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Inspecting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Auto-Fill Details</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Status messages for URL scanning */}
                {isScanning && (
                  <p className="text-xs text-indigo-300/80 animate-pulse flex items-center gap-1.5 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {scanMessage || 'Scanning website and extracting business profile...'}
                  </p>
                )}

                {scanSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{scanMessage} You can customize or edit any fields below.</span>
                  </div>
                )}

                {scanError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>{scanError}</span>
                      <p className="text-slate-400 mt-0.5">Please check the domain or complete the form fields manually below.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* EDITABLE FORM FIELDS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Review & Edit Extracted Fields
                  </span>
                  <span>All fields fully editable</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={basics.name}
                    onChange={(e) => {
                      setBasics({ ...basics, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Acme Corp"
                    className={`bg-slate-900 border-slate-700 text-white ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Website or App Link <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={basics.website}
                    onChange={(e) => {
                      setBasics({ ...basics, website: e.target.value });
                      if (fieldErrors.website) setFieldErrors(prev => ({ ...prev, website: '' }));
                    }}
                    placeholder="e.g. https://yourcompany.com"
                    className={`bg-slate-900 border-slate-700 text-white ${fieldErrors.website ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.website && (
                    <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Industry / Category <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <Input
                    value={basics.industry}
                    onChange={(e) => setBasics({ ...basics, industry: e.target.value })}
                    placeholder="e.g. B2B SaaS, E-Commerce, Marketing Agency"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Brief Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    className={`w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none h-24 ${
                      fieldErrors.short_description ? 'border-red-500' : ''
                    }`}
                    value={basics.short_description}
                    onChange={(e) => {
                      setBasics({ ...basics, short_description: e.target.value });
                      if (fieldErrors.short_description) setFieldErrors(prev => ({ ...prev, short_description: '' }));
                    }}
                    placeholder="What does your company or product do? (e.g. We provide automated lead intelligence for B2B sales teams)"
                  />
                  {fieldErrors.short_description && (
                    <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.short_description}</p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-900/60 border-t border-slate-800/80 rounded-b-xl py-4 flex justify-between">
              <Button variant="ghost" onClick={handleSignOut} className="text-slate-400 hover:text-white">
                Log Out
              </Button>
              <Button
                onClick={handleCreateBasics}
                className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
              >
                <span>Continue to Business Context</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: BUSINESS CONTEXT & GOALS */}
        {step === 2 && (
          <Card className="shadow-2xl border-slate-800 bg-slate-950/70 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800/80 pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-indigo-400" /> Business Context & Operations
                </CardTitle>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Step 2 of 2
                </span>
              </div>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Help your AI executive team understand who to target and what bottlenecks to solve.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Customer <span className="text-red-400">*</span>
                </label>
                <Input
                  value={context.target_customer}
                  onChange={(e) => {
                    setContext({ ...context, target_customer: e.target.value });
                    if (fieldErrors.target_customer) setFieldErrors(prev => ({ ...prev, target_customer: '' }));
                  }}
                  placeholder="e.g. Early-stage founders, B2B sales teams, marketing agencies"
                  className={`bg-slate-900 border-slate-700 text-white ${fieldErrors.target_customer ? 'border-red-500' : ''}`}
                />
                {fieldErrors.target_customer && (
                  <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.target_customer}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Primary Market / Geography <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <Input
                  value={context.primary_market}
                  onChange={(e) => setContext({ ...context, primary_market: e.target.value })}
                  placeholder="e.g. Global, North America, English speaking"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Current Growth Goals <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none h-20"
                  value={context.goals}
                  onChange={(e) => setContext({ ...context, goals: e.target.value })}
                  placeholder="e.g. Acquire our first 50 paying customers and scale inbound pipelines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Biggest Problems / Constraints <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none h-20 ${
                    fieldErrors.biggest_problems ? 'border-red-500' : ''
                  }`}
                  value={context.biggest_problems}
                  onChange={(e) => {
                    setContext({ ...context, biggest_problems: e.target.value });
                    if (fieldErrors.biggest_problems) setFieldErrors(prev => ({ ...prev, biggest_problems: '' }));
                  }}
                  placeholder="e.g. Outbound sales takes 20+ hours a week and conversion rates are inconsistent"
                />
                {fieldErrors.biggest_problems && (
                  <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.biggest_problems}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-slate-900/60 border-t border-slate-800/80 rounded-b-xl py-4 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading} className="text-slate-400 hover:text-white">
                &larr; Back
              </Button>
              <Button
                onClick={handleFinishOnboarding}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configuring AI Executives...</span>
                  </span>
                ) : (
                  <span>Launch Operations (150 Free Credits) &rarr;</span>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

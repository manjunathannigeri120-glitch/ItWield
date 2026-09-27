import re

path = 'frontend/src/pages/Dashboard.tsx'
with open(path, 'r') as f:
    c = f.read()

# Generate the checklist code
checklist_ui = """
        {/* ONBOARDING CHECKLIST */}
        {(!workspace?.company_goals || activeMissions.length === 0 || !workforce?.some((w: any) => w.state === 'READY' || w.state === 'WORKING')) && (
          <Card className="shadow-sm border-2 border-blue-200 bg-blue-50/50 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Getting Started
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-0.5 ${workspace?.company_goals ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-semibold ${workspace?.company_goals ? 'text-slate-900' : 'text-slate-700'}`}>Define Business Goals</div>
                    <div className="text-sm text-slate-500">Give your AI executives direction.</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-0.5 ${workforce?.some((w: any) => w.state === 'READY' || w.state === 'WORKING') ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-semibold ${workforce?.some((w: any) => w.state === 'READY' || w.state === 'WORKING') ? 'text-slate-900' : 'text-slate-700'}`}>Workforce Ready</div>
                    <div className="text-sm text-slate-500">Ensure at least one AI worker is configured and ready.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-0.5 ${activeMissions?.length > 0 || businessOutcomes?.length > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-semibold ${activeMissions?.length > 0 || businessOutcomes?.length > 0 ? 'text-slate-900' : 'text-slate-700'}`}>Start First Mission</div>
                    <div className="text-sm text-slate-500">Route a business objective to the AI CEO.</div>
                    {(activeMissions?.length === 0 && businessOutcomes?.length === 0) && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href='/missions/new'}>Start Mission</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
"""

c = c.replace(
    "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';",
    "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\nimport { Check, CheckCircle2 } from 'lucide-react';"
)

c = c.replace(
    "{/* COMPANY HEALTH */}",
    checklist_ui + "\n            {/* COMPANY HEALTH */}"
)

with open(path, 'w') as f:
    f.write(c)

print('patched Dashboard.tsx')

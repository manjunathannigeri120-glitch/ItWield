const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const importsTarget = "import { Button } from '@/components/ui/button';";
const importsFix = "import { Button } from '@/components/ui/button';\nimport { useState, useEffect } from 'react';\nimport api from '@/lib/api';\nimport { Loader2 } from 'lucide-react';";

content = content.replace(importsTarget, importsFix);

const fnTarget = "export function DashboardLayout({ children }: DashboardLayoutProps) {";
const fnFix = `export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [creditError, setCreditError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const wsRes = await api.get('/workspaces');
        if (wsRes.data && wsRes.data.length > 0) {
          const wsId = wsRes.data[0].id;
          const credRes = await api.get(\`/workspaces/\${wsId}/credits\`);
          setCredits(credRes.data.credits);
        }
      } catch (err) {
        setCreditError('Error loading credits');
      } finally {
        setLoadingCredits(false);
      }
    };
    fetchCredits();

    const handleCreditUpdate = (e: any) => {
      if (typeof e.detail === 'number') {
        setCredits(e.detail);
      }
    };
    window.addEventListener('credits_updated', handleCreditUpdate);
    return () => window.removeEventListener('credits_updated', handleCreditUpdate);
  }, []);`;

content = content.replace(fnTarget, fnFix);

const uiTarget = `          <div className="p-4 border-t">
            <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>`;
const uiFix = `          <div className="p-4 border-t">
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">AI Credits</span>
              {loadingCredits ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : creditError ? (
                <span className="text-xs text-red-500">Error</span>
              ) : (
                <span className="text-sm font-bold text-indigo-600">{credits}</span>
              )}
            </div>
            <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>`;

content = content.replace(uiTarget, uiFix);

fs.writeFileSync(file, content);
console.log('Modified DashboardLayout.tsx');

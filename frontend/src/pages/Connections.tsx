import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Connections() {
  const [activeWorkspaceId] = useState(() => localStorage.getItem('itwield_workspace_id') || '');

  const { data: dataRegistry, isLoading } = useQuery<any[]>({
    queryKey: ['business-data', activeWorkspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${activeWorkspaceId}/business-data`);
      return res.data;
    },
    enabled: !!activeWorkspaceId
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Connections & Data Health</h1>
        <p className="text-gray-500 mt-2">Connect business systems to let ItWield measure actual outcomes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Customers & Sales</CardTitle>
            <CardDescription>Where your customer and lead data lives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center bg-white">
              <div>
                <h4 className="font-bold text-slate-900">ItWield Native CRM</h4>
                <div className="text-sm text-slate-500">Built-in lead management</div>
              </div>
              <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 pointer-events-none">Connected</Button>
            </div>
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center opacity-60">
              <div>
                <h4 className="font-bold text-slate-900">Salesforce</h4>
                <div className="text-sm text-slate-500">Enterprise CRM sync</div>
              </div>
              <Button variant="ghost" disabled>Coming Soon</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Revenue & Finance</CardTitle>
            <CardDescription>Where your transaction and billing data lives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center bg-white">
              <div>
                <h4 className="font-bold text-slate-900">Stripe</h4>
                <div className="text-sm text-slate-500">Subscriptions & payments</div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center opacity-60">
              <div>
                <h4 className="font-bold text-slate-900">QuickBooks</h4>
                <div className="text-sm text-slate-500">Accounting data</div>
              </div>
              <Button variant="ghost" disabled>Coming Soon</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Marketing & Analytics</CardTitle>
            <CardDescription>Where your growth data lives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center opacity-60">
              <div>
                <h4 className="font-bold text-slate-900">Google Analytics</h4>
                <div className="text-sm text-slate-500">Web traffic and conversions</div>
              </div>
              <Button variant="ghost" disabled>Coming Soon</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Operations & Technology</CardTitle>
            <CardDescription>Where your internal systems live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-slate-200 rounded p-4 flex justify-between items-center bg-white">
              <div>
                <h4 className="font-bold text-slate-900">PostgreSQL / Supabase</h4>
                <div className="text-sm text-slate-500">Raw database access</div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Data Health & Registry</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Loading data health...</td></tr>
              ) : dataRegistry && dataRegistry.length > 0 ? (
                dataRegistry.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{reg.domain}</td>
                    <td className="px-6 py-4 text-slate-600">{reg.source}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        reg.availability === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reg.availability === 'AVAILABLE' ? 'CONNECTED' : 'UNAVAILABLE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {reg.last_synced ? new Date(reg.last_synced).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                    No business data sources registered yet. Tell ItWield your goals to initialize the registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, AlertCircle, PlayCircle, ShieldCheck, Server, GitPullRequest, Code, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CTO() {
    const { currentWorkspace } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [runningDiagnostic, setRunningDiagnostic] = useState(false);

    useEffect(() => {
        if (!currentWorkspace?.id) return;
        const fetchStatus = async () => {
            try {
                const res = await api.get(`/cto/${currentWorkspace.id}`);
                setStatus(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000); // reduced frequency
        return () => clearInterval(interval);
    }, [currentWorkspace?.id]);

    const runDiagnostic = async () => {
        if (!currentWorkspace?.id) return;
        setRunningDiagnostic(true);
        try {
            await api.post(`/cto/${currentWorkspace.id}/diagnostic`);
        } catch(e) {
            console.error(e);
        }
        setTimeout(() => { setRunningDiagnostic(false); window.location.reload(); }, 2000);
    };

    if (!status) return <div className="p-8">Loading CTO Data...</div>;

    const githubConn = status.systems?.find((s: any) => s.system_type === 'GITHUB');
    const vercelConn = status.systems?.find((s: any) => s.system_type === 'VERCEL');

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Autonomous CTO Operations</h1>
                    <p className="text-slate-500 mt-2">
                        Real-time monitoring of technical health, infrastructure signals, and delegated technical fixes.
                    </p>
                </div>
                <Button 
                    onClick={runDiagnostic} 
                    disabled={runningDiagnostic || status.workspace?.cto_status === 'DIAGNOSING'}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {runningDiagnostic || status.workspace?.cto_status === 'DIAGNOSING' ? 'Running System Scan...' : 'Trigger Manual Diagnostic'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="pb-2 bg-indigo-50/50"><CardTitle className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Engine Status</CardTitle></CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-black flex items-center gap-3">
                            <Activity className={`w-6 h-6 ${status.workspace?.cto_status === 'DIAGNOSING' ? 'text-amber-500 animate-spin' : 'text-indigo-500'}`} />
                            {status.workspace?.cto_status || 'IDLE'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-rose-100 shadow-sm">
                    <CardHeader className="pb-2 bg-rose-50/50"><CardTitle className="text-sm font-semibold text-rose-900 uppercase tracking-wider">Active Incidents</CardTitle></CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-black flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                            {status.incidents?.filter((i: any) => !['RESOLVED', 'CLOSED'].includes(i.status)).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                
                {/* INCIDENTS COLUMN */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Terminal className="w-5 h-5" /> Live Technical Incidents
                    </h2>
                    
                    {status.incidents?.length === 0 ? (
                        <Card className="border-dashed bg-slate-50">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />
                                <p className="font-semibold">All Systems Operational</p>
                                <p className="text-sm text-slate-400">No active technical incidents detected.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {status.incidents?.map((inc: any) => (
                                <Card key={inc.id} className="border-slate-200 overflow-hidden shadow-sm">
                                    <div className={`h-1 w-full ${inc.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <CardHeader className="pb-2 bg-slate-50">
                                        <CardTitle className="text-lg flex justify-between items-start">
                                            <span className="font-bold text-slate-900">{inc.title}</span>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                                                inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                inc.status === 'ESCALATED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                            }`}>{inc.status}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4 text-sm">
                                        <div className="text-slate-600 bg-slate-50 p-3 rounded text-sm border border-slate-100">
                                            {inc.description}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <strong className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Root Cause Analysis</strong>
                                                <span className="text-slate-800">{inc.confirmed_cause || inc.suspected_cause || 'Investigating...'}</span>
                                            </div>
                                            <div>
                                                <strong className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Severity</strong>
                                                <span className="uppercase font-bold text-rose-600">{inc.severity}</span>
                                            </div>
                                        </div>
                                        {inc.resolution && (
                                            <div className="bg-emerald-50 text-emerald-900 p-3 rounded-md border border-emerald-100">
                                                <strong className="block text-xs uppercase tracking-wider text-emerald-700 mb-1">Resolution</strong> 
                                                {inc.resolution}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t">
                                            <span>ID: {inc.id.substring(0,8)}</span>
                                            <span>Detected: {new Date(inc.detected_at || inc.created_at).toLocaleString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* AUTHORIZATIONS COLUMN */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Code className="w-5 h-5" /> Operating Perimeter
                    </h2>
                    
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <GitPullRequest className="w-4 h-4 text-slate-600" /> GitHub Operations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {!githubConn ? (
                                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">Not connected. CTO cannot read repos or fix bugs.</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        <span>Capability</span>
                                        <span>Status</span>
                                    </div>
                                    {['READ_REPOSITORY', 'CREATE_ISSUE', 'CREATE_PULL_REQUEST', 'MERGE_PULL_REQUEST'].map(cap => {
                                        const has = githubConn.capabilities?.includes(cap);
                                        return (
                                            <div key={cap} className="flex justify-between items-center text-sm">
                                                <span className="font-mono text-xs">{cap}</span>
                                                {has ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <span className="w-4 h-4 text-slate-300">?</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Server className="w-4 h-4 text-slate-600" /> Vercel Deployments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {!vercelConn ? (
                                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">Not connected. CTO cannot manage infrastructure.</p>
                            ) : (
                                <div className="space-y-2">
                                    {['READ_DEPLOYMENTS', 'CREATE_DEPLOYMENT', 'ROLLBACK_DEPLOYMENT'].map(cap => {
                                        const has = vercelConn.capabilities?.includes(cap);
                                        return (
                                            <div key={cap} className="flex justify-between items-center text-sm">
                                                <span className="font-mono text-xs">{cap}</span>
                                                {has ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <span className="w-4 h-4 text-slate-300">?</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

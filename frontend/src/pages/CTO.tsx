import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, AlertCircle } from 'lucide-react';

export default function CTO() {
    const { currentWorkspace } = useAuth();
    const [status, setStatus] = useState<any>(null);

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
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [currentWorkspace?.id]);

    if (!status) return <div className="p-8">Loading CTO Data...</div>;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Autonomous CTO Operating Loop</h1>
            <p className="text-slate-500">
                The CTO continuously manages technical health, infrastructure signals, and delegated technical fixes.
            </p>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            {status.workspace?.cto_status || 'IDLE'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Incidents</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            {status.incidents?.filter((i: any) => !['RESOLVED', 'CLOSED'].includes(i.status)).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold mt-8">Technical Incidents</h2>
            <div className="grid gap-4">
                {status.incidents?.map((inc: any) => (
                    <Card key={inc.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between">
                                <span>{inc.title}</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    inc.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                    inc.status === 'ESCALATED' ? 'bg-amber-100 text-amber-800' :
                                    'bg-indigo-100 text-indigo-800'
                                }`}>{inc.status}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div><strong>Severity:</strong> {inc.severity}</div>
                            <div><strong>Description:</strong> {inc.description}</div>
                            <div><strong>Root Cause:</strong> {inc.confirmed_cause || inc.suspected_cause || 'Unknown'}</div>
                            {inc.resolution && <div><strong>Resolution:</strong> {inc.resolution}</div>}
                            <div className="text-xs text-slate-400">Detected: {new Date(inc.detected_at || inc.created_at).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                ))}
                {status.incidents?.length === 0 && <p className="text-slate-500">No active technical incidents detected.</p>}
            </div>
        </div>
    );
}

import { useEffect, useState, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { api } from '@/lib/api';

export function LiveTerminal({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!workspaceId) return;
      try {
        const res = await api.get(`/workspaces/${workspaceId}/command-center`);
        if (res.data && res.data.decisionTimeline) {
          // Backend sorts newest first, we reverse it so it scrolls down like a real terminal
          const reversed = [...res.data.decisionTimeline].reverse();
          setLogs(reversed);
        }
      } catch (e) {
        console.error('Failed to fetch terminal logs', e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2500); // Poll every 2.5 seconds for live updates
    return () => clearInterval(interval);
  }, [workspaceId]);

  useEffect(() => {
    // Auto-scroll to the bottom when a new log appears
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Color code the agents so it looks amazing on video
  const getActorColor = (actor: string) => {
    if (!actor) return 'text-slate-400';
    if (actor.includes('CEO')) return 'text-purple-400';
    if (actor.includes('CMO')) return 'text-pink-400';
    if (actor.includes('CTO')) return 'text-blue-400';
    if (actor === 'SYSTEM') return 'text-emerald-400';
    return 'text-indigo-400';
  };

  return (
    <div className="mt-8 rounded-lg overflow-hidden border border-slate-800 bg-[#0a0a0f] shadow-2xl shadow-indigo-900/20">
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
        <Terminal className="w-4 h-4 text-slate-400 mr-2" />
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Live Agent Terminal</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-500/80 animate-pulse"></div>
        </div>
      </div>
      
      {/* Terminal Body */}
      <div className="p-4 h-72 overflow-y-auto font-mono text-sm space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #0f172a' }}>
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Waiting for autonomous activity...</div>
        ) : (
          logs.map((log, index) => (
            <div key={`${log.id}-${index}`} className="flex gap-3 text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-slate-600 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className={`font-bold shrink-0 ${getActorColor(log.actor)}`}>
                {log.actor}:
              </span>
              <span className="break-all">
                {log.action} <span className="text-slate-500 opacity-70">({log.outcome || log.reason})</span>
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

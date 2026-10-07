import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Briefcase, Send, User, Loader2, ArrowLeft, } from 'lucide-react';

export function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await api.get(`/agents/${id}`);
      return res.data;
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await api.get(`/conversations/${conversationId}/messages`);
      return res.data;
    },
    enabled: !!conversationId
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post(`/agents/${id}/chat`, {
        message,
        conversationId
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (!conversationId) setConversationId(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId || conversationId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to send message');
    }
  });

  const isSendingRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleSend = (e?: React.FormEvent, msgOverride?: string) => {
    if (e) e.preventDefault();
    const msg = (msgOverride || input).trim();
    if (!msg || chatMutation.isPending || isSendingRef.current) return;
    
    isSendingRef.current = true;
    setInput('');
    chatMutation.mutate(msg, {
      onSettled: () => {
        isSendingRef.current = false;
      }
    });
  };

  if (agentLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!agent) return <div className="p-8 text-center text-slate-500">Executive not found.</div>;

  let role = agent.role || 'EXECUTIVE';
  if (agent.name?.includes('CEO')) role = 'CEO';
  if (agent.name?.includes('COO')) role = 'COO';
  if (agent.name?.includes('CMO')) role = 'CMO';
  if (agent.name?.includes('CTO')) role = 'CTO';
  if (agent.name?.includes('CFO')) role = 'CFO';

  const roleDetails: Record<string, { title: string, desc: string, questions: string[], color: string }> = {
    'CEO': {
      title: 'Chief Executive Officer',
      desc: 'Company Strategy & Direction',
      color: 'bg-slate-900',
      questions: ['What should we focus on next?', 'What is blocking our goals?', 'Give me a company status update.']
    },
    'COO': {
      title: 'Chief Operating Officer',
      desc: 'Operations, Execution & Coordination',
      color: 'bg-blue-600',
      questions: ['What is currently running?', 'What is blocked?', 'What should operations do next?']
    },
    'CMO': {
      title: 'Chief Marketing Officer',
      desc: 'Customers, Acquisition & Growth',
      color: 'bg-purple-600',
      questions: ['Who should we target?', 'What is working?', 'What should we test next?']
    },
    'CTO': {
      title: 'Chief Technology Officer',
      desc: 'Technology, Systems & Technical Health',
      color: 'bg-emerald-600',
      questions: ['Is the system healthy?', 'What technical issues need attention?', 'What should engineering prioritize?']
    },
    'CFO': {
      title: 'Chief Financial Officer',
      desc: 'Financial Health, Costs & Economics',
      color: 'bg-amber-600',
      questions: ['What do we know about our finances?', 'What costs need attention?', 'What financial data is missing?']
    }
  };

  const details = roleDetails[role] || {
    title: 'Executive',
    desc: 'Company Operations',
    color: 'bg-indigo-600',
    questions: ['What are you working on?', 'What do you recommend?']
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2 text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${details.color}`}>
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{role}</h1>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{agent.status || 'READY'}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600">{details.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{details.desc}</p>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {messages.length === 0 && !chatMutation.isPending && (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white mb-4 ${details.color}`}>
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">How can I help you today?</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                I am your AI {details.title}. I have full access to the Company Brain and current execution state.
              </p>
              
              <div className="grid grid-cols-1 gap-2 text-left">
                {details.questions.map((q, i) => (
                  <button 
                    key={i}
                    disabled={chatMutation.isPending}
                    onClick={() => handleSend(undefined, q)}
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg text-sm text-slate-700 hover:text-indigo-700 transition-colors font-medium flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                    <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 rotate-180 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {messages.filter((msg: any, idx: number, arr: any[]) => {
            if (idx === 0) return true;
            const prev = arr[idx - 1];
            return !(msg.role === prev.role && msg.content?.trim() === prev.content?.trim());
          }).map((msg: any) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm mt-1 ${details.color}`}>
                  <Briefcase className="w-5 h-5" />
                </div>
              )}
              
              <div className={`rounded-2xl p-4 max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.role !== 'user' && <div className="font-bold text-xs text-slate-500 mb-2">{role}</div>}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-4 justify-start">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm mt-1 ${details.color}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm font-medium text-slate-500 animate-pulse">{role} is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={(e) => handleSend(e)} className="relative flex items-center">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder={`Ask your ${role} about your company...`}
              disabled={chatMutation.isPending}
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
            />
            <Button 
              type="submit" 
              disabled={chatMutation.isPending || !input.trim()} 
              className="absolute right-2 rounded-full w-10 h-10 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
          <p className="text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-3">
            Powered by ItWield Executive Intelligence
          </p>
        </div>
      </div>

    </div>
  );
}

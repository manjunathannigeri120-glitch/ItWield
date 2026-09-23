import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User } from 'lucide-react';

export function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const queryClient = useQueryClient();

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

  const { data: runs = [] } = useQuery({
    queryKey: ['runs', id],
    queryFn: async () => {
      const res = await api.get(`/agents/${id}/runs`);
      return res.data;
    }
  });

  const currentRun = runs[0];

  const { data: events = [] } = useQuery({
    queryKey: ['events', currentRun?.id],
    queryFn: async () => {
      if (!currentRun) return [];
      const res = await api.get(`/agents/runs/${currentRun.id}/events`);
      return res.data;
    },
    enabled: !!currentRun,
    refetchInterval: 1000 // Poll for live events
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
      setConversationId(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      // Invalidate runs if we show them
      queryClient.invalidateQueries({ queryKey: ['runs', id] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to send message');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    
    // Optimistic UI could be added here, but for simplicity we rely on mutation + react-query refetch
    chatMutation.mutate(input);
    setInput('');
  };

  if (agentLoading) return <div className="p-8">Loading agent...</div>;

  return (
    <div className="flex h-full">
      {/* Agent Info Panel */}
      <div className="w-64 border-r bg-muted/20 p-4 flex flex-col gap-4">
        <div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">{agent?.name}</h2>
          <p className="text-sm text-muted-foreground">{agent?.description}</p>
        </div>
        
        <div className="text-xs space-y-2 mt-4 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-green-500">{agent?.status}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !chatMutation.isPending && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Send a message to start the conversation
            </div>
          )}
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/50 border'}`}>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="rounded-lg p-3 bg-muted/50 border flex items-center">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-background border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Message your agent..." 
              disabled={chatMutation.isPending}
            />
            <Button type="submit" disabled={chatMutation.isPending || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Activity Timeline Panel */}
      <div className="w-72 border-l bg-muted/10 p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Activity Log</h3>
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No activity yet.</div>
        ) : (
          <div className="space-y-4">
            {events.map((ev: any) => (
              <div key={ev.id} className="text-sm relative pl-4 border-l-2 border-primary/20">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary/50" />
                <div className="font-medium">
                  {ev.event_type.replace('_', ' ')}
                </div>
                {ev.tool_name && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Tool: <span className="font-mono text-primary">{ev.tool_name}</span>
                  </div>
                )}
                {ev.duration_ms && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Took: {ev.duration_ms}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

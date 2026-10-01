const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const tOld = `<div className="text-3xl font-black text-slate-900">20</div>`;
const tNew = `<div className="text-3xl font-black text-slate-900">{primaryGoal.target || 'N/A'}</div>`;
content = content.replace(tOld, tNew);

const cOld = `<div className="text-3xl font-black text-indigo-600">3</div>`;
const cNew = `<div className="text-3xl font-black text-indigo-600">{primaryGoal.current_metric || 0}</div>`;
content = content.replace(cOld, cNew);

const gOld = `<div className="text-3xl font-black text-rose-600">17</div>`;
const gNew = `<div className="text-3xl font-black text-rose-600">{primaryGoal.target ? primaryGoal.target - (primaryGoal.current_metric || 0) : 'N/A'}</div>`;
content = content.replace(gOld, gNew);

let fixChatFn = `  const handleControl = async (action: 'pause' | 'resume' | 'stop') => {
    if (!workspace) return;
    try {
      const stateMap = { pause: "PAUSED", resume: "OPERATING", stop: "STOPPED" };
      await api.post(\`/workspaces/\${workspace.id}/control/state\`, { state: stateMap[action] });
      loadData();
    } catch (e) {
      console.error(\`Failed to \${action}:\`, e);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !workspace) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
      const res = await api.post(\`/workspaces/\${workspace.id}/chat\`, { message: userMsg });
      setChatHistory(prev => [...prev, { role: 'system', text: res.data.reply }]);
      loadData(); // refresh goals
    } catch(err: any) {
      setChatHistory(prev => [...prev, { role: 'system', text: "I'm sorry, I encountered an error communicating with the executive team." }]);
    }
  };
`;

content = content.replace(/const handleControl = async [\s\S]*?\};\n/, fixChatFn);

const uiOld = `        {/* 6. HEALTH & ACTIVITY */}
        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Company Health`;

const uiNew = `        {/* 6. AI COMPANY CHAT */}
        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm h-[450px] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0 bg-slate-900 text-white rounded-t-xl">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> AI Company Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">CEO</span>
                  </div>
                  <div className="bg-white border border-slate-200 text-slate-800 text-sm p-3 rounded-lg shadow-sm">
                    Good morning. I am your AI CEO. How can I direct the company today?
                  </div>
                </div>
                {chatHistory.map((msg, i) => (
                  <div key={i} className={\`flex gap-3 \${msg.role === 'user' ? 'justify-end' : ''}\`}>
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">CEO</span>
                      </div>
                    )}
                    <div className={\`text-sm p-3 rounded-lg shadow-sm max-w-[85%] \${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}\`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 bg-white border-t border-slate-200">
                <form onSubmit={handleChat} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="E.g. Get me 20 customers..."
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">Send</Button>
                </form>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Company Health`;

content = content.replace(uiOld, uiNew);

fs.writeFileSync(file, content);

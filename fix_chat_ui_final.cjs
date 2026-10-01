const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `<div className="space-y-8">\n          <Card className="border-slate-200 shadow-sm">`;
const replacement = `<div className="space-y-8">
          {/* AI COMPANY CHAT */}
          <Card className="border-slate-200 shadow-sm h-[400px] flex flex-col">
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
          
          <Card className="border-slate-200 shadow-sm">`;

if (content.includes(anchor)) {
    content = content.replace(anchor, replacement);
    fs.writeFileSync(file, content);
    console.log("Chat injected successfully.");
} else {
    console.log("Could not find anchor to inject chat.");
}

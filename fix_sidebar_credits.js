const fs = require('fs');
let layout = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');

const target = `<div className="p-4 border-t">
          <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>`;

const replacement = `<div className="p-4 border-t space-y-4">
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('trigger_upgrade'))}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-bold text-white bg-[#0057FF] hover:bg-[#004DE6] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Plans & Billing
          </button>

          <div className="bg-slate-50 border p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Compute</span>
              {loadingCredits ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              ) : (
                <span className={"text-xs font-bold " + (credits !== null && credits <= 0 ? "text-red-500" : "text-[#0057FF]")}>
                  {credits !== null ? credits.toLocaleString() : '?'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div 
                className={"h-1.5 rounded-full transition-all " + (credits !== null && credits <= 0 ? "bg-red-500" : "bg-[#0057FF]")} 
                style={{ width: \`\${Math.min(100, Math.max(0, ((credits || 0) / 10000) * 100))}%\` }} 
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2 text-slate-500 truncate">{user?.email}</div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>`;

layout = layout.replace(target, replacement);

// Also verify if LogoIcon is rendered instead of Bot.
// The user screenshot actually shows LogoIcon but with the text "ItWield" next to it. Wait, the screenshot shows a small hexagon with a dot in the middle, and the text "ItWield". It doesn't look like my massive gold hexagon. Oh, wait, in DashboardLayout I rendered `<LogoIcon className="w-8 h-8" />` which is my custom SVG. The screenshot shows a default lucide-react icon!
// Wait! They said "at right top change the logo with new one". Right top? Or Left top? In the sidebar, it's left top.
// Let's replace the whole sidebar header.
const headerTarget = `<div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LogoIcon className="w-8 h-8" />
            <span className="font-black tracking-tighter uppercase text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>
          </h1>
        </div>`;

const headerReplacement = `<div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 drop-shadow-md" />
            <span className="font-black tracking-tighter uppercase text-xl text-slate-900" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>
          </div>
        </div>`;

layout = layout.replace(headerTarget, headerReplacement);

fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', layout);

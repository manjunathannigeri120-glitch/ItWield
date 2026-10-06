const fs = require('fs');
let layout = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');

// 1. Add Sidebar UI (Plans + Compute Bar)
layout = layout.replace(/<div className="p-4 border-t">[\s\S]*?<\/Button>[\s\S]*?<\/div>/,
`<div className="p-4 border-t space-y-4">
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('trigger_upgrade'))}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-md text-sm font-bold text-white bg-[#0057FF] hover:bg-[#004DE6] transition-colors"
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
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={"h-full transition-all " + (credits !== null && credits <= 0 ? "bg-red-500" : "bg-[#0057FF]")} 
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
        </div>`);

// 2. Fix the LogoIcon in the sidebar header
layout = layout.replace(/<LogoIcon className="w-8 h-8" \/>\s*<span className="font-black/g, '<LogoIcon className="w-8 h-8 drop-shadow-md" />\n            <span className="font-black');
// Wait, the actual code has:
// <LogoIcon className="w-8 h-8" />
// <span className="font-black tracking-tighter uppercase text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>

fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', layout);

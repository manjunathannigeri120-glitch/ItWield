const fs = require('fs');
let layout = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');

const target = `<main className="flex-1 overflow-auto">
        {children}
      </main>`;
const replacement = `<main className="flex-1 overflow-auto relative">
        {children}
        
        {/* Hard Paywall Overlay */}
        {credits !== null && credits <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 text-center max-w-md animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">AI Compute Exhausted</h2>
              <p className="text-slate-500 mb-6 text-sm">Your workspace has run out of AI compute credits. All autonomous agents have been paused. Please upgrade your plan to resume operations.</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('trigger_upgrade'))} 
                className="w-full py-3 bg-[#0057FF] hover:bg-[#004DE6] text-white rounded-xl font-bold shadow-md transition-all hover:shadow-lg"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </main>`;

layout = layout.replace(target, replacement);
fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', layout);

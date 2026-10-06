const fs = require('fs');
let pricing = fs.readFileSync('frontend/src/components/landing/LandingPricing.tsx', 'utf8');

// Fix Business badge and elevation
pricing = pricing.replace('border-2 border-indigo-500/30 rounded-[32px] p-6 flex flex-col relative hover:border-indigo-400 transition-colors', 'border-2 border-indigo-500/50 rounded-[32px] p-6 flex flex-col relative shadow-xl shadow-indigo-900/20 hover:border-indigo-400 transition-colors lg:-mt-4 lg:mb-4');
pricing = pricing.replace('bg-slate-700 text-[#111827] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Popular', 'bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Popular');

// Fix buttons contrast
pricing = pricing.replace('bg-indigo-600 hover:bg-indigo-600 text-[#111827]', 'bg-[#0057FF] hover:bg-[#004DE6] text-white shadow-md');
pricing = pricing.replace('className="w-full py-2.5 bg-white shadow-sm border border-slate-100 hover:bg-slate-700 text-[#111827] text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start with Business', 'className="w-full py-2.5 bg-[#0057FF] shadow-sm border border-[#0057FF] hover:bg-[#004DE6] text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Start with Business');

fs.writeFileSync('frontend/src/components/landing/LandingPricing.tsx', pricing);

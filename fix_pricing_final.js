const fs = require('fs');
let pricing = fs.readFileSync('frontend/src/components/landing/LandingPricing.tsx', 'utf8');

// POPULAR Badges
pricing = pricing.replace('bg-indigo-600 text-[#111827]', 'bg-emerald-100 text-emerald-700');
pricing = pricing.replace('bg-slate-700 text-[#111827]', 'bg-emerald-100 text-emerald-700');

// ENTERPRISE Card background
pricing = pricing.replace('bg-[#111827] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] \r\np-6 flex flex-col hover:border-slate-500 transition-colors', 'bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col hover:border-slate-300 transition-colors');
pricing = pricing.replace('bg-[#111827] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] \np-6 flex flex-col hover:border-slate-500 transition-colors', 'bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col hover:border-slate-300 transition-colors');

// If the regex replacement didn't perfectly hit the line breaks:
pricing = pricing.replace(/className="bg-\[\#111827\] border border-slate-100 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] rounded-\[32px\]\s+p-6 flex flex-col hover:border-slate-500 transition-colors"/, 'className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 flex flex-col hover:border-slate-300 transition-colors"');

// Talk to Sales button
pricing = pricing.replace('bg-white shadow-sm border border-slate-100 hover:bg-slate-700 text-[#111827]', 'bg-[#0057FF] shadow-sm border border-[#0057FF] hover:bg-[#004DE6] text-white');
// Fallback if previous replacement messed with it
pricing = pricing.replace('hover:bg-slate-700 text-[#111827] text-sm font-bold text-center rounded-xl mb-6 transition-colors">Talk to Sales', 'bg-[#0057FF] shadow-sm border border-[#0057FF] hover:bg-[#004DE6] text-white text-sm font-bold text-center rounded-xl mb-6 transition-colors">Talk to Sales');


fs.writeFileSync('frontend/src/components/landing/LandingPricing.tsx', pricing);

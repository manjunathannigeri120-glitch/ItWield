const fs = require('fs');

// 1. LandingFAQ.tsx Footer
let faq = fs.readFileSync('frontend/src/components/landing/LandingFAQ.tsx', 'utf8');
faq = "import { LogoIcon } from '@/components/ui/LogoIcon';\n" + faq;
faq = faq.replace(/<div className="w-8 h-8 rounded-full bg-\[\#0057FF\] flex items-center justify-center">[\s\S]*?<Terminal className="w-4 h-4 text-white" \/>[\s\S]*?<\/div>[\s\S]*?<span className="text-xl font-bold text-\[\#111827\] tracking-tight">ItWield<\/span>/, 
'<LogoIcon className="w-8 h-8" />\n                <span className="text-2xl font-black text-[#111827] tracking-tighter uppercase" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>');
fs.writeFileSync('frontend/src/components/landing/LandingFAQ.tsx', faq);


// 2. DashboardLayout.tsx Logo
let layout = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');
layout = layout.replace(/<Bot className="w-6 h-6 text-primary" \/>\s*ItWield/, 
'<LogoIcon className="w-8 h-8" />\n            <span className="font-black tracking-tighter uppercase text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>');
fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', layout);

const fs = require('fs');

// 1. LandingNav.tsx
let nav = fs.readFileSync('frontend/src/components/landing/LandingNav.tsx', 'utf8');
nav = "import { LogoIcon } from '@/components/ui/LogoIcon';\n" + nav;

const oldLogo = `<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Terminal className="w-4 h-4 text-[#111827]" />
          </div>`;
nav = nav.replace(oldLogo, `<LogoIcon className="w-8 h-8" />`);

// For any other corrupted spans from earlier that might not have been matched
nav = nav.replace('<span className="text-xl font-bold text-[#111827] tracking-tight">ItWield</span>', '<span className="text-2xl font-black text-[#111827] tracking-tighter uppercase" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>');
fs.writeFileSync('frontend/src/components/landing/LandingNav.tsx', nav);

// 2. DashboardLayout.tsx
let layout = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');
layout = "import { LogoIcon } from '@/components/ui/LogoIcon';\n" + layout;
layout = layout.replace('<Bot className="w-6 h-6 text-primary" />\n            ItWield', '<LogoIcon className="w-8 h-8" />\n            <span className="font-black tracking-tighter uppercase text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>');
fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', layout);

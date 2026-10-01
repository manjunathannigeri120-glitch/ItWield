const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Lucide icon
content = content.replace(
  "import { LayoutDashboard, Users, Zap, Briefcase, Settings, LogOut, CheckSquare, Plus, Activity, Cpu } from 'lucide-react';",
  "import { LayoutDashboard, Users, Zap, Briefcase, Settings, LogOut, CheckSquare, Plus, Activity, Cpu, Coins } from 'lucide-react';"
);
content = content.replace(
  "import { LayoutDashboard, Target, Users, Settings, LogOut, Briefcase, CheckSquare, Cpu } from 'lucide-react';",
  "import { LayoutDashboard, Target, Users, Settings, LogOut, Briefcase, CheckSquare, Cpu, Coins } from 'lucide-react';"
);

// Fetch credits
content = content.replace(
  "const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({",
  "const { data: creditsData } = useQuery({\n    queryKey: ['workspace-credits', currentWorkspace?.id],\n    queryFn: async () => {\n      if (!currentWorkspace?.id) return { credits: 200 };\n      const res = await api.get(`/workspaces/${currentWorkspace.id}/credits`);\n      return res.data;\n    },\n    enabled: !!currentWorkspace?.id\n  });\n\n  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({"
);

// Render credits in sidebar (above bottom section)
content = content.replace(
  "          {/* Bottom Section */}",
  "          {/* Credits Counter */}\n          {currentWorkspace && (\n            <div className=\"px-4 mb-4\">\n              <div className=\"bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center justify-between\">\n                <div className=\"flex items-center gap-2\">\n                  <Coins className=\"w-4 h-4 text-yellow-400\" />\n                  <span className=\"text-xs font-medium text-slate-300\">AI Credits</span>\n                </div>\n                <span className=\"text-xs font-bold text-white\">{creditsData?.credits || 0}</span>\n              </div>\n            </div>\n          )}\n\n          {/* Bottom Section */}"
);

fs.writeFileSync(file, content);
console.log('Added credits to dashboard layout');

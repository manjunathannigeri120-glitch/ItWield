const fs = require('fs');

// Fix DashboardLayout.tsx (already fixed import, wait, did I?)
let c = fs.readFileSync('frontend/src/layouts/DashboardLayout.tsx', 'utf8');
if (!c.includes('Target } from \'lucide-react\'')) {
  c = c.replace(/import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket } from 'lucide-react';/, "import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket, Target } from 'lucide-react';");
}
fs.writeFileSync('frontend/src/layouts/DashboardLayout.tsx', c);

// Fix Missions.tsx
c = fs.readFileSync('frontend/src/pages/Missions.tsx', 'utf8');
c = c.replace("import { Textarea } from '@/components/ui/textarea';", "");
c = c.replace("import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';", "");
c = c.replace(/<Textarea/g, "<textarea");
c = c.replace(/<\/Textarea>/g, "</textarea>");
c = c.replace(/<Select value=\{formData\.type\} onValueChange=\{v => setFormData\(\{\.\.\.formData, type: v\}\)\}>[\s\S]*?<\/Select>/g, \<select className="w-full border p-2 rounded" value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
  <option value="GET_CUSTOMERS">Get Customers</option>
  <option value="UNDERSTAND_COMPETITORS">Understand Competitors</option>
  <option value="IMPROVE_PRODUCT">Improve Product</option>
  <option value="MONITOR_BUSINESS">Monitor Business</option>
  <option value="REDUCE_MANUAL_WORK">Reduce Manual Work</option>
</select>\);
c = c.replace(/onChange=\{e => /g, "onChange={(e: any) => ");
fs.writeFileSync('frontend/src/pages/Missions.tsx', c);

// Fix Settings.tsx
c = fs.readFileSync('frontend/src/pages/Settings.tsx', 'utf8');
c = c.replace(/workspaces\?\.find\(w => /g, "workspaces?.find((w: any) => ");
fs.writeFileSync('frontend/src/pages/Settings.tsx', c);

console.log('patched ts errors');

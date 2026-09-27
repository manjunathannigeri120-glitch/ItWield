import re

p = 'frontend/src/layouts/DashboardLayout.tsx'
with open(p, 'r') as f:
    c = f.read()
if "Target } from 'lucide-react'" not in c:
    c = c.replace(
        "import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket } from 'lucide-react';",
        "import { Home, Bot, BookOpen, GitMerge, Settings, LogOut, Menu, Users, Database, Rocket, Target } from 'lucide-react';"
    )
with open(p, 'w') as f:
    f.write(c)

p = 'frontend/src/pages/Missions.tsx'
with open(p, 'r') as f:
    c = f.read()
c = c.replace("import { Textarea } from '@/components/ui/textarea';", "")
c = c.replace("import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';", "")
c = c.replace("<Textarea", "<textarea")
c = c.replace("</Textarea>", "</textarea>")
c = re.sub(
    r'<Select value=\{formData\.type\} onValueChange=\{v => setFormData\(\{\.\.\.formData, type: v\}\)\}>[\s\S]*?<\/Select>',
    """<select className="w-full border p-2 rounded" value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
  <option value="GET_CUSTOMERS">Get Customers</option>
  <option value="UNDERSTAND_COMPETITORS">Understand Competitors</option>
  <option value="IMPROVE_PRODUCT">Improve Product</option>
  <option value="MONITOR_BUSINESS">Monitor Business</option>
  <option value="REDUCE_MANUAL_WORK">Reduce Manual Work</option>
</select>""",
    c
)
c = c.replace("onChange={e => ", "onChange={(e: any) => ")
with open(p, 'w') as f:
    f.write(c)

p = 'frontend/src/pages/Settings.tsx'
with open(p, 'r') as f:
    c = f.read()
c = c.replace("workspaces?.find(w => ", "workspaces?.find((w: any) => ")
with open(p, 'w') as f:
    f.write(c)

print("patched")

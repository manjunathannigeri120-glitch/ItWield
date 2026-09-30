import fs from 'fs';
let file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useAuthStore } from '@/store/authStore';",
  "import { useAuth } from '@/hooks/useAuth';"
);
content = content.replace(
  "const { user } = useAuthStore();",
  "const { user } = useAuth();"
);
content = content.replace(
  "const [isOperating, setIsOperating] = useState(false);",
  ""
);
content = content.replace(
  "const workers = agents.filter(a => !['CEO', 'COO', 'CMO', 'CTO', 'CFO'].some(role => a.name.includes(role)));",
  ""
);
content = content.replace(
  "import { Loader2, Activity, AlertCircle, ArrowRight, Sparkles, Play, Pause, Square, MessageSquare, Target, Users, Zap, Shield, Briefcase } from 'lucide-react';",
  "import { Loader2, Activity, AlertCircle, ArrowRight, Play, Pause, Square, MessageSquare, Target, Zap, Shield, Briefcase } from 'lucide-react';"
);
content = content.replace(
  "const { user } = useAuth();",
  ""
); // I will just remove user since I don't need it for now.

fs.writeFileSync(file, content);

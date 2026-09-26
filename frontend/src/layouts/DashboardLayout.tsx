import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Home, Settings, Rocket, GitMerge, Users, Database, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Command Center', href: '/dashboard', icon: Home },
    { name: 'Goals', href: '/dashboard', icon: Target },
    { name: 'Missions', href: '/missions', icon: Rocket },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Workforce', href: '/agents', icon: Bot },
    { name: 'Connections', href: '/connections', icon: GitMerge },
    { name: 'Approvals', href: '/dashboard', icon: Target, disabled: false },
    { name: 'Company Brain', href: '/memory', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            ItWield
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.disabled ? '#' : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.href 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
              {item.disabled && <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

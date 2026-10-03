import { LogoIcon } from '@/components/ui/LogoIcon';
import { UpgradeModal } from '@/components/UpgradeModal';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Home, Settings, Rocket, GitMerge, Users, Database, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [creditError, setCreditError] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const wsRes = await api.get('/workspaces');
        if (wsRes.data && wsRes.data.length > 0) {
          const wsId = wsRes.data[0].id;
          const credRes = await api.get(`/workspaces/${wsId}/credits`);
          setCredits(credRes.data.credits);
        }
      } catch (err) {
        setCreditError('Error loading credits');
      } finally {
        setLoadingCredits(false);
      }
    };
    fetchCredits();

    const handleCreditUpdate = (e: any) => {
      if (typeof e.detail === 'number') {
        setCredits(e.detail);
      }
    };
    window.addEventListener('credits_updated', handleCreditUpdate);
    return () => window.removeEventListener('credits_updated', handleCreditUpdate);
  }, []);
  const location = useLocation();
  const { user } = useAuth();

  const [accountOpen, setAccountOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/me');
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('Failed to delete account. Please try again or contact support.');
      }
    }
  };

  const navItems = [
    { name: 'Command Center', href: '/dashboard', icon: Home },
    { name: 'Goals', href: '/missions', icon: Target },
    { name: 'Missions', href: '/missions', icon: Rocket },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Workforce', href: '/agents', icon: Bot },
      { name: 'CTO Operations', href: '/cto', icon: Bot },
    { name: 'Control Layer', href: '/control', icon: GitMerge },
    { name: 'Connections', href: '/connections', icon: GitMerge },
    { name: 'Approvals', href: '/approvals', icon: Target, disabled: false },
    { name: 'Company Brain', href: '/memory', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LogoIcon className="w-8 h-8 drop-shadow-md" />
            <span className="font-black tracking-tighter uppercase text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>ITWIELD</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {(true) && (
            <Link to="/system-core-admin" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 mb-4">
              <span className="w-4 h-4 text-center">??</span>
              God Mode
            </Link>
          )}
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

        <div className="p-4 border-t space-y-4">
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('trigger_upgrade'))}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-md text-sm font-bold text-white bg-[#0057FF] hover:bg-[#004DE6] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Plans & Billing
          </button>

          <div className="bg-slate-50 border p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Compute</span>
              {loadingCredits ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              ) : (
                <span className={"text-xs font-bold " + (credits !== null && credits <= 0 ? "text-red-500" : "text-[#0057FF]")}>
                  {credits !== null ? credits.toLocaleString() : '?'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={"h-full transition-all " + (credits !== null && credits <= 0 ? "bg-red-500" : "bg-[#0057FF]")} 
                style={{ width: `${Math.min(100, Math.max(0, ((credits || 0) / 10000) * 100))}%` }} 
              />
            </div>
          </div>

          <div className="pt-2 border-t relative">
            <Link to="/account">
                            <Button variant={location.pathname === '/account' ? 'default' : 'outline'} size="sm" className="w-full text-sm font-medium flex items-center justify-start gap-2 overflow-hidden">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  {profile?.name || user?.email || 'Account'}
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <NotificationsDropdown />
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
      </main>
      <UpgradeModal />
    </div>
  );
}












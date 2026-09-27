import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        const mockSession = localStorage.getItem('sb-mock-session');
        if (mockSession) {
          const parsed = JSON.parse(mockSession);
          setSession(parsed);
          setUser(parsed.user);
          setLoading(false);
          return;
        }
      }
      setSession(session);
      if (!session && localStorage.getItem('sb-mock-session')) { const parsed = JSON.parse(localStorage.getItem('sb-mock-session')!); setSession(parsed); setUser(parsed.user); } else { setUser(session?.user ?? null); }
      setLoading(false);
    }).catch(() => {
      const mockSession = localStorage.getItem('sb-mock-session');
      if (mockSession) {
        const parsed = JSON.parse(mockSession);
        setSession(parsed);
        setUser(parsed.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && localStorage.getItem('sb-mock-session')) { const parsed = JSON.parse(localStorage.getItem('sb-mock-session')!); setSession(parsed); setUser(parsed.user); } else { setUser(session?.user ?? null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}


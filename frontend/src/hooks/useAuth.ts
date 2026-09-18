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
      setUser(session?.user ?? null);
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
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; import { api } from '@/lib/api';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  // Helper to load the first workspace for the user
  const loadWorkspace = async () => {
    try {
      const res = await api.get('/workspaces');
      const ws = res.data?.[0] ?? null;
      setCurrentWorkspace(ws);
    } catch (e) {
      console.error('Failed to load workspace', e);
      setCurrentWorkspace(null);
    }
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        const mockSession = localStorage.getItem('sb-mock-session');
        if (mockSession) {
          const parsed = JSON.parse(mockSession);
          setSession(parsed);
          setUser(parsed.user);
          loadWorkspace();
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      loadWorkspace();
      setLoading(false);
    }).catch(() => {
      const mockSession = localStorage.getItem('sb-mock-session');
      if (mockSession) {
        const parsed = JSON.parse(mockSession);
        setSession(parsed);
        setUser(parsed.user);
        loadWorkspace();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadWorkspace();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading, currentWorkspace };
}


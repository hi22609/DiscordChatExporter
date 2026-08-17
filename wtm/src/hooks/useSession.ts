import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useSessionInit() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }
}

export function useAuth() {
  // useShallow: the selector builds a new object each call — without shallow
  // comparison every store change re-renders every consumer.
  return useAuthStore(
    useShallow((s) => ({
      session: s.session,
      user: s.user,
      profile: s.profile,
      isLoading: s.isLoading,
      isAuthenticated: !!s.session,
    }))
  );
}

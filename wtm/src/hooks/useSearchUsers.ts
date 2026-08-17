import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useSearchUsers(query: string) {
  const myId = useAuthStore((s) => s.user?.id);

  return useQuery<SearchUser[]>({
    queryKey: ['users', 'search', query],
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const term = query.trim().toLowerCase().replace(/^@/, '');
      // public_profiles, not profiles: the table is own-row-only under RLS, and
      // the view already excludes banned accounts so no caller can forget to.
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `${term}%`)
        .neq('id', myId ?? '')
        .limit(12);
      if (error) throw error;
      return (data ?? []) as SearchUser[];
    },
  });
}

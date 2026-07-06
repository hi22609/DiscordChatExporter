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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `${term}%`)
        .neq('id', myId ?? '')
        .eq('is_banned', false)
        .limit(12);
      if (error) throw error;
      return (data ?? []) as SearchUser[];
    },
  });
}

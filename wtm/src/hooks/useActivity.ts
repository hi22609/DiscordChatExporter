import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/log';
import { useAuthStore } from '@/store/authStore';
import type { ActivityItem } from '@/types/app';

const ACTIVITY_KEY = ['activity'] as const;
const UNREAD_KEY   = ['activity', 'unread'] as const;

export function useActivityFeed() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  const query = useQuery<ActivityItem[]>({
    queryKey: ACTIVITY_KEY,
    enabled: !!userId,
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          id, type, actor_id, move_id, read, created_at,
          actor:actor_id ( username, avatar_url ),
          move:move_id ( title, category )
        `)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as ActivityItem[];
    },
  });

  // Realtime: new row in activity_feed for this user → refetch
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`activity-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ACTIVITY_KEY });
          qc.invalidateQueries({ queryKey: UNREAD_KEY });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return query;
}

export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery<number>({
    queryKey: UNREAD_KEY,
    enabled: !!userId,
    staleTime: 15_000,
    // No refetchInterval: the realtime INSERT subscription above already
    // invalidates this key. Polling every 60s per user per foreground minute
    // was ~60k redundant count queries a day at 2k users.
    queryFn: async () => {
      const { count, error } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// Takes no argument on purpose: the function derives the user from auth.uid()
// server-side. Passing a caller-supplied id let anyone clear anyone's feed.
export async function markAllRead() {
  const { error } = await supabase.rpc('mark_activity_read');
  if (error) log.warn('activity', `mark_activity_read failed: ${error.message}`);
}

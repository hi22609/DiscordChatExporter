import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types/app';

const PAGE = 30;

export function useMoveChat(moveId: string) {
  const qc     = useAuthStore.getState;
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  const KEY    = ['move', moveId, 'chat'] as const;

  const query = useInfiniteQuery({
    queryKey: KEY,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('move_messages')
        .select('*, profile:profiles(username, display_name, avatar_url)')
        .eq('move_id', moveId)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
    initialPageParam: 0,
    getNextPageParam: (last, all) => last.length === PAGE ? all.length : undefined,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
  });

  // Realtime: new messages arrive → prepend + invalidate for accurate profile data
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${moveId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'move_messages', filter: `move_id=eq.${moveId}` },
        () => { client.invalidateQueries({ queryKey: KEY }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [moveId, client]);

  // Mark read when chat is mounted
  useEffect(() => {
    supabase.rpc('mark_chat_read', { p_move_id: moveId }).catch(() => {});
  }, [moveId]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('move_messages')
        .insert({ move_id: moveId, user_id: userId!, content: content.trim() });
      if (error) throw error;
    },
    onSettled: () => { client.invalidateQueries({ queryKey: KEY }); },
  });

  // Messages in chronological order (oldest first, scroll to bottom)
  const messages = (query.data?.pages.flat() ?? []).slice().reverse();

  return {
    messages,
    isLoading: query.isLoading,
    sendMutation,
    fetchOlder: query.fetchNextPage,
    hasOlder: query.hasNextPage,
  };
}

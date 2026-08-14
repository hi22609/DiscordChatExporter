import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types/app';
import { log } from '@/lib/log';

const PAGE = 30;

export function useMoveChat(moveId: string) {
  const qc     = useAuthStore.getState;
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  const KEY    = ['move', moveId, 'chat'] as const;

  const query = useInfiniteQuery({
    queryKey: KEY,
    queryFn: async ({ pageParam = 0 }) => {
      // An RPC, not an embed. `profiles` is own-row-only under RLS now, and
      // PostgREST resolves embeds through RLS — so `profiles(...)` would have
      // rendered every message but your own with a blank author. The function
      // enforces the same visibility rule the table policy does: you can read a
      // move's chat if you are going, or if it is your move.
      const { data, error } = await supabase.rpc('move_chat_page', {
        p_move_id: moveId,
        p_offset: (pageParam as number) * PAGE,
        p_limit: PAGE,
      });
      if (error) throw error;
      return (data ?? []).map(
        (r): ChatMessage => ({
          id: r.id,
          move_id: r.move_id,
          user_id: r.user_id,
          content: r.content,
          created_at: r.created_at,
          profile: {
            username: r.username,
            display_name: r.display_name,
            avatar_url: r.avatar_url,
          },
        })
      );
    },
    initialPageParam: 0,
    getNextPageParam: (last, all) => last.length === PAGE ? all.length : undefined,
    staleTime: 30_000, // history that already loaded cannot change
    gcTime: 2 * 60 * 1000,
  });

  // Realtime: append the new row to the first page instead of invalidating.
  // Invalidating an infinite query refetches EVERY loaded page, so in a busy
  // chat each message multiplied into (attendees x loaded pages) joined
  // queries — thousands per minute on one move.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${moveId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'move_messages', filter: `move_id=eq.${moveId}` },
        async (payload) => {
          const row = payload.new as Omit<ChatMessage, 'profile'> | undefined;
          if (!row) return;

          // The realtime payload is the raw table row, so it carries no author.
          // Reuse one already in the cache when we have it, and only reach for
          // public_profiles the first time someone speaks.
          const cached = client.getQueryData<{ pages: ChatMessage[][] }>(KEY);
          let profile =
            cached?.pages.flat().find((m) => m.user_id === row.user_id)?.profile ?? null;

          if (!profile) {
            const { data } = await supabase
              .from('public_profiles')
              .select('username, display_name, avatar_url')
              .eq('id', row.user_id)
              .single();
            profile = data ?? null;
          }

          client.setQueryData<{ pages: ChatMessage[][]; pageParams: unknown[] }>(KEY, (prev) => {
            if (!prev?.pages?.length) return prev;
            const [first, ...rest] = prev.pages;
            if (first.some((m) => m.id === row.id)) return prev; // already have it
            return { ...prev, pages: [[{ ...row, profile }, ...first], ...rest] };
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [moveId, client]);

  // Mark read when chat is mounted
  useEffect(() => {
    // PostgrestBuilder is a thenable, not a Promise — it has no .catch().
    // Errors come back on the resolved value instead.
    void supabase
      .rpc('mark_chat_read', { p_move_id: moveId })
      .then(({ error }) => {
        if (error) log.warn('chat', `mark_chat_read failed: ${error.message}`);
      });
  }, [moveId]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('move_messages')
        .insert({ move_id: moveId, user_id: userId!, content: content.trim() });
      if (error) throw error;
    },
    // No invalidate here: the realtime INSERT echo above already lands this
    // message in the cache. Invalidating as well refetched every loaded page.
    onError: (err) => { log.warn('chat', `send failed: ${String(err)}`); },
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

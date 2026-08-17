import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Reaction, ReactionEmoji } from '@/types/app';

const EMOJIS: ReactionEmoji[] = ['🔥', '❤️', '👀', '💯', '🙌'];

export function useReactions(moveId: string) {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const KEY    = ['reactions', moveId] as const;

  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('move_reaction_counts')
        .select('emoji, total, i_reacted')
        .eq('move_id', moveId);
      if (error) throw error;

      // Ensure all emojis appear even with 0 count
      const map = new Map((data ?? []).map((r) => [r.emoji, r]));
      return EMOJIS.map((e) => ({
        emoji: e,
        total: map.get(e)?.total ?? 0,
        i_reacted: map.get(e)?.i_reacted ?? false,
      }));
    },
    staleTime: 15_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (emoji: ReactionEmoji) => {
      const current = reactions.find((r) => r.emoji === emoji);
      if (current?.i_reacted) {
        const { error } = await supabase
          .from('move_reactions')
          .delete()
          .eq('move_id', moveId)
          .eq('user_id', userId!)
          .eq('emoji', emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('move_reactions')
          .insert({ move_id: moveId, user_id: userId!, emoji });
        if (error) throw error;
      }
    },
    onMutate: async (emoji) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Reaction[]>(KEY);

      qc.setQueryData<Reaction[]>(KEY, (old = []) =>
        old.map((r) =>
          r.emoji !== emoji ? r : {
            ...r,
            i_reacted: !r.i_reacted,
            total: r.i_reacted ? Math.max(0, r.total - 1) : r.total + 1,
          }
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: KEY }); },
  });

  return { reactions, toggle: (emoji: ReactionEmoji) => toggleMutation.mutate(emoji) };
}

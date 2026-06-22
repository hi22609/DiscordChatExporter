import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { MoveWithCounts } from '@/types/app';

export function useRSVP(moveId: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('rsvps')
        .insert({ move_id: moveId, user_id: userId!, status: 'going' });
      if (error) {
        if (error.message.includes('move_full')) throw new Error('move_full');
        throw error;
      }
      // Trigger push notification to move creator
      await supabase.functions.invoke('send-push-notification', {
        body: { type: 'new_rsvp', moveId, actorId: userId },
      });
    },
    onMutate: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await qc.cancelQueries({ queryKey: queryKeys.moves.detail(moveId) });

      const prev = qc.getQueryData<MoveWithCounts>(queryKeys.moves.detail(moveId));

      // Optimistic update
      qc.setQueryData<MoveWithCounts>(queryKeys.moves.detail(moveId), (old) =>
        old
          ? {
              ...old,
              attendee_count: old.attendee_count + 1,
              spots_left: old.spots_left != null ? old.spots_left - 1 : null,
              is_full: old.max_attendees != null
                ? old.attendee_count + 1 >= old.max_attendees
                : false,
            }
          : old
      );

      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), 'going');
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.moves.detail(moveId), ctx.prev);
      }
      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.moves.detail(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.rsvps.forMove(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.moves.myUpcoming() });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('move_id', moveId)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.moves.detail(moveId) });
      const prev = qc.getQueryData<MoveWithCounts>(queryKeys.moves.detail(moveId));

      qc.setQueryData<MoveWithCounts>(queryKeys.moves.detail(moveId), (old) =>
        old
          ? {
              ...old,
              attendee_count: Math.max(0, old.attendee_count - 1),
              spots_left: old.spots_left != null ? old.spots_left + 1 : null,
              is_full: false,
            }
          : old
      );
      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), null);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.moves.detail(moveId), ctx.prev);
      }
      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), 'going');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.moves.detail(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.rsvps.forMove(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.moves.myUpcoming() });
    },
  });

  return { joinMutation, leaveMutation };
}

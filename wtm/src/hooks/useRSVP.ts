import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { MoveWithCounts, NearbyMove } from '@/types/app';

/** Optimistically patch a move inside every cached nearby-feed page. */
function patchFeedCaches(
  qc: ReturnType<typeof useQueryClient>,
  moveId: string,
  patch: (m: NearbyMove) => NearbyMove
) {
  qc.setQueriesData<InfiniteData<NearbyMove[]>>(
    { queryKey: ['moves', 'nearby'] },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) =>
              page.map((m) => (m.id === moveId ? patch(m) : m))
            ),
          }
        : data
  );
}

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
      // The activity row is written server-side by the notify_rsvp_to_creator
      // trigger (012:79). The edge function that used to be invoked here was
      // unauthenticated and held the service-role key, so anyone with the
      // bundled anon key could drive unbounded invocations. Removed.
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
      patchFeedCaches(qc, moveId, (m) => ({
        ...m,
        my_status: 'going',
        attendee_count: m.attendee_count + 1,
        spots_left: m.spots_left != null ? m.spots_left - 1 : null,
        is_full: m.max_attendees != null ? m.attendee_count + 1 >= m.max_attendees : false,
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.moves.detail(moveId), ctx.prev);
      }
      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), null);
      patchFeedCaches(qc, moveId, (m) => ({
        ...m,
        my_status: null,
        attendee_count: Math.max(0, m.attendee_count - 1),
        spots_left: m.spots_left != null ? m.spots_left + 1 : null,
        is_full: false,
      }));
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
      patchFeedCaches(qc, moveId, (m) => ({
        ...m,
        my_status: null,
        attendee_count: Math.max(0, m.attendee_count - 1),
        spots_left: m.spots_left != null ? m.spots_left + 1 : null,
        is_full: false,
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.moves.detail(moveId), ctx.prev);
      }
      qc.setQueryData(queryKeys.rsvps.myStatus(moveId), 'going');
      patchFeedCaches(qc, moveId, (m) => ({
        ...m,
        my_status: 'going',
        attendee_count: m.attendee_count + 1,
        spots_left: m.spots_left != null ? m.spots_left - 1 : null,
      }));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.moves.detail(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.rsvps.forMove(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.moves.myUpcoming() });
    },
  });

  return { joinMutation, leaveMutation };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/queryClient';

export function useWaitlist(moveId: string) {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const KEY    = ['waitlist', 'position', moveId] as const;

  const { data: position } = useQuery<number | null>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('waitlist_position', { p_move_id: moveId });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('rsvps')
        .insert({ move_id: moveId, user_id: userId!, status: 'waitlist' });
      if (error) throw error;
    },
    onMutate: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: queryKeys.moves.detail(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.rsvps.myStatus(moveId) });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: queryKeys.moves.detail(moveId) });
      qc.invalidateQueries({ queryKey: queryKeys.rsvps.myStatus(moveId) });
    },
  });

  return { position, joinMutation, leaveMutation };
}

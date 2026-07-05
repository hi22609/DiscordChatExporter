import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { log } from '@/lib/log';

/** Is the given user blocked by me? */
export function useIsBlocked(userId: string) {
  const myId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['blocks', myId, userId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', myId!)
        .eq('blocked_id', userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!myId && !!userId && myId !== userId,
  });
}

export function useBlockUser(userId: string) {
  const qc = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (block: boolean) => {
      if (block) {
        const { error } = await supabase
          .from('blocks')
          .insert({ blocker_id: myId!, blocked_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', myId!)
          .eq('blocked_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: (_d, block) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.setQueryData(['blocks', myId, userId], block);
      // Blocked users' content disappears from all feeds server-side.
      qc.invalidateQueries({ queryKey: ['moves'] });
      qc.invalidateQueries({ queryKey: ['spots'] });
    },
  });
}

export type ReportTarget = 'move' | 'spot' | 'profile';

export async function submitReport(
  reporterId: string,
  targetType: ReportTarget,
  targetId: string,
  reason: string
): Promise<boolean> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
  });
  if (error) {
    // unique violation = already reported by this user; treat as success
    if (error.code === '23505') return true;
    log.warn('report', error.message);
    return false;
  }
  return true;
}

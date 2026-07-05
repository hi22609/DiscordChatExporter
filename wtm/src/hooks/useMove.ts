import { useQuery, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import type { MoveWithCounts, MoveAttendee } from '@/types/app';

/**
 * Warm the detail + attendees caches before navigation — called on press-in,
 * which buys ~100ms of head start over waiting for the tap to complete.
 */
export function prefetchMove(qc: QueryClient, moveId: string) {
  qc.prefetchQuery({
    queryKey: queryKeys.moves.detail(moveId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moves_with_counts')
        .select('*')
        .eq('id', moveId)
        .single();
      if (error) throw error;
      return data as MoveWithCounts;
    },
    staleTime: 1000 * 30,
  });
  qc.prefetchQuery({
    queryKey: queryKeys.rsvps.forMove(moveId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_move_attendees', {
        p_move_id: moveId,
        p_limit: 5,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

export function useMove(moveId: string) {
  return useQuery({
    queryKey: queryKeys.moves.detail(moveId),
    queryFn: async (): Promise<MoveWithCounts> => {
      const { data, error } = await supabase
        .from('moves_with_counts')
        .select('*')
        .eq('id', moveId)
        .single();
      if (error) throw error;
      return data as MoveWithCounts;
    },
    enabled: !!moveId,
  });
}

export function useMoveAttendees(moveId: string, limit = 5) {
  return useQuery({
    queryKey: queryKeys.rsvps.forMove(moveId),
    queryFn: async (): Promise<MoveAttendee[]> => {
      const { data, error } = await supabase.rpc('get_move_attendees', {
        p_move_id: moveId,
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!moveId,
  });
}

export function useMyRsvpStatus(moveId: string) {
  return useQuery({
    queryKey: queryKeys.rsvps.myStatus(moveId),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc('my_rsvp_status', {
        p_move_id: moveId,
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!moveId,
  });
}

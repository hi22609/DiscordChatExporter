import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { CreateMoveInput } from '@/types/app';

export function useCreateMove() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateMoveInput): Promise<string> => {
      const { data, error } = await supabase
        .from('moves')
        .insert({
          creator_id: userId!,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          location_name: input.location_name,
          location_point: `POINT(${input.location_lng} ${input.location_lat})`,
          address: input.address ?? null,
          starts_at: input.starts_at.toISOString(),
          ends_at: input.ends_at?.toISOString() ?? null,
          max_attendees: input.max_attendees ?? null,
          cover_image_url: input.cover_image_url ?? null,
          vibes: input.vibes ?? [],
        })
        .select('id')
        .single();

      if (error) throw error;

      // Auto-RSVP creator — non-fatal: the move exists either way, and the
      // creator can always tap Join on the detail screen.
      const { error: rsvpError } = await supabase.from('rsvps').insert({
        move_id: data.id,
        user_id: userId!,
        status: 'going',
      });
      if (rsvpError) console.warn('creator auto-RSVP failed', rsvpError.message);

      return data.id;
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.moves.all });
      qc.invalidateQueries({ queryKey: queryKeys.moves.myUpcoming() });
    },
  });
}

/**
 * Upload a cover image for a move and persist its URL on the row.
 * Returns the public URL, or null if the upload failed (non-fatal —
 * the move stands on its own with a category gradient).
 */
export async function attachMoveCoverImage(uri: string, moveId: string): Promise<string | null> {
  try {
    const url = await uploadImage('move-images', `moves/${moveId}/cover`, uri);
    const { error } = await supabase
      .from('moves')
      .update({ cover_image_url: url })
      .eq('id', moveId);
    if (error) throw error;
    return url;
  } catch (err) {
    console.warn('move cover upload failed', err);
    return null;
  }
}

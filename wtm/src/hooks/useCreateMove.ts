import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
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

      // Auto-RSVP creator
      await supabase.from('rsvps').insert({
        move_id: data.id,
        user_id: userId!,
        status: 'going',
      });

      return data.id;
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: queryKeys.moves.all });
      qc.invalidateQueries({ queryKey: queryKeys.moves.myUpcoming() });
    },
  });
}

export async function uploadMoveImage(uri: string, moveId: string): Promise<string> {
  const ext = uri.split('.').pop() ?? 'jpg';
  const path = `moves/${moveId}/cover.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('move-images')
    .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('move-images').getPublicUrl(path);
  return data.publicUrl;
}

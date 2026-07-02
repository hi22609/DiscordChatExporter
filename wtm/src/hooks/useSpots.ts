import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { NearbySpot, SpotDetail, SpotCategory, CreateSpotInput } from '@/types/app';

export const spotKeys = {
  nearby: (lat: number, lng: number, radius: number, category: string | null) =>
    ['spots', 'nearby', lat, lng, radius, category] as const,
  detail: (id: string) => ['spots', 'detail', id] as const,
};

export async function fetchNearbySpots(
  lat: number,
  lng: number,
  radiusM: number,
  category: SpotCategory | null
): Promise<NearbySpot[]> {
  const { data, error } = await supabase.rpc('nearby_spots', {
    lat,
    lng,
    radius_m: radiusM,
    filter_cat: category,
    page_size: 100,
  });
  if (error) throw error;
  return (data ?? []) as NearbySpot[];
}

export function useSpot(spotId: string) {
  return useQuery({
    queryKey: spotKeys.detail(spotId),
    queryFn: async (): Promise<SpotDetail> => {
      const { data, error } = await supabase.rpc('get_spot', { p_spot_id: spotId });
      if (error) throw error;
      if (!data?.[0]) throw new Error('spot_not_found');
      return data[0] as SpotDetail;
    },
    enabled: !!spotId,
  });
}

// 🔥 toggle with optimistic flip
export function useFireSpot(spotId: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (currentlyFired: boolean) => {
      if (currentlyFired) {
        const { error } = await supabase
          .from('spot_fires')
          .delete()
          .eq('spot_id', spotId)
          .eq('user_id', userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spot_fires')
          .insert({ spot_id: spotId, user_id: userId! });
        if (error) throw error;
      }
    },
    onMutate: async (currentlyFired) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await qc.cancelQueries({ queryKey: spotKeys.detail(spotId) });
      const prev = qc.getQueryData<SpotDetail>(spotKeys.detail(spotId));
      qc.setQueryData<SpotDetail>(spotKeys.detail(spotId), (old) =>
        old
          ? {
              ...old,
              i_fired: !currentlyFired,
              fire_count: old.fire_count + (currentlyFired ? -1 : 1),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(spotKeys.detail(spotId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: spotKeys.detail(spotId) });
      qc.invalidateQueries({ queryKey: ['spots', 'nearby'] });
    },
  });
}

export function useSaveSpot(spotId: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (currentlySaved) {
        const { error } = await supabase
          .from('spot_saves')
          .delete()
          .eq('spot_id', spotId)
          .eq('user_id', userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spot_saves')
          .insert({ spot_id: spotId, user_id: userId! });
        if (error) throw error;
      }
    },
    onMutate: async (currentlySaved) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await qc.cancelQueries({ queryKey: spotKeys.detail(spotId) });
      const prev = qc.getQueryData<SpotDetail>(spotKeys.detail(spotId));
      qc.setQueryData<SpotDetail>(spotKeys.detail(spotId), (old) =>
        old
          ? {
              ...old,
              i_saved: !currentlySaved,
              save_count: old.save_count + (currentlySaved ? -1 : 1),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(spotKeys.detail(spotId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: spotKeys.detail(spotId) });
    },
  });
}

export function useCreateSpot() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateSpotInput): Promise<string> => {
      const { data, error } = await supabase
        .from('spots')
        .insert({
          created_by: userId!,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          location_point: `POINT(${input.longitude} ${input.latitude})`,
          address: input.address ?? null,
          best_time: input.best_time ?? null,
          cover_image_url: input.cover_image_url ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Creator auto-fires their own spot — it's fire, that's why they posted it
      await supabase.from('spot_fires').insert({ spot_id: data.id, user_id: userId! });

      return data.id;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['spots', 'nearby'] });
    },
  });
}

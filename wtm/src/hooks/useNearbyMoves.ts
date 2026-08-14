import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useLocationStore } from '@/store/locationStore';
import { useFilterStore } from '@/store/filterStore';
import { useAuthStore } from '@/store/authStore';
import { PITTSBURGH } from '@/constants/geo';
import type { NearbyMove } from '@/types/app';

const PAGE_SIZE = 20;

async function fetchNearbyMoves(
  lat: number,
  lng: number,
  radiusMeters: number,
  category: string | null,
  uid: string | null,
  page: number
): Promise<NearbyMove[]> {
  const { data, error } = await supabase.rpc('nearby_moves', {
    lat,
    lng,
    radius_m: radiusMeters,
    filter_cat: category,
    uid,
    page_offset: page * PAGE_SIZE,
    page_size: PAGE_SIZE,
  });

  if (error) throw error;
  return (data ?? []) as NearbyMove[];
}

export function useNearbyMoves() {
  // Subscribe to coords (not getCoords()) so the feed refetches when GPS resolves.
  const coords = useLocationStore((s) => s.coords);
  const { category, radiusMeters } = useFilterStore();
  // Sending the caller's id is what fills in "you're going" and the friends
  // row. Without it nearby_moves falls back to auth.uid(), which is empty on
  // the first paint and leaves every card looking like nobody is going.
  const uid = useAuthStore((s) => s.user?.id ?? null);

  const { lat, lng } = coords ?? PITTSBURGH;

  return useInfiniteQuery({
    queryKey: [...queryKeys.moves.nearby(lat, lng, radiusMeters, category), uid],
    queryFn: ({ pageParam = 0 }) =>
      fetchNearbyMoves(lat, lng, radiusMeters, category, uid, pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60,
    // Keep showing the previous results while a filter/radius change refetches —
    // the list crossfades instead of collapsing to skeletons.
    placeholderData: keepPreviousData,
  });
}

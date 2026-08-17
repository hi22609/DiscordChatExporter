import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { MyInvite, Referral } from '@/types/app';

export function useMyInvite() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['my-invite', userId],
    queryFn: async (): Promise<MyInvite | null> => {
      const { data, error } = await supabase.rpc('get_my_invite');
      if (error) throw error;
      return (data?.[0] as MyInvite) ?? null;
    },
    enabled: !!userId,
  });
}

export function useMyReferrals() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['my-referrals', userId],
    queryFn: async (): Promise<Referral[]> => {
      const { data, error } = await supabase.rpc('get_my_referrals');
      if (error) throw error;
      return (data ?? []) as Referral[];
    },
    enabled: !!userId,
  });
}

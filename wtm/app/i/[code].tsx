import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { InviteValidationResult } from '@/types/app';

/**
 * Deep-link target for shared invites:
 *   https://whatsthemove.app/i/MOVE7K2Q   (universal / app link)
 *   wtm://i/MOVE7K2Q                       (custom scheme)
 *
 * Validates the code on open, then drops the friend straight into sign-up
 * with the code already applied. Falls back to the manual invite screen if
 * the code is bad, and sends existing members home.
 */
export default function InviteDeepLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setPendingInviteCodeId = useAuthStore((s) => s.setPendingInviteCodeId);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Wait until the auth session has resolved before deciding where to go.
    if (isLoading) return;

    let cancelled = false;

    (async () => {
      // Already a member — just take them into the app.
      if (session) {
        router.replace('/(tabs)');
        return;
      }

      const normalized = (code ?? '').toUpperCase().trim();

      if (!normalized) {
        router.replace('/(auth)/invite');
        return;
      }

      const { data } = await supabase.functions.invoke<InviteValidationResult>(
        'validate-invite',
        { body: { code: normalized } }
      );

      if (cancelled) return;

      if (data?.valid) {
        setPendingInviteCodeId(data.codeId);
        router.replace({ pathname: '/(auth)/sign-up', params: { code: normalized } });
      } else {
        // Let the manual screen explain what's wrong, code prefilled.
        setFailed(true);
        router.replace({ pathname: '/(auth)/invite', params: { code: normalized, error: '1' } });
      }
    })();

    return () => { cancelled = true; };
  }, [isLoading, session, code]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <LinearGradient
        colors={['#FF6B3530', '#7C3AED18', '#0A0A0A']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: -100, left: -100, right: -100, height: 400, borderRadius: 500 }}
      />
      <Text style={{ fontSize: 56 }}>🎟️</Text>
      <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
        Checking your invite…
      </Text>
      <ActivityIndicator color="#FF6B35" />
      {failed && (
        <Text style={{ color: '#606060', fontSize: 14 }}>Taking you to enter it manually…</Text>
      )}
    </View>
  );
}

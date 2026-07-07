import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/lib/queryClient';
import { useSessionInit, useAuth } from '@/hooks/useSession';
import { useLocationInit } from '@/hooks/useLocation';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useSessionInit();
  useLocationInit();

  useEffect(() => {
    if (isLoading) return;
    SplashScreen.hideAsync();

    const inAuthGroup  = segments[0] === '(auth)';
    const inVerifyAge  = inAuthGroup && segments[1] === 'verify-age';
    const inPublicRoute = segments[0] === 'i';

    // ---- Not authenticated ----
    if (!isAuthenticated) {
      if (!inAuthGroup && !inPublicRoute) router.replace('/(auth)/welcome');
      return;
    }

    // ---- Authenticated but no profile yet (e.g. DB trigger still running) ----
    // Stay put — next render cycle will have the profile.
    if (!profile) return;

    // ---- Age gate: profile exists but no birthdate ----
    if (!profile.birthdate) {
      if (!inVerifyAge) router.replace('/(auth)/verify-age');
      return;
    }

    // ---- Fully onboarded — leave auth group ----
    if (inAuthGroup) router.replace('/(tabs)');

  }, [isAuthenticated, isLoading, profile, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="move/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="invite-friends"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="i/[code]" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="spot/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="add-spot"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGate />
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

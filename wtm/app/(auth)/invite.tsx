import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { InviteValidationResult } from '@/types/app';

const REASON_MESSAGES: Record<string, string> = {
  not_found: "That code doesn't exist. Check for typos.",
  used: 'That code has already been used.',
  expired: 'That code has expired.',
  server_error: 'Something went wrong. Try again.',
};

export default function InviteScreen() {
  const router = useRouter();
  const { code: codeParam, error: errorParam } = useLocalSearchParams<{ code?: string; error?: string }>();
  const setPendingInviteCodeId = useAuthStore((s) => s.setPendingInviteCodeId);
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? "That invite link didn't work. Double-check the code." : null
  );
  const inputRef = useRef<TextInput>(null);

  async function handleValidate() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke<InviteValidationResult>(
      'validate-invite',
      { body: { code: trimmed } }
    );

    setIsLoading(false);

    if (fnError || !data) {
      setError('Something went wrong. Try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!data.valid) {
      setError(REASON_MESSAGES[data.reason] ?? 'Invalid code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingInviteCodeId(data.codeId);
    router.push('/(auth)/sign-up');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, gap: 24 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FAFAFA', letterSpacing: -1 }}>
              Enter your{'\n'}invite code
            </Text>
            <Text style={{ color: '#A0A0A0', fontSize: 16, lineHeight: 24 }}>
              WTM is invite-only — someone already in has to let you in. Drop their code below.
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(t) => {
                setCode(t.toUpperCase());
                setError(null);
              }}
              onSubmitEditing={handleValidate}
              placeholder="e.g. PITTSB42"
              placeholderTextColor="#424242"
              autoCapitalize="characters"
              autoFocus
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: 16,
                height: 60,
                paddingHorizontal: 20,
                color: '#FAFAFA',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: 4,
                borderWidth: error ? 1.5 : 1,
                borderColor: error ? '#EF4444' : '#2E2E2E',
                textAlign: 'center',
              }}
            />

            {error && (
              <Animated.View entering={FadeInDown.springify()}>
                <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={handleValidate}
              disabled={!code.trim() || isLoading}
              style={{
                backgroundColor: code.trim() ? '#FF6B35' : '#1E1E1E',
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !code.trim() ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
                  Validate code
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#424242', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            No code? Ask a friend who's already in —{'\n'}
            everyone gets a few to hand out.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

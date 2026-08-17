import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError('Invalid email or password.');
    }
    // Auth gate handles redirect
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
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#FAFAFA', letterSpacing: -1 }}>
            Welcome back
          </Text>

          <View style={{ gap: 14 }}>
            <View style={{
              backgroundColor: '#1E1E1E', borderRadius: 14,
              borderWidth: 1, borderColor: '#2E2E2E',
              paddingHorizontal: 16, height: 52,
            }}>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="Email"
                placeholderTextColor="#424242"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, color: '#FAFAFA', fontSize: 16 }}
              />
            </View>

            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#1E1E1E', borderRadius: 14,
              borderWidth: 1, borderColor: '#2E2E2E',
              paddingHorizontal: 16, height: 52, gap: 8,
            }}>
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="Password"
                placeholderTextColor="#424242"
                secureTextEntry={!showPassword}
                onSubmitEditing={handleSignIn}
                style={{ flex: 1, color: '#FAFAFA', fontSize: 16 }}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#606060" />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
            </Animated.View>
          )}

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isLoading || !email || !password}
            style={{
              backgroundColor: '#FF6B35',
              height: 56, borderRadius: 28,
              alignItems: 'center', justifyContent: 'center',
              opacity: isLoading || !email || !password ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Sign in</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

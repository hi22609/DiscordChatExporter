import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface FormState {
  email: string;
  password: string;
  username: string;
  displayName: string;
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  socialHandle: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  username?: string;
  birthdate?: string;
  socialHandle?: string;
}

function parseAge(month: string, day: string, year: string): number | null {
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const y = parseInt(year, 10);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return null;
  const dob = new Date(y, m - 1, d);
  if (dob.getMonth() !== m - 1) return null; // invalid day for month
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.includes('@')) errors.email = 'Enter a valid email';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
    errors.username = '3-20 chars, lowercase letters, numbers, underscore only';
  }
  if (!form.socialHandle.trim()) {
    errors.socialHandle = 'Required — keeps everyone accountable';
  }
  const age = parseAge(form.birthMonth, form.birthDay, form.birthYear);
  if (age === null) {
    errors.birthdate = 'Enter a valid date of birth';
  } else if (age < 17) {
    errors.birthdate = 'WTM is for ages 17–25. You\'re not old enough yet.';
  } else if (age > 25) {
    errors.birthdate = 'WTM is built for the 17–25 era. Go touch grass 😭';
  }
  return errors;
}

export default function SignUpScreen() {
  const router = useRouter();
  const { code: invitedCode } = useLocalSearchParams<{ code?: string }>();
  const pendingInviteCodeId = useAuthStore((s) => s.pendingInviteCodeId);
  const [form, setForm] = useState<FormState>({
    email: '', password: '', username: '', displayName: '',
    birthMonth: '', birthDay: '', birthYear: '', socialHandle: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(key: keyof FormState) {
    return (value: string) => {
      setForm((f) => ({ ...f, [key]: key === 'username' ? value.toLowerCase() : value }));
      setErrors((e) => ({ ...e, [key]: undefined, birthdate: undefined }));
      setServerError(null);
    };
  }

  async function handleSignUp() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const birthdate = `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`;

    setIsLoading(true);
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          username: form.username.trim(),
          display_name: form.displayName.trim() || form.username.trim(),
          invite_code_id: pendingInviteCodeId,
          birthdate,
          social_handle: form.socialHandle.trim().replace(/^@/, ''),
        },
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setServerError('An account with this email already exists.');
      } else if (error.message.includes('Username')) {
        setErrors({ username: 'That username is already taken.' });
      } else if (error.message.includes('age_out_of_range')) {
        setErrors({ birthdate: 'Age verification failed. WTM is 17–25 only.' });
      } else {
        setServerError(error.message);
      }
      return;
    }
    // Auth gate in _layout.tsx redirects to (tabs)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 0 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
            <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.springify()} style={{ gap: 24 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 34, fontWeight: '900', color: '#FAFAFA', letterSpacing: -1 }}>
                Create your account
              </Text>
              <Text style={{ color: '#A0A0A0', fontSize: 16 }}>
                You're in. Let's set up your profile.
              </Text>
            </View>

            {invitedCode && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#22C55E15', borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 10,
                borderWidth: 1, borderColor: '#22C55E30',
              }}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>
                  Invited with code {invitedCode}
                </Text>
              </View>
            )}

            <View style={{ gap: 14 }}>
              <Field
                label="Username"
                value={form.username}
                onChangeText={update('username')}
                placeholder="yourhandle"
                error={errors.username}
                prefix="@"
                autoCapitalize="none"
              />

              <Field
                label="Display name"
                value={form.displayName}
                onChangeText={update('displayName')}
                placeholder="Your Name"
              />

              <Field
                label="Email"
                value={form.email}
                onChangeText={update('email')}
                placeholder="you@email.com"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                label="Password"
                value={form.password}
                onChangeText={update('password')}
                placeholder="8+ characters"
                error={errors.password}
                secureTextEntry={!showPassword}
                suffix={
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#606060" />
                  </TouchableOpacity>
                }
              />

              {/* Instagram or Snapchat handle — accountability anchor */}
              <Field
                label="Instagram or Snapchat @"
                value={form.socialHandle}
                onChangeText={update('socialHandle')}
                placeholder="yourhandle (no @)"
                error={errors.socialHandle}
                autoCapitalize="none"
                autoCorrect={false}
                prefix="@"
              />
              <Text style={{ color: '#424242', fontSize: 12, marginTop: -8 }}>
                Keeps our community real. Shown on your profile.
              </Text>

              {/* Birthday — age gate 17–25 */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                  DATE OF BIRTH
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={form.birthMonth}
                      onChangeText={(v) => {
                        update('birthMonth')(v.replace(/\D/g, '').slice(0, 2));
                      }}
                      placeholder="MM"
                      placeholderTextColor="#424242"
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1,
                        borderColor: errors.birthdate ? '#EF4444' : '#2E2E2E',
                        height: 52, textAlign: 'center', color: '#FAFAFA', fontSize: 18, fontWeight: '700',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={form.birthDay}
                      onChangeText={(v) => update('birthDay')(v.replace(/\D/g, '').slice(0, 2))}
                      placeholder="DD"
                      placeholderTextColor="#424242"
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1,
                        borderColor: errors.birthdate ? '#EF4444' : '#2E2E2E',
                        height: 52, textAlign: 'center', color: '#FAFAFA', fontSize: 18, fontWeight: '700',
                      }}
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={form.birthYear}
                      onChangeText={(v) => update('birthYear')(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder="YYYY"
                      placeholderTextColor="#424242"
                      keyboardType="number-pad"
                      maxLength={4}
                      style={{
                        backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1,
                        borderColor: errors.birthdate ? '#EF4444' : '#2E2E2E',
                        height: 52, textAlign: 'center', color: '#FAFAFA', fontSize: 18, fontWeight: '700',
                      }}
                    />
                  </View>
                </View>
                {errors.birthdate && (
                  <Text style={{ color: '#EF4444', fontSize: 12 }}>{errors.birthdate}</Text>
                )}
                <Text style={{ color: '#424242', fontSize: 12 }}>
                  WTM is 17–25 only. We verify this.
                </Text>
              </View>
            </View>

            {serverError && (
              <Animated.View entering={FadeInDown.springify()}>
                <Text style={{ color: '#EF4444', fontSize: 13 }}>{serverError}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isLoading}
              style={{
                backgroundColor: '#FF6B35', height: 56, borderRadius: 28,
                alignItems: 'center', justifyContent: 'center',
                opacity: isLoading ? 0.7 : 1, marginTop: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Let's go</Text>
              )}
            </TouchableOpacity>

            <Text style={{ color: '#424242', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              By joining, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  prefix?: string;
  suffix?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
}

function Field({ label, value, onChangeText, placeholder, error, prefix, suffix, ...rest }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1,
        borderColor: error ? '#EF4444' : '#2E2E2E',
        paddingHorizontal: 16, height: 52, gap: 8,
      }}>
        {prefix && <Text style={{ color: '#606060', fontSize: 16 }}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#424242"
          style={{ flex: 1, color: '#FAFAFA', fontSize: 16 }}
          {...rest}
        />
        {suffix}
      </View>
      {error && <Text style={{ color: '#EF4444', fontSize: 12 }}>{error}</Text>}
    </View>
  );
}

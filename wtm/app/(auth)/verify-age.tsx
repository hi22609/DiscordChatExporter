import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types/app';

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();

// Birth years that can correspond to ages 17–25. A person born in
// CURRENT_YEAR - 17 is only 17 once their birthday has passed, so the range is
// widened by one year at the young end and narrowed by the birthday question.
const BIRTH_YEARS: number[] = Array.from(
  { length: 10 },
  (_, i) => CURRENT_YEAR - 16 - i
);

// Year alone cannot determine age: someone born in December is a year younger
// than someone born in January of the same year. `hadBirthday` closes that gap,
// which is what previously let 16-year-olds through a 17+ gate.
function calcAge(birthYear: number, hadBirthday: boolean): number {
  return CURRENT_YEAR - birthYear - (hadBirthday ? 0 : 1);
}

// Store a date that actually implies the stated age, so the DB trigger
// (set_age_range) computes the same number the client validated.
function birthdateFor(birthYear: number, hadBirthday: boolean): string {
  return hadBirthday ? `${birthYear}-01-01` : `${birthYear}-12-31`;
}

export default function VerifyAgeScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [hadBirthday, setHadBirthday] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!selected || hadBirthday === null || !profile) return;

    const age = calcAge(selected, hadBirthday);
    if (age < 17 || age > 25) {
      Alert.alert(
        "You're not eligible yet",
        'WTM is for ages 17–25. Come back on your 17th birthday.'
      );
      return;
    }

    setLoading(true);
    const birthdate = birthdateFor(selected, hadBirthday);

    const { error } = await supabase
      .from('profiles')
      .update({ birthdate })
      .eq('id', profile.id);

    if (error) {
      setLoading(false);
      Alert.alert('Something went wrong', error.message);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single<Profile>();

    setLoading(false);
    if (data) setProfile(data);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32, gap: 36 }}>

        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={{ gap: 10 }}>
          <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>
            ONE QUICK THING
          </Text>
          <Text style={{ color: '#FAFAFA', fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 }}>
            What year{'\n'}were you born?
          </Text>
          <Text style={{ color: '#5A5A5A', fontSize: 15, lineHeight: 22 }}>
            WTM is 17–25 only. One tap and you're in.
          </Text>
        </Animated.View>

        {/* Year grid */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {BIRTH_YEARS.map((year) => {
              const isSelected = selected === year;
              return (
                <TouchableOpacity
                  key={year}
                  onPress={() => { setSelected(year); setHadBirthday(null); }}
                  activeOpacity={0.75}
                  style={{
                    width: '30.5%',
                    paddingVertical: 16,
                    borderRadius: 18,
                    alignItems: 'center',
                    backgroundColor: isSelected ? '#FF6B35' : '#141414',
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#FF6B35' : '#222',
                  }}
                >
                  <Text style={{
                    color: '#FAFAFA', fontWeight: '800', fontSize: 18, letterSpacing: -0.5,
                  }}>
                    {year}
                  </Text>

                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Birthday-passed question — year alone is not an age */}
        {selected !== null && (
          <Animated.View entering={FadeInDown.springify()} style={{ gap: 12 }}>
            <Text style={{ color: '#FAFAFA', fontSize: 17, fontWeight: '700' }}>
              Have you already had your birthday in {CURRENT_YEAR}?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { label: 'Yes', value: true },
                { label: 'Not yet', value: false },
              ].map((opt) => {
                const on = hadBirthday === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setHadBirthday(opt.value)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={{
                      flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center',
                      backgroundColor: on ? '#FF6B35' : '#141414',
                      borderWidth: 1.5, borderColor: on ? '#FF6B35' : '#222',
                    }}
                  >
                    <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 16 }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={{ marginTop: 'auto', gap: 14 }}>
          <TouchableOpacity
            onPress={confirm}
            disabled={!selected || hadBirthday === null || loading}
            activeOpacity={0.85}
            style={{
              height: 58, borderRadius: 29,
              backgroundColor: selected && hadBirthday !== null ? '#FF6B35' : '#1A1A1A',
              alignItems: 'center', justifyContent: 'center',
              opacity: !selected || hadBirthday === null || loading ? 0.55 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Let's go 🔥</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => supabase.auth.signOut()}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: '#333', fontSize: 13 }}>Wrong account? Sign out</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

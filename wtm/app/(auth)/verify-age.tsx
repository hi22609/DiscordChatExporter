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

// Build the selectable year range: birth years that correspond to ages 17–25
const BIRTH_YEARS: number[] = Array.from(
  { length: 9 },
  (_, i) => CURRENT_YEAR - 17 - i
);

function calcAge(birthYear: number): number {
  return CURRENT_YEAR - birthYear;
}

export default function VerifyAgeScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!selected || !profile) return;

    const age = calcAge(selected);
    if (age < 17 || age > 25) {
      Alert.alert('Age required', 'WTM is for ages 17–25 only.');
      return;
    }

    setLoading(true);
    // Store birth year as Jan 1 — day/month not needed for age validation
    const birthdate = `${selected}-01-01`;

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
              const age = calcAge(year);
              const isSelected = selected === year;
              return (
                <TouchableOpacity
                  key={year}
                  onPress={() => setSelected(year)}
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
                  <Text style={{
                    color: isSelected ? 'rgba(255,255,255,.65)' : '#444',
                    fontSize: 12, fontWeight: '500', marginTop: 2,
                  }}>
                    {age} yrs
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={{ marginTop: 'auto', gap: 14 }}>
          <TouchableOpacity
            onPress={confirm}
            disabled={!selected || loading}
            activeOpacity={0.85}
            style={{
              height: 58, borderRadius: 29,
              backgroundColor: selected ? '#FF6B35' : '#1A1A1A',
              alignItems: 'center', justifyContent: 'center',
              opacity: !selected || loading ? 0.55 : 1,
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

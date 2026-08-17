import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {/* Background gradient orb */}
      <LinearGradient
        colors={['#FF6B3530', '#7C3AED20', '#0A0A0A']}
        locations={[0, 0.5, 1]}
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          right: -100,
          height: height * 0.7,
          borderRadius: 1000,
        }}
      />

      <SafeAreaView style={{ flex: 1, padding: 24 }}>
        <Animated.View entering={FadeIn.delay(200)} style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {/* Logo / Brand */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ gap: 8 }}>
            <Text style={{ fontSize: 80, textAlign: 'center' }}>🔥</Text>
            <Text style={{
              fontSize: 48,
              fontWeight: '900',
              color: '#FAFAFA',
              textAlign: 'center',
              letterSpacing: -1.5,
            }}>
              What's{'\n'}The Move?
            </Text>
            <Text style={{
              fontSize: 18,
              color: '#A0A0A0',
              textAlign: 'center',
              lineHeight: 26,
            }}>
              The map of what's happening tonight.{'\n'}Invite-only — you gotta know someone.
            </Text>
          </Animated.View>

          {/* Feature pills */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 16 }}
          >
            {['🍺 Bars', '🏀 Sports', '🎵 Music', '🍕 Food', '🌿 Outdoor', '🎨 Art'].map((vibe) => (
              <View key={vibe} style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#2E2E2E',
              }}>
                <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '500' }}>{vibe}</Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInUp.delay(700).springify()} style={{ gap: 12, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/invite')}
            style={{
              backgroundColor: '#FF6B35',
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 }}>
              I have an invite code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            style={{
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#606060', fontSize: 15 }}>
              Already have an account?{' '}
              <Text style={{ color: '#FF6B35', fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

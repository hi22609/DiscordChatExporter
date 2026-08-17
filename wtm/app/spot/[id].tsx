import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Share, Linking, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSpot, useFireSpot, useSaveSpot } from '@/hooks/useSpots';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils/time';
import { SPOT_CATEGORY_META } from '@/types/app';

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: spot, isLoading } = useSpot(id);
  const fireMutation = useFireSpot(id);
  const saveMutation = useSaveSpot(id);
  const fireScale = useSharedValue(1);

  const fireAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  function handleFire() {
    if (!spot) return;
    fireScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    fireMutation.mutate(spot.i_fired);
  }

  function handleSave() {
    if (!spot) return;
    saveMutation.mutate(spot.i_saved);
  }

  async function handleDirections() {
    if (!spot) return;
    const label = encodeURIComponent(spot.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${spot.latitude},${spot.longitude}`,
      android: `geo:0,0?q=${spot.latitude},${spot.longitude}(${label})`,
    })!;
    Linking.openURL(url);
  }

  async function handleShare() {
    if (!spot) return;
    await Share.share({
      message: `Fire spot on WTM 📍 ${spot.name} — ${SPOT_CATEGORY_META[spot.category].label}. Check it: https://whatsthemove.app/spot/${spot.id}`,
    });
  }

  if (isLoading || !spot) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="70%" height={28} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = SPOT_CATEGORY_META[spot.category];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Hero */}
        <View style={{ height: 260 }}>
          {spot.cover_image_url ? (
            <Image source={{ uri: spot.cover_image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          ) : (
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 76 }}>{meta.emoji}</Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', '#0A0A0A']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 }}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ paddingHorizontal: 20, gap: 20, marginTop: -16 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge label={meta.label} variant="brand" />
              {spot.fire_count >= 10 && <Badge label="Community favorite" variant="now" />}
            </View>
            <Text style={{ color: '#FAFAFA', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, lineHeight: 34 }}>
              {spot.name}
            </Text>
            {spot.address && (
              <Text style={{ color: '#606060', fontSize: 14 }}>{spot.address}</Text>
            )}
          </View>

          {/* Fire + save stats row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Animated.View style={[{ flex: 1 }, fireAnimStyle]}>
              <TouchableOpacity
                onPress={handleFire}
                style={{
                  height: 56, borderRadius: 18,
                  backgroundColor: spot.i_fired ? '#FF6B35' : '#1E1E1E',
                  borderWidth: 1.5, borderColor: '#FF6B35',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Text style={{ fontSize: 20 }}>🔥</Text>
                <Text style={{ color: spot.i_fired ? '#fff' : '#FF6B35', fontWeight: '800', fontSize: 17 }}>
                  {spot.fire_count}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                width: 56, height: 56, borderRadius: 18,
                backgroundColor: spot.i_saved ? '#22C55E20' : '#1E1E1E',
                borderWidth: 1.5, borderColor: spot.i_saved ? '#22C55E' : '#2E2E2E',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons
                name={spot.i_saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={spot.i_saved ? '#22C55E' : '#A0A0A0'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 56, height: 56, borderRadius: 18,
                backgroundColor: '#1E1E1E',
                borderWidth: 1.5, borderColor: '#2E2E2E',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="share-outline" size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          {/* Best time */}
          {spot.best_time && (
            <View style={{
              backgroundColor: '#1E1E1E', borderRadius: 18, padding: 14,
              flexDirection: 'row', alignItems: 'center', gap: 14,
              borderWidth: 1, borderColor: '#2E2E2E',
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: '#F59E0B20', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#606060', fontSize: 12, fontWeight: '600' }}>BEST TIME</Text>
                <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>{spot.best_time}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {spot.description && (
            <View style={{
              backgroundColor: '#1E1E1E', borderRadius: 18, padding: 16,
              borderWidth: 1, borderColor: '#2E2E2E',
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 15, lineHeight: 24 }}>
                {spot.description}
              </Text>
            </View>
          )}

          {/* Dropped by */}
          <TouchableOpacity
            onPress={() => router.push(`/user/${spot.created_by}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Avatar uri={spot.creator_avatar} name={spot.creator_username} size={40} />
            <View>
              <Text style={{ color: '#606060', fontSize: 12 }}>Dropped by</Text>
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>
                @{spot.creator_username} · {formatRelativeTime(spot.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Bottom bar: rally a move here + directions */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 32, paddingTop: 16, paddingHorizontal: 20,
        backgroundColor: '#0A0A0Aee',
        borderTopWidth: 0.5, borderTopColor: '#1E1E1E',
        flexDirection: 'row', gap: 10,
      }}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(tabs)/create',
              params: {
                locationName: spot.name,
                lat: String(spot.latitude),
                lng: String(spot.longitude),
                address: spot.address ?? '',
              },
            })
          }
          style={{
            flex: 1, height: 52, borderRadius: 26, backgroundColor: '#FF6B35',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>🕺</Text>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Set a move here</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDirections}
          style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: '#1E1E1E', borderWidth: 1.5, borderColor: '#2E2E2E',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="navigate" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Back button */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#0A0A0A99',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#2E2E2E',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FAFAFA" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

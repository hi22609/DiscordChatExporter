import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AttendeePile } from './AttendeePile';
import { RSVPButton } from './RSVPButton';
import { formatMoveTime, getMoveUrgency } from '@/utils/time';
import { formatDistance } from '@/utils/distance';
import { CATEGORY_META } from '@/types/app';
import type { NearbyMove, MoveWithCounts } from '@/types/app';

type Move = NearbyMove | MoveWithCounts;

interface MoveCardProps {
  move: Move;
  index?: number;
  showRSVP?: boolean;
}

const { width } = Dimensions.get('window');

export function MoveCard({ move, index = 0, showRSVP = true }: MoveCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const meta = CATEGORY_META[move.category];
  const urgency = getMoveUrgency(move.starts_at);
  const distanceM = 'distance_m' in move ? move.distance_m : null;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={[animStyle]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => router.push(`/move/${move.id}`)}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        className="mb-4 rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        {/* Cover image or gradient */}
        <View style={{ height: 160 }}>
          {move.cover_image_url ? (
            <Image
              source={{ uri: move.cover_image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 56 }}>{meta.emoji}</Text>
            </LinearGradient>
          )}

          {/* Overlay badges */}
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Badge
              label={meta.label}
              variant="subtle"
            />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {urgency === 'now' && <Badge label="Happening now" variant="now" />}
              {urgency === 'soon' && <Badge label="Starting soon" variant="warning" />}
              {move.is_full && <Badge label="Full" variant="danger" />}
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="p-4 gap-3">
          <View className="gap-1">
            <Text
              className="text-ink font-bold text-lg"
              numberOfLines={2}
            >
              {move.title}
            </Text>

            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={13} color="#A0A0A0" />
                <Text className="text-ink-muted text-sm">{formatMoveTime(move.starts_at)}</Text>
              </View>

              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={13} color="#A0A0A0" />
                <Text className="text-ink-muted text-sm" numberOfLines={1} style={{ maxWidth: 140 }}>
                  {move.location_name}
                </Text>
              </View>

              {distanceM != null && (
                <Text className="text-ink-subtle text-sm">{formatDistance(distanceM)}</Text>
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <AttendeePile
              attendees={[]}
              totalCount={move.attendee_count}
              size={26}
            />
            {showRSVP && (
              <RSVPButton
                moveId={move.id}
                isFull={move.is_full}
                compact
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

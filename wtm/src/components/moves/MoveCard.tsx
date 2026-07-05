import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Badge } from '@/components/ui/Badge';
import { AttendeePile } from './AttendeePile';
import { RSVPButton } from './RSVPButton';
import { prefetchMove } from '@/hooks/useMove';
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

function MoveCardInner({ move, index = 0, showRSVP = true }: MoveCardProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const scale = useSharedValue(1);
  const meta = CATEGORY_META[move.category];
  const urgency = getMoveUrgency(move.starts_at);
  const distanceM = 'distance_m' in move ? move.distance_m : null;
  const knownStatus = 'my_status' in move ? move.my_status : undefined;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60).springify().damping(18)}
      style={[animStyle]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => router.push(`/move/${move.id}`)}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
          prefetchMove(qc, move.id);
        }}
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
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
              recyclingKey={move.id}
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
                knownStatus={knownStatus}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Memoized: list scrolling re-renders only cards whose data actually changed.
 * The comparator covers every field the card renders.
 */
export const MoveCard = memo(MoveCardInner, (prev, next) => {
  const a = prev.move, b = next.move;
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.starts_at === b.starts_at &&
    a.attendee_count === b.attendee_count &&
    a.is_full === b.is_full &&
    a.cover_image_url === b.cover_image_url &&
    ('my_status' in a ? a.my_status : null) === ('my_status' in b ? b.my_status : null) &&
    prev.showRSVP === next.showRSVP
  );
});

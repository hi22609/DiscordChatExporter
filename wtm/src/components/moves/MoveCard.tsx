import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AttendeePile } from './AttendeePile';
import { RSVPButton } from './RSVPButton';
import { HypeReactions } from './HypeReactions';
import { prefetchMove } from '@/hooks/useMove';
import { formatMoveTime, getMoveUrgency } from '@/utils/time';
import { formatDistance } from '@/utils/distance';
import { CATEGORY_META } from '@/types/app';
import type { NearbyMove, MoveWithCounts } from '@/types/app';

type Move = NearbyMove | MoveWithCounts;

// Hot score threshold: moves above this show "Trending 🔥"
const HOT_THRESHOLD = 1.5;

interface MoveCardProps {
  move: Move;
  index?: number;
  showRSVP?: boolean;
}

function MoveCardInner({ move, index = 0, showRSVP = true }: MoveCardProps) {
  const router  = useRouter();
  const qc      = useQueryClient();
  const scale   = useSharedValue(1);
  const meta    = CATEGORY_META[move.category];
  const urgency = getMoveUrgency(move.starts_at);

  const distanceM    = 'distance_m' in move ? move.distance_m : null;
  const knownStatus  = 'my_status' in move ? move.my_status : undefined;
  const hotScore     = 'hot_score' in move ? (move as NearbyMove).hot_score : 0;
  const isTrending   = hotScore >= HOT_THRESHOLD && !move.is_full;
  const crewGoing    = 'crew_going' in move ? (move as NearbyMove).crew_going : [];
  const waitlistCount = 'waitlist_count' in move ? (move as NearbyMove).waitlist_count : 0;

  const fillPct = move.max_attendees && move.max_attendees > 0
    ? Math.min(100, Math.round((move.attendee_count / move.max_attendees) * 100))
    : null;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60).springify().damping(18)}
      style={animStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          // Prefetch here rather than on press-in: press-in also fires on the
          // finger-down that turns into a scroll, so flicking a 40-card feed
          // issued ~80 requests for moves nobody opened.
          prefetchMove(qc, move.id);
          router.push(`/move/${move.id}`);
        }}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={{ backgroundColor: '#1A1A1A', borderRadius: 24, overflow: 'hidden', marginBottom: 14 }}
      >
        {/* Cover image or gradient */}
        <View style={{ height: 164 }}>
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
              <Text style={{ fontSize: 58 }}>{meta.emoji}</Text>
            </LinearGradient>
          )}

          {/* Top badge row */}
          <View style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            {/* Category pill */}
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 5,
              flexDirection: 'row', alignItems: 'center', gap: 5,
              borderWidth: 0.5, borderColor: 'rgba(255,255,255,.12)',
            }}>
              <Text style={{ fontSize: 13 }}>{meta.emoji}</Text>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{meta.label}</Text>
            </View>

            {/* Status badges */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {isTrending && (
                <View style={{ backgroundColor: '#FF6B35', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>🔥 Trending</Text>
                </View>
              )}
              {urgency === 'now' && !isTrending && (
                <View style={{ backgroundColor: '#22C55E', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>● Happening now</Text>
                </View>
              )}
              {urgency === 'soon' && !isTrending && (
                <View style={{ backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Starting soon</Text>
                </View>
              )}
              {move.is_full && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#EF4444' }}>
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800' }}>Full</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16, gap: 12 }}>
          {/* Title + time */}
          <View style={{ gap: 4 }}>
            <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 17, letterSpacing: -0.3 }} numberOfLines={2}>
              {move.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={13} color="#606060" />
                <Text style={{ color: '#808080', fontSize: 13 }}>{formatMoveTime(move.starts_at)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location-outline" size={13} color="#606060" />
                <Text style={{ color: '#808080', fontSize: 13, maxWidth: 140 }} numberOfLines={1}>
                  {move.location_name}
                </Text>
              </View>
              {distanceM != null && (
                <Text style={{ color: '#444', fontSize: 13 }}>{formatDistance(distanceM)}</Text>
              )}
            </View>
          </View>

          {/* Capacity bar — only when max_attendees is set */}
          {fillPct !== null && (
            <View style={{ gap: 5 }}>
              <View style={{
                height: 4, borderRadius: 2,
                backgroundColor: '#252525', overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${fillPct}%`,
                  borderRadius: 2,
                  backgroundColor: fillPct >= 80 ? '#EF4444' : fillPct >= 50 ? '#F59E0B' : '#22C55E',
                }} />
              </View>
              <Text style={{ color: '#505050', fontSize: 11, fontWeight: '500' }}>
                {move.spots_left != null && move.spots_left > 0
                  ? `${move.spots_left} spot${move.spots_left !== 1 ? 's' : ''} left`
                  : move.is_full ? 'Fully packed' : `${fillPct}% full`
                }
              </Text>
            </View>
          )}

          {/* Crew social proof */}
          {crewGoing.length > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 7,
              backgroundColor: '#FF6B3510', borderRadius: 12,
              paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1, borderColor: '#FF6B3520',
            }}>
              <Text style={{ fontSize: 13 }}>👥</Text>
              <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '700' }}>
                {crewGoing[0].username}
                {crewGoing.length > 1 ? ` + ${crewGoing.length - 1} from your crew` : ' from your crew'} is going
              </Text>
            </View>
          )}

          {/* Footer: attendees + RSVP */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AttendeePile attendees={[]} totalCount={move.attendee_count} size={26} />
              {waitlistCount > 0 && move.is_full && (
                <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '600' }}>
                  {waitlistCount} waitlisted
                </Text>
              )}
            </View>
            {showRSVP && (
              <RSVPButton moveId={move.id} isFull={move.is_full} compact knownStatus={knownStatus} />
            )}
          </View>

          {/* Hype reactions */}
          <HypeReactions moveId={move.id} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const MoveCard = memo(MoveCardInner, (prev, next) => {
  const a = prev.move, b = next.move;
  const aHot = 'hot_score' in a ? (a as NearbyMove).hot_score : 0;
  const bHot = 'hot_score' in b ? (b as NearbyMove).hot_score : 0;
  return (
    a.id              === b.id              &&
    a.title           === b.title           &&
    a.starts_at       === b.starts_at       &&
    a.attendee_count  === b.attendee_count  &&
    a.spots_left      === b.spots_left      &&
    a.is_full         === b.is_full         &&
    a.cover_image_url === b.cover_image_url &&
    aHot              === bHot              &&
    ('my_status' in a ? a.my_status : null) === ('my_status' in b ? b.my_status : null) &&
    prev.showRSVP     === next.showRSVP
  );
});

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Share, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMove, useMoveAttendees, useMyRsvpStatus } from '@/hooks/useMove';
import { RSVPButton } from '@/components/moves/RSVPButton';
import { AttendeePile } from '@/components/moves/AttendeePile';
import { HypeReactions } from '@/components/moves/HypeReactions';
import { MoveChat } from '@/components/moves/MoveChat';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatFullDate, formatMoveTime, formatMoveDuration, getMoveUrgency, isMoveHappeningNow } from '@/utils/time';
import { CATEGORY_META } from '@/types/app';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { submitReport } from '@/hooks/useSafety';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryClient';


export default function MoveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: move, isLoading } = useMove(id);
  const { data: attendees = [] } = useMoveAttendees(id, 12);
  const { data: myStatus } = useMyRsvpStatus(id);
  const isGoing = myStatus === 'going';

  // Realtime subscription — live attendee count updates
  useEffect(() => {
    const channel = supabase
      .channel(`move-rsvps-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `move_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.moves.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.rsvps.forMove(id) });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function handleShare() {
    if (!move) return;
    await Share.share({
      title: move.title,
      message: `What's the move? This: ${move.title} — ${formatMoveTime(move.starts_at)} at ${move.location_name}. Pull up: https://whatsthemove.app/move/${move.id}`,
    });
  }

  async function handleCrewShare() {
    if (!move) return;
    await Share.share({
      title: `Roll with me to ${move.title}`,
      message: `Pulling up to "${move.title}" ${formatMoveTime(move.starts_at)} 🔥 you should come\nhttps://whatsthemove.app/move/${move.id}`,
    });
  }

  async function handleCancelMove() {
    Alert.alert('Cancel move?', 'This will notify everyone who RSVPd.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel move',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('moves').update({ is_cancelled: true }).eq('id', id);
          queryClient.invalidateQueries({ queryKey: queryKeys.moves.detail(id) });
          router.back();
        },
      },
    ]);
  }

  if (isLoading || !move) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="70%" height={28} />
          <Skeleton width="50%" height={16} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = CATEGORY_META[move.category];
  const urgency = getMoveUrgency(move.starts_at);
  const isNow = isMoveHappeningNow(move.starts_at, move.ends_at);
  const isCreator = move.creator_id === userId;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero image / gradient */}
        <View style={{ height: 280 }}>
          {move.cover_image_url ? (
            <Image
              source={{ uri: move.cover_image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 80 }}>{meta.emoji}</Text>
            </LinearGradient>
          )}

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', '#0A0A0A']}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
            }}
          />

          {/* Status badges overlay */}
          {(isNow || move.is_full) && (
            <View style={{ position: 'absolute', top: 60, left: 20, flexDirection: 'row', gap: 8 }}>
              {isNow && <Badge label="Happening now" variant="now" size="md" />}
              {move.is_full && <Badge label="Full" variant="danger" size="md" />}
              {move.is_cancelled && <Badge label="Cancelled" variant="danger" size="md" />}
            </View>
          )}
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingHorizontal: 20, gap: 20, marginTop: -20 }}
        >
          {/* Category + title */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge label={meta.label} variant="brand" />
              {urgency === 'soon' && <Badge label="Starting soon" variant="warning" />}
            </View>
            <Text style={{
              color: '#FAFAFA', fontSize: 28, fontWeight: '900', letterSpacing: -0.5,
              lineHeight: 34,
            }}>
              {move.title}
            </Text>
          </View>

          {/* Info cards */}
          <View style={{ gap: 10 }}>
            <InfoCard icon="time-outline" color="#FF6B35">
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }}>
                {formatFullDate(move.starts_at)}
              </Text>
              {move.ends_at && (
                <Text style={{ color: '#606060', fontSize: 13 }}>
                  {formatMoveDuration(move.starts_at, move.ends_at)} long
                </Text>
              )}
            </InfoCard>

            <InfoCard icon="location-outline" color="#3B82F6">
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }}>
                {move.location_name}
              </Text>
              {move.address && (
                <Text style={{ color: '#606060', fontSize: 13 }}>{move.address}</Text>
              )}
            </InfoCard>

            {move.max_attendees && (
              <InfoCard icon="people-outline" color="#22C55E">
                <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }}>
                  {move.attendee_count} / {move.max_attendees} going
                </Text>
                <Text style={{ color: '#606060', fontSize: 13 }}>
                  {move.is_full ? 'Move is full' : `${move.spots_left} spots left`}
                </Text>
              </InfoCard>
            )}
          </View>

          {/* Description */}
          {move.description && (
            <View style={{
              backgroundColor: '#1E1E1E', borderRadius: 18,
              padding: 16, borderWidth: 1, borderColor: '#2E2E2E',
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 15, lineHeight: 24 }}>
                {move.description}
              </Text>
            </View>
          )}

          {/* Hype reactions */}
          <HypeReactions moveId={id} />

          {/* Attendees */}
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 17, fontWeight: '800' }}>
                Who's going
              </Text>
              {attendees.length > 6 && (
                <TouchableOpacity onPress={() => router.push(`/move/${id}/attendees`)}>
                  <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '600' }}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {attendees.length === 0 ? (
              <View style={{
                backgroundColor: '#1E1E1E', borderRadius: 18, padding: 20,
                alignItems: 'center', gap: 8,
              }}>
                <Text style={{ fontSize: 32 }}>🎯</Text>
                <Text style={{ color: '#A0A0A0', fontSize: 15 }}>Be the first to join</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {attendees.slice(0, 12).map((a) => (
                  <TouchableOpacity
                    key={a.user_id}
                    onPress={() => router.push(`/user/${a.user_id}`)}
                    style={{ alignItems: 'center', gap: 4, width: 60 }}
                  >
                    <Avatar
                      uri={a.avatar_url}
                      name={a.display_name || a.username}
                      size={46}
                    />
                    <Text style={{ color: '#606060', fontSize: 11 }} numberOfLines={1}>
                      @{a.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Move Chat — gated to people who are going */}
          <View style={{
            backgroundColor: '#141414', borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1, borderColor: '#1E1E1E',
          }}>
            <View style={{
              paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
              borderBottomWidth: 0.5, borderBottomColor: '#1E1E1E',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Text style={{ color: '#FAFAFA', fontSize: 17, fontWeight: '800' }}>
                Move chat
              </Text>
              {isGoing && (
                <Text style={{ color: '#606060', fontSize: 12, fontWeight: '500' }}>
                  {move.attendee_count} members
                </Text>
              )}
            </View>

            {isGoing || isCreator ? (
              <MoveChat moveId={id} />
            ) : (
              <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 28 }}>🔒</Text>
                <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>
                  Join to see the chat
                </Text>
                <Text style={{ color: '#606060', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                  The crew going to this move are already coordinating in here.
                </Text>
              </View>
            )}
          </View>

          {/* Report — non-creators only */}
          {!isCreator && (
            <TouchableOpacity
              onPress={() => {
                const reasons = ['Spam or fake event', 'Unsafe or illegal activity', 'Inappropriate content'];
                Alert.alert('Report this move', 'Reports are reviewed within 24 hours.', [
                  ...reasons.map((reason) => ({
                    text: reason,
                    onPress: async () => {
                      const ok = await submitReport(userId!, 'move', move.id, reason);
                      Alert.alert(ok ? 'Report received' : 'Something went wrong', ok
                        ? 'Thanks for keeping WTM safe.'
                        : 'Try again in a minute.');
                    },
                  })),
                  { text: 'Cancel', style: 'cancel' as const },
                ]);
              }}
              style={{ alignSelf: 'center', paddingVertical: 6 }}
            >
              <Text style={{ color: '#606060', fontSize: 13 }}>
                <Ionicons name="flag-outline" size={12} color="#606060" />  Report this move
              </Text>
            </TouchableOpacity>
          )}

          {/* Creator options */}
          {isCreator && !move.is_cancelled && (
            <TouchableOpacity
              onPress={handleCancelMove}
              style={{
                backgroundColor: '#EF444410', borderRadius: 16,
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
                borderWidth: 1, borderColor: '#EF444420',
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>
                Cancel this move
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 32, paddingTop: 16, paddingHorizontal: 20,
        backgroundColor: '#0A0A0Aee',
        borderTopWidth: 0.5, borderTopColor: '#1E1E1E',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        {!move.is_cancelled && (
          <View style={{ flex: 1 }}>
            <RSVPButton moveId={move.id} isFull={move.is_full} />
          </View>
        )}
        {isGoing ? (
          <TouchableOpacity
            onPress={handleCrewShare}
            style={{
              height: 48, paddingHorizontal: 16, borderRadius: 24,
              backgroundColor: '#FF6B3515',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 7,
              borderWidth: 1.5, borderColor: '#FF6B3540',
            }}
          >
            <Ionicons name="link-outline" size={18} color="#FF6B35" />
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 14 }}>
              Bring the crew
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: '#1E1E1E',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#2E2E2E',
            }}
          >
            <Ionicons name="share-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Back button */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
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

function InfoCard({ icon, color, children }: {
  icon: string; color: string; children: React.ReactNode
}) {
  return (
    <View style={{
      backgroundColor: '#1E1E1E', borderRadius: 18, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, borderColor: '#2E2E2E',
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>{children}</View>
    </View>
  );
}

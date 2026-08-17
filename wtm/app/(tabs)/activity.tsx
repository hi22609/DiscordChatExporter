import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useActivityFeed, useUnreadCount, markAllRead } from '@/hooks/useActivity';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/time';
import { CATEGORY_META } from '@/types/app';
import type { ActivityItem, ActivityType } from '@/types/app';

const ACTIVITY_COPY: Record<ActivityType, (actor: string) => string> = {
  rsvp_on_your_move:  (a) => `${a} just joined your move 🎉`,
  squad_confirmed:    (a) => `${a} tagged you as their crew 👥`,
  move_trending:      (_) => `Your move is blowing up 🔥`,
  move_starting_soon: (_) => `Your move starts in 30 minutes ⏰`,
  waitlist_promoted:  (_) => `A spot opened up — you're in 🎉`,
};

function activityCopy(type: ActivityType, actor: string | null): string {
  const name = actor ?? 'Someone';
  return ACTIVITY_COPY[type]?.(name) ?? `${name} did something`;
}

function ActivityRow({ item, onPress }: { item: ActivityItem; onPress: () => void }) {
  const actor = item.actor;
  const move  = item.move;
  const meta  = move ? CATEGORY_META[move.category as keyof typeof CATEGORY_META] : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 13,
        backgroundColor: item.read ? 'transparent' : 'rgba(255,107,53,0.06)',
        borderLeftWidth: item.read ? 0 : 3,
        borderLeftColor: '#FF6B35',
      }}
    >
      {/* Avatar or category emoji */}
      {actor?.avatar_url ? (
        <Image
          source={{ uri: actor.avatar_url }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#1E1E1E',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 22 }}>{meta?.emoji ?? '🔥'}</Text>
        </View>
      )}

      {/* Text */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: '#FAFAFA', fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
          {activityCopy(item.type, actor?.username ?? null)}
        </Text>
        {move && (
          <Text style={{ color: '#606060', fontSize: 13 }} numberOfLines={1}>
            {move.title}
          </Text>
        )}
        <Text style={{ color: '#3E3E3E', fontSize: 11, fontWeight: '500' }}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      {!item.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' }} />
      )}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={{ height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 20 }} />;
}

export default function ActivityScreen() {
  const router   = useRouter();
  const qc       = useQueryClient();
  const userId   = useAuthStore((s) => s.user?.id);
  const { data: items = [], isLoading, refetch, isRefetching } = useActivityFeed();
  const { data: unread = 0 } = useUnreadCount();

  // Mark all read once the count actually resolves. The previous version
  // depended only on `userId`, so on a cold start into this tab the effect ran
  // while `unread` was still its default 0 and never re-ran — leaving the badge
  // stuck for the whole session.
  const markedRef = useRef(false);
  useEffect(() => {
    if (!userId || unread === 0 || markedRef.current) return;
    markedRef.current = true;
    void markAllRead().then(() => {
      qc.invalidateQueries({ queryKey: ['activity', 'unread'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    });
  }, [userId, unread, qc]);

  const handlePress = useCallback((item: ActivityItem) => {
    if (item.move_id) router.push(`/move/${item.move_id}`);
  }, [router]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 4, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#FAFAFA', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
            Activity
          </Text>
          {unread > 0 && (
            <View style={{
              backgroundColor: '#FF6B35', borderRadius: 12,
              paddingHorizontal: 10, paddingVertical: 3,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                {unread} new
              </Text>
            </View>
          )}
        </View>
      </View>

      <Animated.View entering={FadeInDown.springify()} style={{ flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={Divider}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF6B35"
            />
          }
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 14 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: '#1A1A1A',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="notifications-outline" size={30} color="#3E3E3E" />
              </View>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '700' }}>All clear</Text>
              <Text style={{ color: '#424242', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                When people join your moves{'\n'}or tag you as crew, it shows up here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/create')}
                style={{
                  marginTop: 8,
                  backgroundColor: '#FF6B35',
                  paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Create a move</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ActivityRow item={item} onPress={() => handlePress(item)} />
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

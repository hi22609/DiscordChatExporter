import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { formatMoveTime } from '@/utils/time';
import { CATEGORY_META } from '@/types/app';

function useMyUpcomingMoves() {
  return useQuery({
    queryKey: queryKeys.moves.myUpcoming(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_upcoming_moves');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function ActivityScreen() {
  const { data: moves, isLoading } = useMyUpcomingMoves();
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 }}>
        <Text style={{ color: '#FAFAFA', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
          Your Moves
        </Text>
        <Text style={{ color: '#606060', fontSize: 14 }}>
          {moves?.length ?? 0} upcoming
        </Text>
      </View>

      {!moves?.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 48 }}>📅</Text>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '700' }}>No moves yet</Text>
          <Text style={{ color: '#606060', textAlign: 'center', lineHeight: 22 }}>
            Join or create a move{'\n'}and it'll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={moves}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const meta = CATEGORY_META[item.category as keyof typeof CATEGORY_META];
            return (
              <TouchableOpacity
                onPress={() => router.push(`/move/${item.id}`)}
                style={{
                  backgroundColor: '#1E1E1E',
                  borderRadius: 20,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 14,
                  backgroundColor: '#252525',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ color: '#A0A0A0', fontSize: 13 }}>
                    {formatMoveTime(item.starts_at)} · {item.location_name}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: item.rsvp_status === 'going' ? '#22C55E20' : '#FF6B3520',
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Text style={{
                    color: item.rsvp_status === 'going' ? '#22C55E' : '#FF6B35',
                    fontSize: 11, fontWeight: '700',
                  }}>
                    {item.rsvp_status === 'going' ? "Going" : "Maybe"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

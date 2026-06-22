import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { MoveCard } from '@/components/moves/MoveCard';
import type { Profile, MoveWithCounts } from '@/types/app';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.profiles.detail(id),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: moves = [] } = useQuery({
    queryKey: queryKeys.moves.byUser(id),
    queryFn: async (): Promise<MoveWithCounts[]> => {
      const { data, error } = await supabase.rpc('get_user_moves', {
        p_user_id: id,
        include_past: false,
      });
      if (error) throw error;
      return (data ?? []) as MoveWithCounts[];
    },
    enabled: !!id,
  });

  if (profileLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#606060' }}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 14,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          {/* Profile header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar
              uri={profile.avatar_url}
              name={profile.display_name || profile.username}
              size={72}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>
                {profile.display_name || profile.username}
              </Text>
              <Text style={{ color: '#606060', fontSize: 14 }}>@{profile.username}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="location" size={12} color="#606060" />
                <Text style={{ color: '#606060', fontSize: 12 }}>{profile.city}</Text>
              </View>
            </View>
          </View>

          {profile.bio && (
            <Text style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 22 }}>{profile.bio}</Text>
          )}

          <View style={{
            backgroundColor: '#1E1E1E', borderRadius: 18, padding: 16,
            borderWidth: 1, borderColor: '#2E2E2E',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>
              {profile.moves_created}
            </Text>
            <Text style={{ color: '#606060', fontSize: 12 }}>Moves Created</Text>
          </View>
        </View>

        {/* Their moves */}
        <View style={{ marginTop: 24 }}>
          <Text style={{
            color: '#FAFAFA', fontSize: 17, fontWeight: '800',
            paddingHorizontal: 20, marginBottom: 12,
          }}>
            Upcoming moves
          </Text>
          <View style={{ paddingHorizontal: 16 }}>
            {moves.length === 0 ? (
              <Text style={{ color: '#424242', fontSize: 14, textAlign: 'center', paddingVertical: 24 }}>
                No upcoming moves
              </Text>
            ) : (
              moves.map((move, i) => (
                <MoveCard key={move.id} move={move} index={i} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

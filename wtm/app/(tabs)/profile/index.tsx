import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useMyInvite } from '@/hooks/useInvites';
import { Avatar } from '@/components/ui/Avatar';
import { MoveCard } from '@/components/moves/MoveCard';
import { LinearGradient } from 'expo-linear-gradient';
import type { MoveWithCounts } from '@/types/app';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { data: invite } = useMyInvite();

  const { data: myMoves } = useQuery({
    queryKey: queryKeys.moves.byUser(user?.id ?? ''),
    queryFn: async (): Promise<MoveWithCounts[]> => {
      const { data, error } = await supabase.rpc('get_user_moves', {
        p_user_id: user!.id,
        include_past: false,
      });
      if (error) throw error;
      return (data ?? []) as MoveWithCounts[];
    },
    enabled: !!user?.id,
  });

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          useAuthStore.getState().signOut();
        },
      },
    ]);
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingVertical: 12,
        }}>
          <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/edit')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#1E1E1E', borderRadius: 12,
              paddingHorizontal: 12, paddingVertical: 7,
              borderWidth: 1, borderColor: '#2E2E2E',
            }}
          >
            <Ionicons name="pencil-outline" size={14} color="#A0A0A0" />
            <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar
              uri={profile.avatar_url}
              name={profile.display_name || profile.username}
              size={72}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>
                {profile.display_name || profile.username}
              </Text>
              <Text style={{ color: '#606060', fontSize: 14 }}>@{profile.username}</Text>
            </View>
          </View>

          {profile.bio && (
            <Text style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 22 }}>
              {profile.bio}
            </Text>
          )}

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#1E1E1E',
            borderRadius: 20, padding: 16,
            borderWidth: 1, borderColor: '#2E2E2E',
          }}>
            <Stat label="Moves Created" value={profile.moves_created} />
            <View style={{ width: 1, backgroundColor: '#2E2E2E', marginHorizontal: 16 }} />
            <Stat label="City" value={profile.city} isText />
          </View>

          {/* Invite friends — the club-growth card */}
          <TouchableOpacity onPress={() => router.push('/invite-friends')} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FF6B35', '#E84E14']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{
                width: 46, height: 46, borderRadius: 14,
                backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24 }}>🎟️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Invite friends</Text>
                <Text style={{ color: '#ffffffcc', fontSize: 13 }}>
                  {invite ? `${invite.invites_left} of ${invite.max_uses} invites left` : 'Bring your people in'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ffffffcc" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My moves */}
        <View style={{ marginTop: 28 }}>
          <Text style={{
            color: '#FAFAFA', fontSize: 17, fontWeight: '800',
            paddingHorizontal: 20, marginBottom: 12,
          }}>
            My moves
          </Text>
          {myMoves?.length === 0 && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 36 }}>🎯</Text>
              <Text style={{ color: '#A0A0A0', fontSize: 15, textAlign: 'center' }}>
                You haven't created any moves yet.{'\n'}
                <Text style={{ color: '#FF6B35' }}>Set the first one.</Text>
              </Text>
            </View>
          )}
          <View style={{ paddingHorizontal: 16 }}>
            {myMoves?.map((move, i) => (
              <MoveCard key={move.id} move={move} index={i} showRSVP={false} />
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            marginHorizontal: 20, marginTop: 8,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            padding: 16, borderRadius: 16,
            backgroundColor: '#EF444410',
            borderWidth: 1, borderColor: '#EF444420',
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600' }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text style={{ color: '#FAFAFA', fontSize: isText ? 16 : 24, fontWeight: '800' }}>
        {value}
      </Text>
      <Text style={{ color: '#606060', fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

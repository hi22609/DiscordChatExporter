import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import type { MoveAttendee } from '@/types/app';

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ['attendees', id],
    queryFn: async (): Promise<MoveAttendee[]> => {
      const { data, error } = await supabase.rpc('get_move_attendees', {
        p_move_id: id,
        p_limit: 200,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 0.5, borderBottomColor: '#1E1E1E',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>
          Who's going ({attendees.length})
        </Text>
      </View>

      <FlatList
        data={attendees}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ padding: 16, gap: 2 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/user/${item.user_id}`)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              padding: 12, borderRadius: 16,
            }}
          >
            <Avatar uri={item.avatar_url} name={item.display_name || item.username} size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>
                {item.display_name || item.username}
              </Text>
              <Text style={{ color: '#606060', fontSize: 13 }}>@{item.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#2E2E2E" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

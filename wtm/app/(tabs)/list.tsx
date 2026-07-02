import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { FilterBar } from '@/components/feed/FilterBar';
import { FeedList } from '@/components/feed/FeedList';

export default function ListScreen() {
  const { city, permissionGranted } = useLocation();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
      }}>
        <View>
          <Text style={{ color: '#606060', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
            WHAT'S THE MOVE
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location" size={14} color="#FF6B35" />
            <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
              {city}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="map" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>

      {permissionGranted === false && (
        <View style={{
          marginHorizontal: 16, marginBottom: 8, padding: 12,
          backgroundColor: '#FF6B3515', borderRadius: 12,
          borderWidth: 1, borderColor: '#FF6B3530',
          flexDirection: 'row', gap: 8, alignItems: 'center',
        }}>
          <Ionicons name="location-outline" size={16} color="#FF6B35" />
          <Text style={{ color: '#FF6B35', fontSize: 13, flex: 1 }}>
            Enable location to see moves near you. Showing Pittsburgh.
          </Text>
        </View>
      )}

      <FilterBar />
      <FeedList />
    </SafeAreaView>
  );
}

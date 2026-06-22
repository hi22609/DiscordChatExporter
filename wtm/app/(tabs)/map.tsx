import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/store/filterStore';
import { CATEGORY_META } from '@/types/app';
import { formatMoveTime } from '@/utils/time';
import { RSVPButton } from '@/components/moves/RSVPButton';
import type { NearbyMove } from '@/types/app';

const { width, height } = Dimensions.get('window');
const PITTSBURGH = { latitude: 40.4406, longitude: -79.9959 };
const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen() {
  const router = useRouter();
  const { getCoords } = useLocation();
  const { category } = useFilterStore();
  const [moves, setMoves] = useState<NearbyMove[]>([]);
  const [selected, setSelected] = useState<NearbyMove | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const coords = getCoords();

  const fetchMoves = useCallback(async (region: Region) => {
    const radiusM = Math.max(
      haversineToMeters(region.latitudeDelta, region.longitudeDelta),
      5000
    );
    const { data } = await supabase.rpc('nearby_moves', {
      lat: region.latitude,
      lng: region.longitude,
      radius_m: radiusM,
      filter_cat: category,
      page_size: 50,
    });
    setMoves((data ?? []) as NearbyMove[]);
  }, [category]);

  function onRegionChangeComplete(region: Region) {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchMoves(region), 500);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lng,
          ...DEFAULT_DELTA,
        }}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsCompass={false}
        toolbarEnabled={false}
      >
        {moves.map((move) => (
          <Marker
            key={move.id}
            coordinate={{
              latitude: 0, // location_point is geometry, parsed server-side
              longitude: 0,
            }}
            onPress={() => setSelected(move)}
          >
            <MapPin move={move} isSelected={selected?.id === move.id} />
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{
          margin: 16, flexDirection: 'row', gap: 10,
        }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#0A0A0Aee', borderRadius: 14, paddingHorizontal: 14, height: 44,
            borderWidth: 1, borderColor: '#2E2E2E',
          }}>
            <Ionicons name="search" size={16} color="#606060" />
            <Text style={{ color: '#424242', fontSize: 15 }}>Search moves on map...</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Move detail bottom card */}
      {selected && (
        <View style={{
          position: 'absolute', bottom: 90, left: 16, right: 16,
          backgroundColor: '#1E1E1E',
          borderRadius: 24, padding: 16, gap: 12,
          borderWidth: 1, borderColor: '#2E2E2E',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5, shadowRadius: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>
                  {CATEGORY_META[selected.category].emoji}
                </Text>
                <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                  {selected.title}
                </Text>
              </View>
              <Text style={{ color: '#A0A0A0', fontSize: 13 }}>
                {formatMoveTime(selected.starts_at)} · {selected.location_name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color="#606060" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#606060', fontSize: 13 }}>
              {selected.attendee_count} going
              {selected.spots_left != null && ` · ${selected.spots_left} spots left`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push(`/move/${selected.id}`)}
                style={{
                  height: 36, paddingHorizontal: 14, borderRadius: 18,
                  backgroundColor: '#2E2E2E',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#A0A0A0', fontWeight: '600', fontSize: 13 }}>Details</Text>
              </TouchableOpacity>
              <RSVPButton moveId={selected.id} isFull={selected.is_full} compact />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function MapPin({ move, isSelected }: { move: NearbyMove; isSelected: boolean }) {
  const meta = CATEGORY_META[move.category];
  return (
    <View style={{
      alignItems: 'center',
      transform: [{ scale: isSelected ? 1.2 : 1 }],
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: isSelected ? '#FF6B35' : '#1E1E1E',
        borderWidth: 2.5,
        borderColor: isSelected ? '#FF6B35' : '#2E2E2E',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4, shadowRadius: 6,
      }}>
        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
      </View>
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: isSelected ? '#FF6B35' : '#2E2E2E',
        marginTop: -3,
      }} />
    </View>
  );
}

function haversineToMeters(latDelta: number, lngDelta: number): number {
  return Math.max(latDelta, lngDelta) * 111320;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#222' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060d18' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

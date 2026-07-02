import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/store/filterStore';
import { CATEGORY_META, type MoveCategory } from '@/types/app';
import { formatMoveTime } from '@/utils/time';
import { RSVPButton } from '@/components/moves/RSVPButton';
import type { NearbyMove } from '@/types/app';

const { width } = Dimensions.get('window');
const DEFAULT_DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };

const CATEGORIES: Array<{ value: MoveCategory | null; label: string; emoji: string }> = [
  { value: null, label: 'All', emoji: '🔥' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
    value: key as MoveCategory,
    label: meta.label.split(' ')[0],
    emoji: meta.emoji,
  })),
];

export default function MapHomeScreen() {
  const router = useRouter();
  const { getCoords, city, permissionGranted } = useLocation();
  const { category, setCategory } = useFilterStore();
  const [moves, setMoves] = useState<NearbyMove[]>([]);
  const [selected, setSelected] = useState<NearbyMove | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const mapRef = useRef<MapView>(null);

  const coords = getCoords();

  const fetchMoves = useCallback(async (region: Region) => {
    const radiusM = Math.max(regionToMeters(region), 5000);
    const { data } = await supabase.rpc('nearby_moves', {
      lat: region.latitude,
      lng: region.longitude,
      radius_m: radiusM,
      filter_cat: category,
      page_size: 80,
    });
    setMoves((data ?? []) as NearbyMove[]);
    setIsLoading(false);
  }, [category]);

  // Refetch when category filter changes
  useEffect(() => {
    fetchMoves({ latitude: coords.lat, longitude: coords.lng, ...DEFAULT_DELTA });
  }, [category]);

  function onRegionChangeComplete(region: Region) {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchMoves(region), 500);
  }

  function recenter() {
    mapRef.current?.animateToRegion({
      latitude: coords.lat,
      longitude: coords.lng,
      ...DEFAULT_DELTA,
    }, 400);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{ latitude: coords.lat, longitude: coords.lng, ...DEFAULT_DELTA }}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={() => setSelected(null)}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {moves.map((move) => (
          <Marker
            key={move.id}
            coordinate={{ latitude: move.latitude, longitude: move.longitude }}
            onPress={(e) => { e.stopPropagation?.(); setSelected(move); }}
            tracksViewChanges={false}
          >
            <MapPin move={move} isSelected={selected?.id === move.id} />
          </Marker>
        ))}
      </MapView>

      {/* Top overlay: brand + city + category filter */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: '#0A0A0Aee', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2E2E2E' }}>
            <Text style={{ color: '#606060', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              WHAT'S THE MOVE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={13} color="#FF6B35" />
              <Text style={{ color: '#FAFAFA', fontSize: 16, fontWeight: '800' }}>{city}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/list')}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#0A0A0Aee', borderWidth: 1, borderColor: '#2E2E2E',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="list" size={20} color="#FAFAFA" />
          </TouchableOpacity>
        </View>

        {/* Floating category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value ?? 'all'}
                onPress={() => setCategory(cat.value)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 13, paddingVertical: 8, borderRadius: 100,
                  backgroundColor: isActive ? '#FF6B35' : '#0A0A0Aee',
                  borderWidth: 1, borderColor: isActive ? '#FF6B35' : '#2E2E2E',
                }}
              >
                <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                <Text style={{ color: isActive ? '#fff' : '#A0A0A0', fontWeight: isActive ? '700' : '500', fontSize: 12 }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Recenter button */}
      <TouchableOpacity
        onPress={recenter}
        style={{
          position: 'absolute', right: 16, bottom: selected ? 240 : 110,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#0A0A0Aee', borderWidth: 1, borderColor: '#2E2E2E',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="locate" size={20} color="#FF6B35" />
      </TouchableOpacity>

      {/* Empty / loading hint */}
      {!isLoading && moves.length === 0 && (
        <View style={{ position: 'absolute', bottom: 120, left: 24, right: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1E1E1Eee', borderRadius: 18, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2E2E2E' }}>
            <Text style={{ fontSize: 28 }}>🗺️</Text>
            <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>No moves in view</Text>
            <Text style={{ color: '#606060', fontSize: 13, textAlign: 'center' }}>
              Pan around, widen the vibe, or set the first one.
            </Text>
          </View>
        </View>
      )}

      {isLoading && (
        <View style={{ position: 'absolute', top: '48%', alignSelf: 'center' }}>
          <ActivityIndicator color="#FF6B35" />
        </View>
      )}

      {/* Selected move card */}
      {selected && (
        <Animated.View
          entering={FadeInUp.springify().damping(18)}
          style={{
            position: 'absolute', bottom: 96, left: 16, right: 16,
            backgroundColor: '#1E1E1E', borderRadius: 24, padding: 16, gap: 12,
            borderWidth: 1, borderColor: '#2E2E2E',
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16,
          }}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/move/${selected.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_META[selected.category].emoji}</Text>
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
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#606060', fontSize: 13 }}>
              {selected.attendee_count} going
              {selected.spots_left != null && ` · ${selected.spots_left} left`}
            </Text>
            <RSVPButton moveId={selected.id} isFull={selected.is_full} compact />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function MapPin({ move, isSelected }: { move: NearbyMove; isSelected: boolean }) {
  const meta = CATEGORY_META[move.category];
  return (
    <View style={{ alignItems: 'center', transform: [{ scale: isSelected ? 1.2 : 1 }] }}>
      <View style={{
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: isSelected ? '#FF6B35' : '#1E1E1E',
        borderWidth: 2.5, borderColor: isSelected ? '#FF6B35' : '#2E2E2E',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6,
      }}>
        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
      </View>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSelected ? '#FF6B35' : '#2E2E2E', marginTop: -3 }} />
    </View>
  );
}

function regionToMeters(region: Region): number {
  return Math.max(region.latitudeDelta, region.longitudeDelta) * 111320;
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

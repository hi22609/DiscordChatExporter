import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE, LongPressEvent } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/store/filterStore';
import { fetchNearbySpots } from '@/hooks/useSpots';
import {
  CATEGORY_META, SPOT_CATEGORY_META,
  type MoveCategory, type SpotCategory, type NearbyMove, type NearbySpot,
} from '@/types/app';
import { formatMoveTime } from '@/utils/time';
import { formatDistance } from '@/utils/distance';
import { darkMapStyle } from '@/constants/mapStyle';
import { RSVPButton } from '@/components/moves/RSVPButton';

const DEFAULT_DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };

type MapLayer = 'moves' | 'spots';

const MOVE_CATEGORIES: Array<{ value: MoveCategory | null; label: string; emoji: string }> = [
  { value: null, label: 'All', emoji: '🔥' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
    value: key as MoveCategory,
    label: meta.label.split(' ')[0],
    emoji: meta.emoji,
  })),
];

const SPOT_CATEGORIES: Array<{ value: SpotCategory | null; label: string; emoji: string }> = [
  { value: null, label: 'All', emoji: '📍' },
  ...Object.entries(SPOT_CATEGORY_META).map(([key, meta]) => ({
    value: key as SpotCategory,
    label: meta.label,
    emoji: meta.emoji,
  })),
];

export default function MapHomeScreen() {
  const router = useRouter();
  const { getCoords, city } = useLocation();
  const { category, setCategory } = useFilterStore();

  const [layer, setLayer] = useState<MapLayer>('moves');
  const [spotCategory, setSpotCategory] = useState<SpotCategory | null>(null);
  const [moves, setMoves] = useState<NearbyMove[]>([]);
  const [spots, setSpots] = useState<NearbySpot[]>([]);
  const [selectedMove, setSelectedMove] = useState<NearbyMove | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<NearbySpot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastRegion = useRef<Region | null>(null);
  // Only a real gesture counts as "user panned" — onRegionChangeComplete also
  // fires when the map first settles, which must not block the GPS fly-to.
  const userPanned = useRef(false);
  const mapRef = useRef<MapView>(null);

  const coords = getCoords();

  const fetchLayer = useCallback(async (region: Region) => {
    // Capped: an uncapped radius at continent zoom turns ST_DWithin into a scan
  // of the whole moves table, and returns nothing a user can act on anyway.
  const radiusM = Math.min(Math.max(regionToMeters(region), 5000), 50_000);
    if (layer === 'moves') {
      const { data } = await supabase.rpc('nearby_moves', {
        lat: region.latitude,
        lng: region.longitude,
        radius_m: radiusM,
        filter_cat: category,
        page_size: 80,
      });
      setMoves((data ?? []) as NearbyMove[]);
    } else {
      const data = await fetchNearbySpots(region.latitude, region.longitude, radiusM, spotCategory);
      setSpots(data);
    }
    setIsLoading(false);
  }, [layer, category, spotCategory]);

  // Refetch when layer or filters change
  useEffect(() => {
    const region = lastRegion.current ?? { latitude: coords.lat, longitude: coords.lng, ...DEFAULT_DELTA };
    setIsLoading(true);
    fetchLayer(region);
  }, [layer, category, spotCategory]);

  // When GPS first resolves, fly to the user and refetch — but never yank the
  // map away from someone who has already panned somewhere on purpose.
  useEffect(() => {
    if (userPanned.current) return;
    const region = { latitude: coords.lat, longitude: coords.lng, ...DEFAULT_DELTA };
    mapRef.current?.animateToRegion(region, 500);
    fetchLayer(region);
  }, [coords.lat, coords.lng]);

  function onRegionChangeComplete(region: Region) {
    lastRegion.current = region;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchLayer(region), 500);
  }

  function switchLayer(next: MapLayer) {
    if (next === layer) return;
    Haptics.selectionAsync();
    setLayer(next);
    setSelectedMove(null);
    setSelectedSpot(null);
  }

  function clearSelection() {
    setSelectedMove(null);
    setSelectedSpot(null);
  }

  function onLongPress(e: LongPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/add-spot',
      params: { lat: String(latitude), lng: String(longitude) },
    });
  }

  function recenter() {
    mapRef.current?.animateToRegion({
      latitude: coords.lat,
      longitude: coords.lng,
      ...DEFAULT_DELTA,
    }, 400);
  }

  const hasSelection = !!(selectedMove || selectedSpot);
  const isEmpty = !isLoading && (layer === 'moves' ? moves.length === 0 : spots.length === 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{ latitude: coords.lat, longitude: coords.lng, ...DEFAULT_DELTA }}
        onRegionChangeComplete={onRegionChangeComplete}
        onPanDrag={() => { userPanned.current = true; }}
        onPress={clearSelection}
        onLongPress={onLongPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {layer === 'moves' && moves.map((move) => (
          <Marker
            key={move.id}
            coordinate={{ latitude: move.latitude, longitude: move.longitude }}
            onPress={(e) => { e.stopPropagation?.(); setSelectedMove(move); }}
            tracksViewChanges={false}
          >
            <MovePin move={move} isSelected={selectedMove?.id === move.id} />
          </Marker>
        ))}
        {layer === 'spots' && spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={(e) => { e.stopPropagation?.(); setSelectedSpot(spot); }}
            tracksViewChanges={false}
          >
            <SpotPin spot={spot} isSelected={selectedSpot?.id === spot.id} />
          </Marker>
        ))}
      </MapView>

      {/* Top overlay */}
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

        {/* Layer toggle: Moves ↔ Spots */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#0A0A0Aee',
            borderRadius: 100, padding: 3,
            borderWidth: 1, borderColor: '#2E2E2E',
          }}>
            <LayerTab
              label="🕺 Moves"
              active={layer === 'moves'}
              onPress={() => switchLayer('moves')}
            />
            <LayerTab
              label="📍 Spots"
              active={layer === 'spots'}
              onPress={() => switchLayer('spots')}
            />
          </View>
        </View>

        {/* Category filter for the active layer */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
        >
          {layer === 'moves'
            ? MOVE_CATEGORIES.map((cat) => (
                <FilterPill
                  key={cat.value ?? 'all'}
                  emoji={cat.emoji}
                  label={cat.label}
                  active={category === cat.value}
                  onPress={() => setCategory(cat.value)}
                />
              ))
            : SPOT_CATEGORIES.map((cat) => (
                <FilterPill
                  key={cat.value ?? 'all'}
                  emoji={cat.emoji}
                  label={cat.label}
                  active={spotCategory === cat.value}
                  onPress={() => setSpotCategory(cat.value)}
                />
              ))}
        </ScrollView>
      </SafeAreaView>

      {/* Recenter */}
      <TouchableOpacity
        onPress={recenter}
        style={{
          position: 'absolute', right: 16, bottom: hasSelection ? 240 : 110,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#0A0A0Aee', borderWidth: 1, borderColor: '#2E2E2E',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="locate" size={20} color="#FF6B35" />
      </TouchableOpacity>

      {/* Empty state */}
      {isEmpty && (
        <View style={{ position: 'absolute', bottom: 120, left: 24, right: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1E1E1Eee', borderRadius: 18, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2E2E2E' }}>
            <Text style={{ fontSize: 28 }}>{layer === 'moves' ? '🗺️' : '💎'}</Text>
            <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>
              {layer === 'moves' ? 'No moves in view' : 'No spots dropped yet'}
            </Text>
            <Text style={{ color: '#606060', fontSize: 13, textAlign: 'center' }}>
              {layer === 'moves'
                ? 'Pan around, widen the vibe, or set the first one.'
                : 'Know a fire spot? Long-press the map to drop it.'}
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
      {selectedMove && (
        <Animated.View entering={FadeInUp.springify().damping(18)} style={cardStyle}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/move/${selectedMove.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_META[selectedMove.category].emoji}</Text>
                  <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                    {selectedMove.title}
                  </Text>
                </View>
                <Text style={{ color: '#A0A0A0', fontSize: 13 }}>
                  {formatMoveTime(selectedMove.starts_at)} · {selectedMove.location_name}
                </Text>
              </View>
              <TouchableOpacity onPress={clearSelection} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#606060" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#606060', fontSize: 13 }}>
              {selectedMove.attendee_count} going
              {selectedMove.spots_left != null && ` · ${selectedMove.spots_left} left`}
            </Text>
            <RSVPButton moveId={selectedMove.id} isFull={selectedMove.is_full} compact />
          </View>
        </Animated.View>
      )}

      {/* Selected spot card */}
      {selectedSpot && (
        <Animated.View entering={FadeInUp.springify().damping(18)} style={cardStyle}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/spot/${selectedSpot.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{SPOT_CATEGORY_META[selectedSpot.category].emoji}</Text>
                  <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                    {selectedSpot.name}
                  </Text>
                </View>
                <Text style={{ color: '#A0A0A0', fontSize: 13 }}>
                  {SPOT_CATEGORY_META[selectedSpot.category].label}
                  {' · '}{formatDistance(selectedSpot.distance_m)} away
                  {selectedSpot.best_time ? ` · best: ${selectedSpot.best_time}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={clearSelection} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#606060" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '800' }}>
                {selectedSpot.fire_count}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/spot/${selectedSpot.id}`)}
              style={{
                height: 36, paddingHorizontal: 16, borderRadius: 18,
                backgroundColor: '#FF6B35',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Check it out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const cardStyle = {
  position: 'absolute' as const,
  bottom: 96, left: 16, right: 16,
  backgroundColor: '#1E1E1E', borderRadius: 24, padding: 16, gap: 12,
  borderWidth: 1, borderColor: '#2E2E2E',
  shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16,
};

function LayerTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100,
        backgroundColor: active ? '#FF6B35' : 'transparent',
      }}
    >
      <Text style={{ color: active ? '#fff' : '#A0A0A0', fontWeight: active ? '800' : '500', fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterPill({ emoji, label, active, onPress }: {
  emoji: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 13, paddingVertical: 8, borderRadius: 100,
        backgroundColor: active ? '#FF6B35' : '#0A0A0Aee',
        borderWidth: 1, borderColor: active ? '#FF6B35' : '#2E2E2E',
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ color: active ? '#fff' : '#A0A0A0', fontWeight: active ? '700' : '500', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MovePin({ move, isSelected }: { move: NearbyMove; isSelected: boolean }) {
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

// Spot pins are diamonds — visually distinct from circular move pins,
// with a small flame count for spots that have heat.
function SpotPin({ spot, isSelected }: { spot: NearbySpot; isSelected: boolean }) {
  const meta = SPOT_CATEGORY_META[spot.category];
  const isHot = spot.fire_count >= 10;
  return (
    <View style={{ alignItems: 'center', transform: [{ scale: isSelected ? 1.2 : 1 }] }}>
      <View style={{
        width: 40, height: 40,
        backgroundColor: isSelected ? '#FF6B35' : '#1E1E1E',
        borderWidth: 2.5,
        borderColor: isSelected ? '#FF6B35' : isHot ? '#FF6B35' : '#2E2E2E',
        borderRadius: 12,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center', justifyContent: 'center',
        shadowColor: isHot ? '#FF6B35' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isHot ? 0.6 : 0.4,
        shadowRadius: 6,
      }}>
        <Text style={{ fontSize: 18, transform: [{ rotate: '-45deg' }] }}>{meta.emoji}</Text>
      </View>
      {isHot && (
        <View style={{
          position: 'absolute', top: -8, right: -10,
          backgroundColor: '#FF6B35', borderRadius: 100,
          paddingHorizontal: 5, paddingVertical: 1,
          flexDirection: 'row', alignItems: 'center',
        }}>
          <Text style={{ fontSize: 9 }}>🔥</Text>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{spot.fire_count}</Text>
        </View>
      )}
    </View>
  );
}

function regionToMeters(region: Region): number {
  return Math.max(region.latitudeDelta, region.longitudeDelta) * 111320;
}


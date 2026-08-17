import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useCreateSpot } from '@/hooks/useSpots';
import { uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { miniMapStyle } from '@/constants/mapStyle';
import { SPOT_CATEGORY_META, type SpotCategory } from '@/types/app';

const SPOT_CATEGORIES = Object.entries(SPOT_CATEGORY_META) as Array<
  [SpotCategory, (typeof SPOT_CATEGORY_META)[SpotCategory]]
>;

export default function AddSpotScreen() {
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const createSpot = useCreateSpot();

  const latitude = lat ? parseFloat(lat) : 40.4406;
  const longitude = lng ? parseFloat(lng) : -79.9959;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SpotCategory | null>(null);
  const [bestTime, setBestTime] = useState('');
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setCoverImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!name.trim() || !category) {
      Alert.alert('Missing info', 'Give the spot a name and pick a category.');
      return;
    }
    try {
      const spotId = await createSpot.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        latitude,
        longitude,
        best_time: bestTime.trim() || undefined,
      });

      // Upload the photo and persist it — non-fatal if it fails.
      if (coverImageUri) {
        try {
          const url = await uploadImage('spot-images', `spots/${spotId}/cover`, coverImageUri);
          await supabase.from('spots').update({ cover_image_url: url }).eq('id', spotId);
        } catch (err) {
          console.warn('spot cover upload failed', err);
        }
      }

      router.replace(`/spot/${spotId}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to drop the spot. Try again.');
    }
  }

  const canSubmit = !!name.trim() && !!category;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 12,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color="#FAFAFA" />
          </TouchableOpacity>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
            Drop a Spot
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || createSpot.isPending}
            style={{
              backgroundColor: canSubmit ? '#FF6B35' : '#252525',
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18,
              opacity: createSpot.isPending ? 0.7 : 1,
            }}
          >
            {createSpot.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: canSubmit ? '#fff' : '#424242', fontWeight: '700', fontSize: 14 }}>
                Drop it
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 60 }}>
          {/* Pinned location preview */}
          <View style={{ borderRadius: 20, overflow: 'hidden', height: 140, borderWidth: 1, borderColor: '#2E2E2E' }}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              customMapStyle={miniMapStyle}
              initialRegion={{
                latitude, longitude,
                latitudeDelta: 0.008, longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
            >
              <Marker coordinate={{ latitude, longitude }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: '#FF6B35',
                  transform: [{ rotate: '45deg' }],
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16, transform: [{ rotate: '-45deg' }] }}>📍</Text>
                </View>
              </Marker>
            </MapView>
            <View style={{
              position: 'absolute', bottom: 8, left: 8,
              backgroundColor: '#0A0A0Add', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 5,
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11, fontWeight: '600' }}>
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Section label="Name the spot">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="The rusty bridge, sunset rock, secret ledge..."
              placeholderTextColor="#424242"
              maxLength={80}
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                padding: 16, color: '#FAFAFA', fontSize: 17, fontWeight: '600',
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            />
          </Section>

          {/* Category */}
          <Section label="What kind of spot?">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {SPOT_CATEGORIES.map(([key, meta]) => {
                const isSelected = category === key;
                return (
                  <TouchableOpacity key={key} onPress={() => setCategory(key)} style={{ width: '30%' }}>
                    <View style={{
                      borderRadius: 16, overflow: 'hidden',
                      borderWidth: 2, borderColor: isSelected ? '#FF6B35' : 'transparent',
                    }}>
                      <LinearGradient
                        colors={isSelected ? meta.gradient : ['#1E1E1E', '#252525']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 12, alignItems: 'center', gap: 6 }}
                      >
                        <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                        <Text style={{
                          color: isSelected ? '#fff' : '#A0A0A0',
                          fontSize: 11, fontWeight: '600', textAlign: 'center',
                        }}>
                          {meta.label}
                        </Text>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* Cover photo */}
          <Section label="Show it off (optional)">
            <TouchableOpacity
              onPress={pickImage}
              style={{
                height: 140, borderRadius: 20, overflow: 'hidden',
                backgroundColor: '#1E1E1E',
                borderWidth: 1, borderColor: '#2E2E2E', borderStyle: 'dashed',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {coverImageUri ? (
                <Image source={{ uri: coverImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="camera-outline" size={30} color="#424242" />
                  <Text style={{ color: '#606060', fontSize: 14 }}>Add a photo of the spot</Text>
                </View>
              )}
            </TouchableOpacity>
          </Section>

          {/* Best time */}
          <Section label="Best time to go (optional)">
            <TextInput
              value={bestTime}
              onChangeText={setBestTime}
              placeholder="Golden hour, weekday mornings, after rain..."
              placeholderTextColor="#424242"
              maxLength={60}
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 50, color: '#FAFAFA', fontSize: 15,
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            />
          </Section>

          {/* Description */}
          <Section label="The intel (optional)">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="How to get in, what to bring, what makes it fire..."
              placeholderTextColor="#424242"
              multiline
              maxLength={500}
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                padding: 16, color: '#FAFAFA', fontSize: 15,
                borderWidth: 1, borderColor: '#2E2E2E',
                minHeight: 100, textAlignVertical: 'top',
              }}
            />
          </Section>

          <Text style={{ color: '#424242', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            Keep it real — only drop spots you'd send a friend to.{'\n'}
            Respect the places and the people around them.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}


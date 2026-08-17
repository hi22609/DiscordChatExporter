import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useCreateMove, attachMoveCoverImage } from '@/hooks/useCreateMove';
import { CategoryPicker } from '@/components/moves/CategoryPicker';
import { format } from 'date-fns';
import type { MoveCategory, CreateMoveInput } from '@/types/app';

interface FormState {
  title: string;
  description: string;
  category: MoveCategory | null;
  locationName: string;
  locationLat: number | null;
  locationLng: number | null;
  address: string;
  startsAt: Date;
  endsAt: Date | null;
  hasEndTime: boolean;
  maxAttendees: string;
  hasMaxAttendees: boolean;
  coverImageUri: string | null;
}

function getDefaultStartTime(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

export default function CreateScreen() {
  const router = useRouter();
  const createMove = useCreateMove();
  // Prefill from "Set a move here" on a spot detail screen.
  const prefill = useLocalSearchParams<{
    locationName?: string; lat?: string; lng?: string; address?: string;
  }>();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: null,
    locationName: '',
    locationLat: null,
    locationLng: null,
    address: '',
    startsAt: getDefaultStartTime(),
    endsAt: null,
    hasEndTime: false,
    maxAttendees: '10',
    hasMaxAttendees: false,
    coverImageUri: null,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Tabs stay mounted, so apply prefill whenever the params change —
  // not just on first render.
  useEffect(() => {
    if (!prefill.locationName) return;
    setForm((f) => ({
      ...f,
      locationName: prefill.locationName ?? f.locationName,
      locationLat: prefill.lat ? parseFloat(prefill.lat) : f.locationLat,
      locationLng: prefill.lng ? parseFloat(prefill.lng) : f.locationLng,
      address: prefill.address ?? f.address,
    }));
  }, [prefill.locationName, prefill.lat, prefill.lng, prefill.address]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      update('coverImageUri', result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!form.category || !form.title.trim() || !form.locationName.trim()) {
      Alert.alert('Missing info', 'Title, category, and location are required.');
      return;
    }

    const input: CreateMoveInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      location_name: form.locationName.trim(),
      location_lat: form.locationLat ?? 40.4406,
      location_lng: form.locationLng ?? -79.9959,
      address: form.address.trim() || undefined,
      starts_at: form.startsAt,
      ends_at: form.hasEndTime ? form.endsAt ?? undefined : undefined,
      max_attendees: form.hasMaxAttendees ? parseInt(form.maxAttendees) : undefined,
    };

    try {
      const moveId = await createMove.mutateAsync(input);

      // Upload the cover and persist its URL on the move row.
      if (form.coverImageUri) {
        setIsUploading(true);
        await attachMoveCoverImage(form.coverImageUri, moveId);
        setIsUploading(false);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/move/${moveId}`);
    } catch (err: any) {
      setIsUploading(false);
      Alert.alert('Error', err.message || 'Failed to create move. Try again.');
    }
  }

  const canSubmit = form.title.trim() && form.category && form.locationName.trim();
  const isLoading = createMove.isPending || isUploading;

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
          <Text style={{ color: '#FAFAFA', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
            Set The Move
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            style={{
              backgroundColor: canSubmit ? '#FF6B35' : '#252525',
              paddingHorizontal: 18, paddingVertical: 8,
              borderRadius: 20,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: canSubmit ? '#fff' : '#424242', fontWeight: '700', fontSize: 15 }}>
                Post it
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 100 }}
        >
          {/* Cover image */}
          <TouchableOpacity
            onPress={pickImage}
            style={{
              height: 160, borderRadius: 20, overflow: 'hidden',
              backgroundColor: '#1E1E1E',
              borderWidth: 1, borderColor: '#2E2E2E',
              borderStyle: 'dashed',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {form.coverImageUri ? (
              <Image
                source={{ uri: form.coverImageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="image-outline" size={32} color="#424242" />
                <Text style={{ color: '#606060', fontSize: 14 }}>Add a cover photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Section label="What's the move?">
            <TextInput
              value={form.title}
              onChangeText={(t) => update('title', t)}
              placeholder="Bar crawl, pickup game, rooftop hangout..."
              placeholderTextColor="#424242"
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                padding: 16, color: '#FAFAFA', fontSize: 17, fontWeight: '600',
                borderWidth: 1, borderColor: '#2E2E2E',
                minHeight: 52,
              }}
              maxLength={100}
              multiline
            />
          </Section>

          {/* Category */}
          <Section label="Vibe">
            <CategoryPicker
              value={form.category}
              onChange={(c) => update('category', c)}
            />
          </Section>

          {/* Location */}
          <Section label="Where at?">
            <TextInput
              value={form.locationName}
              onChangeText={(t) => update('locationName', t)}
              placeholder="Smiling Moose, Frick Park, your place..."
              placeholderTextColor="#424242"
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 52,
                color: '#FAFAFA', fontSize: 15,
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            />
            <TextInput
              value={form.address}
              onChangeText={(t) => update('address', t)}
              placeholder="Street address (optional)"
              placeholderTextColor="#424242"
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 44,
                color: '#FAFAFA', fontSize: 14,
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            />
          </Section>

          {/* Time */}
          <Section label="When?">
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 52,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="time-outline" size={18} color="#FF6B35" />
                <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '600' }}>
                  {format(form.startsAt, "EEE, MMM d 'at' h:mm a")}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#606060" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 14 }}>Set end time</Text>
              <Switch
                value={form.hasEndTime}
                onValueChange={(v) => update('hasEndTime', v)}
                trackColor={{ false: '#252525', true: '#FF6B3540' }}
                thumbColor={form.hasEndTime ? '#FF6B35' : '#424242'}
              />
            </View>

            {form.hasEndTime && (
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={{
                  backgroundColor: '#1E1E1E', borderRadius: 14,
                  paddingHorizontal: 16, height: 48,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderWidth: 1, borderColor: '#2E2E2E',
                }}
              >
                <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
                  {form.endsAt ? format(form.endsAt, "h:mm a") : 'Pick end time'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#606060" />
              </TouchableOpacity>
            )}
          </Section>

          {/* Max attendees */}
          <Section label="Capacity">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 14 }}>Limit spots</Text>
              <Switch
                value={form.hasMaxAttendees}
                onValueChange={(v) => update('hasMaxAttendees', v)}
                trackColor={{ false: '#252525', true: '#FF6B3540' }}
                thumbColor={form.hasMaxAttendees ? '#FF6B35' : '#424242'}
              />
            </View>
            {form.hasMaxAttendees && (
              <View style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 52,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                borderWidth: 1, borderColor: '#2E2E2E',
              }}>
                <Ionicons name="people-outline" size={18} color="#A0A0A0" />
                <TextInput
                  value={form.maxAttendees}
                  onChangeText={(t) => update('maxAttendees', t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={{ flex: 1, color: '#FAFAFA', fontSize: 18, fontWeight: '700' }}
                />
                <Text style={{ color: '#606060', fontSize: 14 }}>max people</Text>
              </View>
            )}
          </Section>

          {/* Description */}
          <Section label="More details (optional)">
            <TextInput
              value={form.description}
              onChangeText={(t) => update('description', t)}
              placeholder="What's the vibe? Who should come? What to bring..."
              placeholderTextColor="#424242"
              multiline
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                padding: 16, color: '#FAFAFA', fontSize: 15,
                borderWidth: 1, borderColor: '#2E2E2E',
                minHeight: 100, textAlignVertical: 'top',
              }}
              maxLength={500}
            />
          </Section>
        </ScrollView>

        <DateTimePickerModal
          isVisible={showStartPicker}
          mode="datetime"
          date={form.startsAt}
          minimumDate={new Date()}
          onConfirm={(date) => { update('startsAt', date); setShowStartPicker(false); }}
          onCancel={() => setShowStartPicker(false)}
          isDarkModeEnabled
          themeVariant="dark"
        />
        <DateTimePickerModal
          isVisible={showEndPicker}
          mode="time"
          date={form.endsAt ?? form.startsAt}
          onConfirm={(date) => { update('endsAt', date); setShowEndPicker(false); }}
          onCancel={() => setShowEndPicker(false)}
          isDarkModeEnabled
          themeVariant="dark"
        />
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

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!profile) return;
    setIsSaving(true);

    let avatarUrl = profile.avatar_url;

    if (avatarUri) {
      try {
        avatarUrl = await uploadImage('avatars', `avatars/${profile.id}`, avatarUri);
      } catch (err) {
        console.warn('avatar upload failed', err);
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio: bio.trim(), avatar_url: avatarUrl })
      .eq('id', profile.id)
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save. Try again.');
      return;
    }

    setProfile(data as any);
    router.back();
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={{ color: '#FAFAFA', fontSize: 17, fontWeight: '700' }}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            backgroundColor: '#FF6B35', paddingHorizontal: 16,
            paddingVertical: 7, borderRadius: 16,
          }}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={pickAvatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : (
              <Avatar
                uri={profile.avatar_url}
                name={profile.display_name || profile.username}
                size={90}
              />
            )}
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              backgroundColor: '#FF6B35', width: 28, height: 28,
              borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#0A0A0A',
            }}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={{ color: '#606060', fontSize: 13 }}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <View style={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
              DISPLAY NAME
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#424242"
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                paddingHorizontal: 16, height: 52, color: '#FAFAFA', fontSize: 16,
                borderWidth: 1, borderColor: '#2E2E2E',
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
              USERNAME
            </Text>
            <View style={{
              backgroundColor: '#141414', borderRadius: 14,
              paddingHorizontal: 16, height: 52,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              borderWidth: 1, borderColor: '#1E1E1E',
            }}>
              <Text style={{ color: '#424242', fontSize: 16 }}>@</Text>
              <Text style={{ color: '#424242', fontSize: 16 }}>{profile.username}</Text>
              <Text style={{ color: '#2E2E2E', fontSize: 12, marginLeft: 'auto' }}>
                Can't change
              </Text>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
              BIO
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="What's your vibe?"
              placeholderTextColor="#424242"
              multiline
              maxLength={150}
              style={{
                backgroundColor: '#1E1E1E', borderRadius: 14,
                padding: 16, color: '#FAFAFA', fontSize: 15,
                borderWidth: 1, borderColor: '#2E2E2E',
                minHeight: 90, textAlignVertical: 'top',
              }}
            />
            <Text style={{ color: '#424242', fontSize: 12, textAlign: 'right' }}>
              {bio.length}/150
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

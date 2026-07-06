import React, { useState } from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, View,
  Modal, TextInput, FlatList, Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRSVP } from '@/hooks/useRSVP';
import { useMyRsvpStatus } from '@/hooks/useMove';
import { useSearchUsers, type SearchUser } from '@/hooks/useSearchUsers';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RSVPButtonProps {
  moveId: string;
  isFull: boolean;
  compact?: boolean;
  knownStatus?: string | null;
}

export function RSVPButton({ moveId, isFull, compact = false, knownStatus }: RSVPButtonProps) {
  const hasKnown = knownStatus !== undefined;
  const { data: fetchedStatus } = useMyRsvpStatus(hasKnown ? '' : moveId);
  const rsvpStatus = hasKnown ? knownStatus : fetchedStatus;
  const { joinMutation, leaveMutation } = useRSVP(moveId);
  const scale = useSharedValue(1);

  const [showSquadPicker, setShowSquadPicker] = useState(false);
  const [squad, setSquad] = useState<SearchUser[]>([]);

  const isGoing = rsvpStatus === 'going';
  const isLoading = joinMutation.isPending || leaveMutation.isPending;

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function bounce() {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1.05, { damping: 10 }),
      withSpring(1,    { damping: 15 })
    );
  }

  function handlePress() {
    bounce();
    if (isGoing) {
      leaveMutation.mutate();
      setSquad([]);
    } else {
      setShowSquadPicker(true);
    }
  }

  function joinSolo() {
    setShowSquadPicker(false);
    joinMutation.mutate([]);
  }

  function joinWithSquad() {
    setShowSquadPicker(false);
    joinMutation.mutate(squad.map((u) => u.id));
  }

  if (isFull && !isGoing) {
    return (
      <View style={{
        height: compact ? 36 : 48, paddingHorizontal: compact ? 16 : 20,
        borderRadius: compact ? 18 : 24, backgroundColor: '#252525',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
      }}>
        <Ionicons name="lock-closed" size={14} color="#606060" />
        <Text style={{ color: '#606060', fontWeight: '600', fontSize: compact ? 13 : 15 }}>
          Move is full
        </Text>
      </View>
    );
  }

  return (
    <>
      <AnimatedTouchable
        style={[animStyle, {
          height: compact ? 36 : 48, paddingHorizontal: compact ? 16 : 20,
          borderRadius: compact ? 18 : 24,
          backgroundColor: isGoing ? '#22C55E20' : '#FF6B35',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: 6,
          borderWidth: isGoing ? 1.5 : 0, borderColor: isGoing ? '#22C55E' : 'transparent',
          opacity: isLoading ? 0.7 : 1,
        }]}
        onPress={handlePress}
        activeOpacity={1}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isGoing ? '#22C55E' : '#fff'} />
        ) : (
          <>
            <Ionicons
              name={isGoing ? 'checkmark-circle' : squad.length > 0 ? 'people' : 'add-circle-outline'}
              size={compact ? 16 : 20}
              color={isGoing ? '#22C55E' : '#fff'}
            />
            <Text style={{ color: isGoing ? '#22C55E' : '#fff', fontWeight: '700', fontSize: compact ? 13 : 15 }}>
              {isGoing
                ? "You're in"
                : squad.length > 0
                  ? `Squad of ${squad.length + 1}`
                  : 'Join Move'}
            </Text>
          </>
        )}
      </AnimatedTouchable>

      <SquadPickerModal
        visible={showSquadPicker}
        squad={squad}
        onToggleMember={(u) => {
          setSquad((prev) => {
            const already = prev.find((p) => p.id === u.id);
            if (already) return prev.filter((p) => p.id !== u.id);
            if (prev.length >= 2) return prev; // max 3 total (you + 2)
            return [...prev, u];
          });
        }}
        onSolo={joinSolo}
        onConfirm={joinWithSquad}
        onClose={() => setShowSquadPicker(false)}
      />
    </>
  );
}

// ---- Squad Picker Modal ----

interface SquadPickerProps {
  visible: boolean;
  squad: SearchUser[];
  onToggleMember: (u: SearchUser) => void;
  onSolo: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

function SquadPickerModal({ visible, squad, onToggleMember, onSolo, onConfirm, onClose }: SquadPickerProps) {
  const [query, setQuery] = useState('');
  const { data: results = [] } = useSearchUsers(query);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{ backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>Who's rolling with you?</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#606060" />
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#606060', fontSize: 13 }}>
            Add up to 2 crew members. They still need to join on their end.
          </Text>

          {/* Selected squad chips */}
          {squad.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {squad.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => onToggleMember(u)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: '#FF6B3520', borderRadius: 20,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderWidth: 1, borderColor: '#FF6B3550',
                  }}
                >
                  <Text style={{ color: '#FF6B35', fontWeight: '600', fontSize: 13 }}>@{u.username}</Text>
                  <Ionicons name="close-circle" size={15} color="#FF6B35" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search input */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: '#1E1E1E', borderRadius: 14, paddingHorizontal: 14, height: 48,
          }}>
            <Ionicons name="search" size={18} color="#606060" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by @username"
              placeholderTextColor="#424242"
              style={{ flex: 1, color: '#FAFAFA', fontSize: 15 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Results list */}
          <FlatList
            data={results}
            keyExtractor={(u) => u.id}
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: u }) => {
              const selected = squad.some((s) => s.id === u.id);
              const disabled = !selected && squad.length >= 2;
              return (
                <TouchableOpacity
                  onPress={() => !disabled && onToggleMember(u)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 10, opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: '#2E2E2E', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: '#A0A0A0', fontSize: 14, fontWeight: '700' }}>
                        {(u.display_name || u.username)[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FAFAFA', fontWeight: '600', fontSize: 14 }}>
                      {u.display_name || u.username}
                    </Text>
                    <Text style={{ color: '#606060', fontSize: 12 }}>@{u.username}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
                </TouchableOpacity>
              );
            }}
          />

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={onSolo}
              style={{
                flex: 1, height: 50, borderRadius: 25, borderWidth: 1.5,
                borderColor: '#2E2E2E', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#A0A0A0', fontWeight: '700', fontSize: 15 }}>Solo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 2, height: 50, borderRadius: 25,
                backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
              }}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                {squad.length > 0 ? `Roll as ${squad.length + 1}` : "I'm going"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

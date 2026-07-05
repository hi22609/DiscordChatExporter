import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRSVP } from '@/hooks/useRSVP';
import { useMyRsvpStatus } from '@/hooks/useMove';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RSVPButtonProps {
  moveId: string;
  isFull: boolean;
  compact?: boolean;
  /**
   * RSVP status already known by the parent (e.g. from nearby_moves).
   * When provided, the per-button status query is skipped entirely —
   * feed lists render with zero extra round-trips.
   */
  knownStatus?: string | null;
}

export function RSVPButton({ moveId, isFull, compact = false, knownStatus }: RSVPButtonProps) {
  const hasKnown = knownStatus !== undefined;
  const { data: fetchedStatus } = useMyRsvpStatus(hasKnown ? '' : moveId);
  const rsvpStatus = hasKnown ? knownStatus : fetchedStatus;
  const { joinMutation, leaveMutation } = useRSVP(moveId);
  const scale = useSharedValue(1);

  const isGoing = rsvpStatus === 'going';
  const isLoading = joinMutation.isPending || leaveMutation.isPending;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1.05, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    if (isGoing) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  }

  if (isFull && !isGoing) {
    return (
      <View
        style={{
          height: compact ? 36 : 48,
          paddingHorizontal: compact ? 16 : 20,
          borderRadius: compact ? 18 : 24,
          backgroundColor: '#252525',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        }}
      >
        <Ionicons name="lock-closed" size={14} color="#606060" />
        <Text style={{ color: '#606060', fontWeight: '600', fontSize: compact ? 13 : 15 }}>
          Move is full
        </Text>
      </View>
    );
  }

  return (
    <AnimatedTouchable
      style={[animStyle, {
        height: compact ? 36 : 48,
        paddingHorizontal: compact ? 16 : 20,
        borderRadius: compact ? 18 : 24,
        backgroundColor: isGoing ? '#22C55E20' : '#FF6B35',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: isGoing ? 1.5 : 0,
        borderColor: isGoing ? '#22C55E' : 'transparent',
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
            name={isGoing ? 'checkmark-circle' : 'add-circle-outline'}
            size={compact ? 16 : 20}
            color={isGoing ? '#22C55E' : '#fff'}
          />
          <Text style={{
            color: isGoing ? '#22C55E' : '#fff',
            fontWeight: '700',
            fontSize: compact ? 13 : 15,
          }}>
            {isGoing ? "You're in" : "Join Move"}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

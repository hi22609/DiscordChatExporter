import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRSVP } from '@/hooks/useRSVP';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useMyRsvpStatus } from '@/hooks/useMove';

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
  const { position, joinMutation: joinWaitlist, leaveMutation: leaveWaitlist } = useWaitlist(moveId);

  const scale = useSharedValue(1);

  const isGoing      = rsvpStatus === 'going';
  const onWaitlist   = rsvpStatus === 'waitlist';
  const isLoading    = joinMutation.isPending || leaveMutation.isPending
                    || joinWaitlist.isPending || leaveWaitlist.isPending;

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function bounce() {
    scale.value = withSequence(
      withSpring(0.91, { damping: 10 }),
      withSpring(1.06, { damping: 10 }),
      withSpring(1,    { damping: 15 }),
    );
  }

  function handlePress() {
    bounce();
    if (isGoing) {
      leaveMutation.mutate();
    } else if (onWaitlist) {
      leaveWaitlist.mutate();
    } else if (isFull) {
      joinWaitlist.mutate();
    } else {
      joinMutation.mutate();
    }
  }

  // ── States ────────────────────────────────────────────────────────────────
  let bg: string;
  let borderColor: string;
  let textColor: string;
  let label: string;
  let iconName: 'checkmark-circle' | 'time-outline' | 'add-circle-outline';

  if (isGoing) {
    bg = '#22C55E20'; borderColor = '#22C55E'; textColor = '#22C55E';
    label = "You're in"; iconName = 'checkmark-circle';
  } else if (onWaitlist) {
    bg = '#F59E0B20'; borderColor = '#F59E0B'; textColor = '#F59E0B';
    label = position ? `Waitlist #${position}` : 'On waitlist'; iconName = 'time-outline';
  } else if (isFull) {
    bg = '#EF444420'; borderColor = '#EF4444'; textColor = '#EF4444';
    label = 'Join waitlist'; iconName = 'time-outline';
  } else {
    bg = '#FF6B35'; borderColor = 'transparent'; textColor = '#fff';
    label = 'Join Move'; iconName = 'add-circle-outline';
  }

  return (
    <AnimatedTouchable
      style={[animStyle, {
        height: compact ? 36 : 48, paddingHorizontal: compact ? 14 : 20,
        borderRadius: compact ? 18 : 24,
        backgroundColor: bg,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 6,
        borderWidth: 1.5, borderColor,
        opacity: isLoading ? 0.7 : 1,
      }]}
      onPress={handlePress}
      activeOpacity={1}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          <Ionicons name={iconName} size={compact ? 15 : 19} color={textColor} />
          <Text style={{ color: textColor, fontWeight: '700', fontSize: compact ? 12 : 15 }}>
            {label}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

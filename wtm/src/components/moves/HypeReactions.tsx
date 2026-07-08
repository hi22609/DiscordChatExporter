import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring,
} from 'react-native-reanimated';
import { useReactions } from '@/hooks/useReactions';
import type { ReactionEmoji } from '@/types/app';

const AnimatedTouch = Animated.createAnimatedComponent(TouchableOpacity);

function ReactionPill({
  emoji, total, active, onPress,
}: { emoji: ReactionEmoji; total: number; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.85, { damping: 10 }),
      withSpring(1.15, { damping: 10 }),
      withSpring(1,    { damping: 15 }),
    );
    onPress();
  }

  return (
    <AnimatedTouch
      onPress={handlePress}
      activeOpacity={1}
      style={[style, {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 13, paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? 'rgba(255,107,53,0.15)' : '#1E1E1E',
        borderWidth: 1,
        borderColor: active ? 'rgba(255,107,53,0.5)' : '#2A2A2A',
      }]}
    >
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
      {total > 0 && (
        <Text style={{
          color: active ? '#FF6B35' : '#606060',
          fontSize: 13, fontWeight: '700',
        }}>
          {total}
        </Text>
      )}
    </AnimatedTouch>
  );
}

interface HypeReactionsProps {
  moveId: string;
}

export function HypeReactions({ moveId }: HypeReactionsProps) {
  const { reactions, toggle } = useReactions(moveId);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {reactions.map((r) => (
        <ReactionPill
          key={r.emoji}
          emoji={r.emoji as ReactionEmoji}
          total={r.total}
          active={r.i_reacted}
          onPress={() => toggle(r.emoji as ReactionEmoji)}
        />
      ))}
    </View>
  );
}

import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#252525', '#383838']
    ),
  }));

  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius }, animStyle, style]}
    />
  );
}

export function MoveCardSkeleton() {
  return (
    <View className="bg-surface-50 rounded-3xl overflow-hidden mb-4" style={{ height: 240 }}>
      <Skeleton width="100%" height={140} borderRadius={0} />
      <View className="p-4 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
        <View className="flex-row gap-2 mt-1">
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

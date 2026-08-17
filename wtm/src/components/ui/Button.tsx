import React from 'react';
import { TouchableOpacity, ActivityIndicator, Text, type TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand active:bg-brand-600',
  secondary: 'bg-surface-100 border border-surface-300 active:bg-surface-200',
  ghost: 'bg-transparent active:bg-surface-50',
  danger: 'bg-danger active:opacity-80',
};

const textStyles: Record<Variant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-ink font-medium',
  ghost: 'text-ink-muted font-medium',
  danger: 'text-white font-semibold',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-4 rounded-xl',
  md: 'h-12 px-5 rounded-2xl',
  lg: 'h-14 px-6 rounded-2xl',
};

const textSizes: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isDisabled = disabled || isLoading;

  return (
    <AnimatedTouchable
      style={animStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      className={[
        'flex-row items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-40' : '',
      ].join(' ')}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#FF6B35'} />
      ) : (
        <>
          {icon}
          <Text className={`${textStyles[variant]} ${textSizes[size]}`}>{label}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

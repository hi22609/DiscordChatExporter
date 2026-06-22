import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'subtle' | 'now';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  brand: { bg: '#FF6B3520', text: '#FF6B35' },
  success: { bg: '#22C55E20', text: '#22C55E' },
  warning: { bg: '#EAB30820', text: '#EAB308' },
  danger: { bg: '#EF444420', text: '#EF4444' },
  subtle: { bg: '#FFFFFF12', text: '#A0A0A0' },
  now: { bg: '#FF6B35', text: '#FFFFFF' },
};

export function Badge({ label, variant = 'subtle', size = 'sm' }: BadgeProps) {
  const styles = variantStyles[variant];
  const padding = size === 'sm' ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 10, paddingVertical: 5 };
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={{ borderRadius: 100, backgroundColor: styles.bg, ...padding, alignSelf: 'flex-start' }}>
      <Text style={{ color: styles.text, fontSize, fontWeight: '600', letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}

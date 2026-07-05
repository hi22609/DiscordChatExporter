import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  border?: boolean;
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name?: string | null): string {
  const colors = [
    '#FF6B35', '#7C3AED', '#059669', '#DC2626', '#0EA5E9', '#F59E0B', '#EC4899',
  ];
  if (!name) return colors[0];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export function Avatar({ uri, name, size = 40, border = false }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: border ? 2 : 0,
        borderColor: '#141414',
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text
          style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: size * 0.38,
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

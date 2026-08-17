import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import type { MoveAttendee } from '@/types/app';

interface AttendeePileProps {
  attendees: MoveAttendee[];
  totalCount: number;
  size?: number;
}

export function AttendeePile({ attendees, totalCount, size = 28 }: AttendeePileProps) {
  const display = attendees.slice(0, 3);
  const overflow = totalCount - display.length;

  if (totalCount === 0) {
    return (
      <Text style={{ color: '#606060', fontSize: 12 }}>Be the first to join</Text>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {display.map((a, i) => (
          <View
            key={a.user_id}
            style={{
              marginLeft: i === 0 ? 0 : -(size * 0.35),
              zIndex: display.length - i,
            }}
          >
            <Avatar
              uri={a.avatar_url}
              name={a.display_name || a.username}
              size={size}
              border
            />
          </View>
        ))}
        {overflow > 0 && (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#2E2E2E',
              borderWidth: 2,
              borderColor: '#141414',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -(size * 0.35),
              zIndex: 0,
            }}
          >
            <Text style={{ color: '#A0A0A0', fontSize: size * 0.32, fontWeight: '700' }}>
              +{overflow}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: '#A0A0A0', fontSize: 12, fontWeight: '500' }}>
        {totalCount === 1 ? '1 going' : `${totalCount} going`}
      </Text>
    </View>
  );
}

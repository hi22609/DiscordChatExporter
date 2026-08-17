import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORY_META, type MoveCategory } from '@/types/app';

interface CategoryPickerProps {
  value: MoveCategory | null;
  onChange: (category: MoveCategory) => void;
}

const CATEGORIES = Object.entries(CATEGORY_META) as Array<[MoveCategory, typeof CATEGORY_META[MoveCategory]]>;

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {CATEGORIES.map(([key, meta]) => {
        const isSelected = value === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={{ width: '30%' }}
          >
            <View style={{
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: isSelected ? '#FF6B35' : 'transparent',
            }}>
              <LinearGradient
                colors={isSelected ? meta.gradient : ['#1E1E1E', '#252525']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12, alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                <Text style={{
                  color: isSelected ? '#fff' : '#A0A0A0',
                  fontSize: 11,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  {meta.label}
                </Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

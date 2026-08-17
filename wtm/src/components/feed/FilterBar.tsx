import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useFilterStore } from '@/store/filterStore';
import { CATEGORY_META, RADIUS_OPTIONS, type MoveCategory } from '@/types/app';

const categories: Array<{ value: MoveCategory | null; label: string; emoji: string }> = [
  { value: null, label: 'All', emoji: '🔥' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
    value: key as MoveCategory,
    label: meta.label.split(' ')[0],
    emoji: meta.emoji,
  })),
];

export function FilterBar() {
  const { category, setCategory, radiusMeters, setRadius } = useFilterStore();

  return (
    <View style={{ gap: 0 }}>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
      >
        {categories.map((cat) => {
          const isActive = category === cat.value;
          return (
            <TouchableOpacity
              key={cat.value ?? 'all'}
              onPress={() => setCategory(cat.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: isActive ? '#FF6B35' : '#252525',
                borderWidth: isActive ? 0 : 1,
                borderColor: '#383838',
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
              <Text style={{
                color: isActive ? '#fff' : '#A0A0A0',
                fontWeight: isActive ? '700' : '500',
                fontSize: 13,
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Radius pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingBottom: 4 }}
      >
        {RADIUS_OPTIONS.map((opt) => {
          const isActive = radiusMeters === opt.meters;
          return (
            <TouchableOpacity
              key={opt.meters}
              onPress={() => setRadius(opt.meters)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: isActive ? '#FF6B3520' : 'transparent',
                borderWidth: 1,
                borderColor: isActive ? '#FF6B35' : '#383838',
              }}
            >
              <Text style={{
                color: isActive ? '#FF6B35' : '#606060',
                fontWeight: isActive ? '700' : '400',
                fontSize: 12,
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

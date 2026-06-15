import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export function CountdownUnit({ value, label }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.num}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unit: {
    flex: 1,
    backgroundColor: '#16161f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  num: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.orange,
    letterSpacing: -1,
  },
  label: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
});

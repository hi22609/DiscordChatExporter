import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export function SectionLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
});

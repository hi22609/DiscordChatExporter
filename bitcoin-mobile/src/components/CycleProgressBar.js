import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

const PHASE_LABELS = ['Accum', 'Re-Awaken', 'Momentum', 'Parabolic', 'Blow-Off'];

export function CycleProgressBar({ pct }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%` }]}>
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.labels}>
        {PHASE_LABELS.map(l => (
          <Text key={l} style={styles.label}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { marginVertical: 8 },
  track: { height: 8, backgroundColor: COLORS.card2, borderRadius: 99, overflow: 'visible' },
  fill:  {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 99,
    position: 'relative',
    overflow: 'visible',
  },
  dot: {
    position: 'absolute',
    right: -7, top: -3,
    width: 14, height: 14,
    backgroundColor: COLORS.yellow,
    borderRadius: 7,
    shadowColor: COLORS.yellow,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label:  { fontSize: 8, color: COLORS.muted, textAlign: 'center' },
});

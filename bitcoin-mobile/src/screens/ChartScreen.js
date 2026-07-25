import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCycleDay, PROJECTION_TIMELINE, getProjectedPrice } from '../utils/cycle';
import { ProjectionChart } from '../components/ProjectionChart';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { COLORS } from '../utils/theme';

const MILESTONES = [
  { label: 'Last Cycle Bottom', date: 'Nov 2022',      price: '$15,500',  color: COLORS.text },
  { label: '🎯 Cycle ATH (top)', date: 'Oct 6, 2025',   price: '$150,000', color: COLORS.green },
  { label: 'Capitulation',      date: 'Mar 2026',       price: '$80,000',  color: COLORS.red },
  { label: 'Despair Phase',     date: 'Jun 2026',       price: '$62,000',  color: COLORS.red },
  { label: '🟢 NEXT BOTTOM',    date: 'Oct 5, 2026',    price: '$55,000',  color: COLORS.purple },
  { label: 'Next Cycle ATH',    date: '~Sep 10, 2029',  price: '$400,000', color: COLORS.green },
];

const BEAR_DRAWDOWNS = [
  { label: '1 month after ATH',  pct: '-25%' },
  { label: '3 months after ATH', pct: '-55%' },
  { label: '6 months after ATH', pct: '-72%' },
  { label: '9 months after ATH', pct: '-77%' },
  { label: '12 months (bottom)', pct: '-79%' },
];

export function ChartScreen() {
  const insets = useSafeAreaInsets();
  const day = getCycleDay();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Cycle Timeline</Text>

      <Card>
        <SectionLabel>Bear / Base / Bull — Bottom-Anchored 1070/364 Cycle</SectionLabel>
        <Text style={styles.chartCaption}>
          Bottom (Nov 2022) → top (Oct 2025) → next bottom (Oct 2026) → next top (~2029). Each line is a different guess for how high or low price goes. The dashed yellow line shows where we are right now.
        </Text>
        <ProjectionChart currentDay={day} />
      </Card>

      <Card>
        <SectionLabel>Key Milestones</SectionLabel>
        {MILESTONES.map((m, i) => (
          <View key={i} style={[styles.milestoneRow, i === MILESTONES.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.milestoneLeft}>
              <Text style={[styles.milestoneName, { color: m.color }]}>{m.label}</Text>
              <Text style={styles.milestoneDate}>{m.date}</Text>
            </View>
            <Text style={[styles.milestonePrice, { color: m.color }]}>{m.price}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>Typical Bear Market Drawdowns (from ATH)</SectionLabel>
        {BEAR_DRAWDOWNS.map((b, i) => (
          <View key={i} style={[styles.milestoneRow, i === BEAR_DRAWDOWNS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.milestoneName}>{b.label}</Text>
            <Text style={[styles.milestonePrice, { color: COLORS.red }]}>{b.pct}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>Day-by-Day Projection Table (Base Case)</SectionLabel>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHead]}>Date</Text>
          <Text style={[styles.tableCell, styles.tableHead]}>Day</Text>
          <Text style={[styles.tableCell, styles.tableHead]}>Base Price</Text>
        </View>
        {PROJECTION_TIMELINE.map((t, i) => {
          const price = getProjectedPrice(t.day, 'base');
          const isCurrent = i > 0
            ? day >= PROJECTION_TIMELINE[i - 1].day && day < t.day
            : day < t.day;
          return (
            <View key={i} style={[styles.tableRow, isCurrent && styles.tableRowActive]}>
              <Text style={[styles.tableCell, isCurrent && { color: COLORS.orange }]}>{t.label}</Text>
              <Text style={[styles.tableCell, isCurrent && { color: COLORS.orange }]}>{t.day}</Text>
              <Text style={[styles.tableCell, { fontWeight: '800', color: isCurrent ? COLORS.orange : COLORS.text }]}>
                ${price.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingHorizontal: 16, paddingBottom: 100 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, paddingVertical: 16 },

  milestoneRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  milestoneLeft: {},
  milestoneName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  milestoneDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  milestonePrice:{ fontSize: 15, fontWeight: '900' },
  chartCaption:  { fontSize: 12, color: COLORS.muted, lineHeight: 17, marginBottom: 10 },

  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 4 },
  tableHead:   { color: COLORS.muted, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  tableRow:    { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border + '66' },
  tableRowActive: { backgroundColor: COLORS.orangeDim, borderRadius: 6, paddingHorizontal: 4 },
  tableCell:   { flex: 1, fontSize: 12, color: COLORS.muted },
});

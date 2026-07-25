import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCycleDay, getPhase, getCycleScore, getNextEvent } from '../utils/cycle';
import { useCountdown } from '../hooks/useCountdown';
import { useStore } from '../utils/store';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { COLORS } from '../utils/theme';

const AUTOPILOT_RULES = [
  { icon: '📈', title: 'Cycle Score > 85', desc: 'Auto-arm sell ladder — extreme greed',   active: true  },
  { icon: '🎯', title: 'Pi Cycle Top',     desc: 'Exit all at market — historical signal',  active: true  },
  { icon: '🐋', title: 'Whale Dump Alert', desc: 'Pause DCA when large inflows detected',   active: false },
  { icon: '📉', title: 'Flash Crash -20%', desc: 'Halt sell orders — wait for confirmation',active: false },
];

export function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, toggleAlert } = useStore();
  const ev = getNextEvent();
  const cd = useCountdown(ev.date);
  const day = getCycleDay();
  const score = getCycleScore(day);
  const phase = getPhase(day);

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Alerts</Text>

      {/* Status Card */}
      <Card style={{ backgroundColor: '#0f1a0f' }}>
        <SectionLabel>Autopilot Status</SectionLabel>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Monitoring — {phase.name} Phase</Text>
        </View>
        <View style={styles.statusMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{score}</Text>
            <Text style={styles.metricLabel}>Cycle Score</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{cd.days}</Text>
            <Text style={styles.metricLabel}>Days to {ev.name}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricVal, { color: phase.color }]}>{phase.risk}</Text>
            <Text style={styles.metricLabel}>Risk Level</Text>
          </View>
        </View>
      </Card>

      {/* Alert Toggles */}
      <Card>
        <SectionLabel>Smart Alerts</SectionLabel>
        {alerts.map(alert => (
          <View key={alert.id} style={styles.alertRow}>
            <Text style={styles.alertIcon}>{alert.icon}</Text>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDesc}>{alert.desc}</Text>
            </View>
            <Switch
              value={alert.active}
              onValueChange={() => toggleAlert(alert.id)}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
              thumbColor={COLORS.text}
            />
          </View>
        ))}
      </Card>

      {/* Autopilot Rules */}
      <Card>
        <SectionLabel>Autopilot Rules (Read-only)</SectionLabel>
        {AUTOPILOT_RULES.map((r, i) => (
          <View key={i} style={[styles.ruleRow, i === AUTOPILOT_RULES.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.ruleIcon}>{r.icon}</Text>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleTitle}>{r.title}</Text>
              <Text style={styles.ruleDesc}>{r.desc}</Text>
            </View>
            <View style={[styles.ruleBadge, { backgroundColor: r.active ? COLORS.green + '22' : COLORS.card2 }]}>
              <Text style={[styles.ruleBadgeText, { color: r.active ? COLORS.green : COLORS.muted }]}>
                {r.active ? 'ARMED' : 'OFF'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Upcoming Triggers */}
      <Card>
        <SectionLabel>Upcoming Trigger Dates</SectionLabel>
        {[
          { label: 'Capitulation',              date: 'Mar 2026',                 color: COLORS.red },
          { label: 'Despair / Best DCA Window', date: 'Jun 2026',                 color: COLORS.muted },
          { label: 'Next Bottom / Buy Zone',    date: 'Oct 5, 2026',              color: COLORS.green },
          { label: 'New Cycle Begins',          date: 'Oct 5, 2026',              color: COLORS.purple },
          { label: 'Next Cycle ATH',            date: '~Sep 10, 2029',            color: COLORS.orange },
        ].map((t, i) => (
          <View key={i} style={[styles.triggerRow, i === 4 && { borderBottomWidth: 0 }]}>
            <Text style={styles.triggerLabel}>{t.label}</Text>
            <Text style={[styles.triggerDate, { color: t.color }]}>{t.date}</Text>
          </View>
        ))}
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingHorizontal: 16, paddingBottom: 100 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, paddingVertical: 16 },

  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  statusText:    { fontSize: 14, fontWeight: '700', color: COLORS.green },
  statusMetrics: { flexDirection: 'row', gap: 0 },
  metric:        { flex: 1, alignItems: 'center' },
  metricVal:     { fontSize: 22, fontWeight: '900', color: COLORS.text },
  metricLabel:   { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  alertRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  alertIcon: { fontSize: 24 },
  alertInfo: { flex: 1 },
  alertTitle:{ fontSize: 14, fontWeight: '700', color: COLORS.text },
  alertDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  ruleRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  ruleIcon:     { fontSize: 22 },
  ruleInfo:     { flex: 1 },
  ruleTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.text },
  ruleDesc:     { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  ruleBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ruleBadgeText:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  triggerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  triggerLabel: { fontSize: 13, color: COLORS.text, flex: 1 },
  triggerDate:  { fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

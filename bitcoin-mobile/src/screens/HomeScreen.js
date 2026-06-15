import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCycleDay, getPhase, getCycleScore, getArcProgress,
  formatPrice, ARC1_DAYS, ATH_DATE, BOTTOM_DATE,
} from '../utils/cycle';
import { useStore } from '../utils/store';
import { useLiveData } from '../hooks/useLiveData';
import { useCountdown } from '../hooks/useCountdown';
import { CountdownUnit } from '../components/CountdownUnit';
import { CycleProgressBar } from '../components/CycleProgressBar';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { ProjectionChart } from '../components/ProjectionChart';
import { COLORS } from '../utils/theme';

const SIGNALS = [
  { name: 'Fear & Greed', value: '72 / 100', badge: 'GREED',   badgeColor: COLORS.yellow },
  { name: 'MVRV Z-Score', value: '2.1',       badge: 'HOLD',    badgeColor: COLORS.yellow },
  { name: 'SOPR',         value: '1.04',      badge: 'HOLD',    badgeColor: COLORS.yellow },
  { name: 'Puell Multiple', value: '1.8',     badge: 'WATCH',   badgeColor: COLORS.purple },
  { name: 'Exchange Outflows', value: '+4,200 BTC', badge: 'BULLISH', badgeColor: COLORS.green },
  { name: 'Pi Cycle Top', value: 'Not Triggered', badge: 'SAFE', badgeColor: COLORS.green },
];

export function HomeScreen() {
  useLiveData();
  const insets = useSafeAreaInsets();
  const { btcPrice, btcChange, fearGreed } = useStore();
  const cd = useCountdown(ATH_DATE);

  const day = getCycleDay();
  const phase = getPhase(day);
  const score = getCycleScore(day);
  const arc = getArcProgress(day);
  const daysLeft = Math.max(0, ARC1_DAYS - day);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function scoreColor() {
    if (score < 40) return COLORS.green;
    if (score < 61) return COLORS.yellow;
    if (score < 81) return COLORS.orange;
    return COLORS.red;
  }

  function scoreAction() {
    if (score < 40) return { text: '🟢 BUY ZONE — Accumulate aggressively', bg: 'rgba(0,208,132,0.1)', color: COLORS.green };
    if (score < 61) return { text: '🟡 HOLD — Fair value territory',         bg: 'rgba(255,215,0,0.1)', color: COLORS.yellow };
    if (score < 81) return { text: '⚠ TAKE PROFITS — Start sell ladder',     bg: 'rgba(255,145,26,0.1)', color: COLORS.orange };
    return              { text: '🔴 EXIT ZONE — Cycle top imminent',          bg: 'rgba(255,69,96,0.1)', color: COLORS.red };
  }

  const sa = scoreAction();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LinearGradient colors={[COLORS.orange, '#ffb347']} style={styles.logoBox}>
            <Text style={styles.logoSymbol}>₿</Text>
          </LinearGradient>
          <View>
            <Text style={styles.appName}>Cycle Tracker</Text>
            <View style={styles.liveRow}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.livePrice}>
            {btcPrice ? '$' + btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
          </Text>
          {btcChange != null && (
            <Text style={[styles.priceChange, { color: btcChange >= 0 ? COLORS.green : COLORS.red }]}>
              {btcChange >= 0 ? '▲' : '▼'} {Math.abs(btcChange).toFixed(2)}%
            </Text>
          )}
        </View>
      </View>

      {/* Phase Banner */}
      <LinearGradient
        colors={[phase.color + '22', COLORS.card]}
        style={styles.phaseBanner}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View>
          <Text style={[styles.phaseTag, { color: phase.color }]}>ARC {arc.arc} · CURRENT PHASE</Text>
          <Text style={styles.phaseName}>{phase.emoji} {phase.name}</Text>
          <Text style={styles.phaseDesc}>{phase.desc}</Text>
        </View>
        <View style={styles.phaseDayBox}>
          <Text style={[styles.phaseDayNum, { color: phase.color }]}>{day}</Text>
          <Text style={styles.phaseDayLabel}>DAY</Text>
        </View>
      </LinearGradient>

      {/* Progress */}
      <Card>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Halving · Apr 19, 2024</Text>
          <Text style={styles.progressLabel}>ATH · Jan 24, 2027</Text>
        </View>
        <CycleProgressBar pct={arc.pct} />
        <View style={styles.progressFooter}>
          <Text style={styles.progressStat}>{arc.pct.toFixed(1)}% complete</Text>
          <Text style={styles.progressStat}>{daysLeft} days left</Text>
        </View>
      </Card>

      {/* Countdown */}
      <Card>
        <SectionLabel>⏱ Time to Projected ATH (Jan 24, 2027)</SectionLabel>
        <View style={styles.countdownRow}>
          <CountdownUnit value={cd.days}    label="Days" />
          <CountdownUnit value={cd.hours}   label="Hours" />
          <CountdownUnit value={cd.minutes} label="Mins" />
          <CountdownUnit value={cd.seconds} label="Secs" />
        </View>
      </Card>

      {/* Stats 2×2 */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Arc Progress',   value: arc.pct.toFixed(1) + '%', sub: 'of 1070 days', color: COLORS.orange },
          { label: 'Since Halving',  value: day + ' days',            sub: 'Arc 1 of 1070', color: COLORS.text },
          { label: 'Bear Bottom',    value: 'Jan 2028',               sub: '~$28K–$42K',    color: COLORS.red },
          { label: 'Next Halving',   value: 'Apr 2028',               sub: 'Cycle resets',  color: COLORS.purple },
        ].map(s => (
          <Card key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statSub}>{s.sub}</Text>
          </Card>
        ))}
      </View>

      {/* Cycle Score */}
      <Card>
        <View style={styles.scoreHeader}>
          <SectionLabel>Cycle Score</SectionLabel>
          <Text style={[styles.scoreNum, { color: scoreColor() }]}>{score} / 100</Text>
        </View>
        <View style={styles.scoreTrack}>
          <View style={[styles.scoreFill, { width: score + '%', backgroundColor: scoreColor() }]} />
        </View>
        <View style={styles.scoreTickRow}>
          <Text style={styles.scoreTick}>Buy Zone</Text>
          <Text style={styles.scoreTick}>Hold</Text>
          <Text style={styles.scoreTick}>Exit Zone</Text>
        </View>
        <View style={[styles.scoreAction, { backgroundColor: sa.bg }]}>
          <Text style={[styles.scoreActionText, { color: sa.color }]}>{sa.text}</Text>
        </View>
      </Card>

      {/* ATH Projections */}
      <Card>
        <SectionLabel>ATH Price Projections</SectionLabel>
        {[
          { label: 'Bear Case', sub: 'If cycle underperforms', price: '$140,000', color: COLORS.red },
          { label: 'Base Case', sub: 'Historical average',     price: '$200,000', color: COLORS.orange },
          { label: 'Bull Case', sub: 'Institutions go hard',   price: '$350,000', color: COLORS.green },
        ].map(r => (
          <View key={r.label} style={styles.projRow}>
            <View style={styles.projLeft}>
              <View style={[styles.projDot, { backgroundColor: r.color }]} />
              <View>
                <Text style={styles.projLabel}>{r.label}</Text>
                <Text style={styles.projSub}>{r.sub}</Text>
              </View>
            </View>
            <Text style={[styles.projPrice, { color: r.color }]}>{r.price}</Text>
          </View>
        ))}
      </Card>

      {/* Chart */}
      <Card>
        <SectionLabel>Price Projection Curve — 2024 Cycle</SectionLabel>
        <ProjectionChart currentDay={day} />
      </Card>

      {/* On-Chain Signals */}
      <Card>
        <SectionLabel>On-Chain Signals</SectionLabel>
        {SIGNALS.map(s => (
          <View key={s.name} style={styles.signalRow}>
            <Text style={styles.signalName}>{s.name}</Text>
            <View style={styles.signalRight}>
              <Text style={styles.signalVal}>{s.value}</Text>
              <View style={[styles.badge, { backgroundColor: s.badgeColor + '22' }]}>
                <Text style={[styles.badgeText, { color: s.badgeColor }]}>{s.badge}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoSymbol:{ fontSize: 22, fontWeight: '900', color: '#fff' },
  appName:   { fontSize: 17, fontWeight: '800', color: COLORS.text },
  liveRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText:  { fontSize: 10, color: COLORS.green, fontWeight: '700', letterSpacing: 0.8 },
  priceBox:  { alignItems: 'flex-end' },
  livePrice: { fontSize: 22, fontWeight: '900', color: COLORS.orange },
  priceChange:{ fontSize: 12, fontWeight: '600', marginTop: 2 },

  phaseBanner: { borderRadius: 16, padding: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phaseTag:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  phaseName:   { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  phaseDesc:   { fontSize: 12, color: COLORS.muted, marginTop: 3, maxWidth: 220 },
  phaseDayBox: { alignItems: 'center', marginLeft: 12 },
  phaseDayNum: { fontSize: 40, fontWeight: '900', lineHeight: 44 },
  phaseDayLabel:{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel:  { fontSize: 10, color: COLORS.muted },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressStat:   { fontSize: 11, color: COLORS.muted, fontWeight: '600' },

  countdownRow: { flexDirection: 'row', gap: 6 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 0 },
  statCard:  { width: '47%', margin: 0, marginBottom: 0, padding: 14 },
  statLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  statSub:   { fontSize: 11, color: COLORS.muted, marginTop: 2 },

  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreNum:    { fontSize: 26, fontWeight: '900' },
  scoreTrack:  { height: 10, backgroundColor: COLORS.card2, borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  scoreFill:   { height: '100%', borderRadius: 99 },
  scoreTickRow:{ flexDirection: 'row', justifyContent: 'space-between' },
  scoreTick:   { fontSize: 9, color: COLORS.muted },
  scoreAction: { marginTop: 12, borderRadius: 10, padding: 12 },
  scoreActionText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  projRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  projLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projDot:   { width: 8, height: 8, borderRadius: 4 },
  projLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  projSub:   { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  projPrice: { fontSize: 16, fontWeight: '900' },

  signalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  signalName: { fontSize: 13, color: COLORS.text },
  signalRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalVal:  { fontSize: 12, fontWeight: '700', color: COLORS.text },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCycleDay, getPhase, getCycleScore, getArcProgress,
  getNextEvent, currentCycleStart, ATH_TARGETS, CYCLE_LEN,
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

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
  const ev = getNextEvent();
  const cd = useCountdown(ev.date);

  const day = getCycleDay();
  const phase = getPhase(day);
  const score = getCycleScore(day);
  const arc = getArcProgress(day);
  const inAscent = arc.arc === 1;

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
          <Text style={[styles.phaseTag, { color: phase.color }]}>{inAscent ? 'ASCENT (1070d)' : 'DESCENT (364d)'} · CURRENT PHASE</Text>
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
          <Text style={styles.progressLabel}>Cycle Bottom · {fmtDate(currentCycleStart())}</Text>
          <Text style={styles.progressLabel}>{ev.name} · {fmtDate(ev.date)}</Text>
        </View>
        <CycleProgressBar pct={arc.pct} />
        <View style={styles.progressFooter}>
          <Text style={styles.progressStat}>{arc.pct.toFixed(1)}% complete</Text>
          <Text style={styles.progressStat}>{arc.remaining} days left</Text>
        </View>
      </Card>

      {/* Countdown */}
      <Card>
        <SectionLabel>⏱ Time to {ev.name} ({fmtDate(ev.date)})</SectionLabel>
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
          { label: 'Cycle Progress', value: arc.pct.toFixed(1) + '%', sub: inAscent ? 'of 1070-day ascent' : 'of 364-day descent', color: COLORS.orange },
          { label: 'Day in Cycle',   value: day + ' / ' + CYCLE_LEN,  sub: 'Bottom → bottom',  color: COLORS.text },
          { label: 'Next Bottom',    value: 'Oct 5, 2026',            sub: '~$40K–$75K',        color: COLORS.red },
          { label: 'Next Cycle ATH', value: 'Sep 2029',               sub: '~$250K–$700K',       color: COLORS.purple },
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

      {/* Next Cycle ATH Projections */}
      <Card>
        <SectionLabel>Next Cycle ATH Projections (~Sep 2029)</SectionLabel>
        {[
          { label: 'Bear Case', sub: 'Diminishing returns',         price: '$' + ATH_TARGETS.bear.toLocaleString(),  color: COLORS.red },
          { label: 'Base Case', sub: 'Cycle average',                price: '$' + ATH_TARGETS.base.toLocaleString(), color: COLORS.orange },
          { label: 'Bull Case', sub: 'Institutional supercycle',     price: '$' + ATH_TARGETS.bull.toLocaleString(), color: COLORS.green },
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
        <SectionLabel>Price Projection Curve — Bottom-Anchored Cycle</SectionLabel>
        <Text style={styles.chartCaption}>
          Three guesses for where BTC's price goes from here. <Text style={{ color: COLORS.green, fontWeight: '700' }}>Green = Bull</Text> (best case), <Text style={{ color: COLORS.orange, fontWeight: '700' }}>Orange = Base</Text> (most likely), <Text style={{ color: COLORS.red, fontWeight: '700' }}>Red = Bear</Text> (worst case). The dashed yellow line marks today.
        </Text>
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

  chartCaption: { fontSize: 12, color: COLORS.muted, lineHeight: 17, marginBottom: 10 },

  signalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  signalName: { fontSize: 13, color: COLORS.text },
  signalRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalVal:  { fontSize: 12, fontWeight: '700', color: COLORS.text },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

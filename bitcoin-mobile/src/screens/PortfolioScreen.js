import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCycleDay, getPhase, getCycleScore } from '../utils/cycle';
import { useStore } from '../utils/store';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { COLORS } from '../utils/theme';

const RISK_PROFILES = ['Conservative', 'Balanced', 'Aggressive'];
const DCA_GUIDANCE = {
  Accumulation:     { action: 'BUY AGGRESSIVELY',  desc: 'Best entry window. Full DCA.' },
  'Re-Awakening':   { action: 'BUY REGULARLY',     desc: 'Keep DCA, momentum building.' },
  'Momentum Build': { action: 'REDUCE DCA',        desc: 'Let existing positions run.' },
  'Parabolic Advance': { action: 'HOLD',           desc: 'Stop buying. Prepare to exit.' },
  'Blow-Off Top':   { action: 'EXECUTE SELL LADDER', desc: 'Do not wait for the exact top.' },
};

export function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { btcPrice, btcAmount, setBtcAmount, sellLadder, autopilot, setAutopilot, riskProfile, setRiskProfile } = useStore();

  const day = getCycleDay();
  const phase = getPhase(day);
  const score = getCycleScore(day);
  const dca = DCA_GUIDANCE[phase.name] || { action: 'HOLD', desc: 'Monitor cycle.' };

  const portValue = btcPrice ? btcPrice * btcAmount : 0;
  const bearValue = 140000 * btcAmount;
  const baseValue = 200000 * btcAmount;
  const bullValue = 350000 * btcAmount;
  const bottomValue = 42000 * btcAmount;

  function formatUSD(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Portfolio</Text>

      {/* Portfolio Hero */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.hero}>
        <Text style={styles.heroLabel}>CURRENT VALUE</Text>
        <Text style={styles.heroValue}>
          {btcPrice ? formatUSD(portValue) : '—'}
        </Text>
        <View style={styles.btcRow}>
          <Text style={styles.btcLabel}>Your BTC</Text>
          <TextInput
            style={styles.btcInput}
            value={String(btcAmount)}
            keyboardType="decimal-pad"
            onChangeText={t => setBtcAmount(parseFloat(t) || 0)}
            placeholderTextColor={COLORS.muted}
            selectTextOnFocus
          />
        </View>
      </LinearGradient>

      {/* Projections */}
      <Card>
        <SectionLabel>If You Hold to Projected ATH (Jan 2027)</SectionLabel>
        {[
          { label: 'Bear Case ($140K)', value: bearValue, color: COLORS.red },
          { label: 'Base Case ($200K)', value: baseValue, color: COLORS.orange },
          { label: 'Bull Case ($350K)', value: bullValue, color: COLORS.green },
        ].map(r => (
          <View key={r.label} style={styles.projRow}>
            <Text style={styles.projLabel}>{r.label}</Text>
            <Text style={[styles.projValue, { color: r.color }]}>{formatUSD(r.value)}</Text>
          </View>
        ))}
        <View style={[styles.projRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 }]}>
          <Text style={styles.projLabel}>Bear Bottom ($42K) in 2028</Text>
          <Text style={[styles.projValue, { color: COLORS.muted }]}>{formatUSD(bottomValue)}</Text>
        </View>
      </Card>

      {/* DCA Recommendation */}
      <Card>
        <SectionLabel>DCA Recommendation — {phase.name}</SectionLabel>
        <View style={[styles.dcaActionBox, { backgroundColor: phase.color + '18' }]}>
          <Text style={[styles.dcaAction, { color: phase.color }]}>{dca.action}</Text>
          <Text style={styles.dcaDesc}>{dca.desc}</Text>
        </View>
        <View style={styles.projRow}>
          <Text style={styles.projLabel}>Current Phase</Text>
          <Text style={[styles.projValue, { color: phase.color }]}>{phase.name}</Text>
        </View>
        <View style={styles.projRow}>
          <Text style={styles.projLabel}>Cycle Score</Text>
          <Text style={[styles.projValue, { color: score > 70 ? COLORS.red : COLORS.green }]}>{score} / 100</Text>
        </View>
        <View style={[styles.projRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.projLabel}>Risk Level</Text>
          <Text style={[styles.projValue, { color: phase.riskColor }]}>{phase.risk}</Text>
        </View>
      </Card>

      {/* Sell Ladder */}
      <Card>
        <View style={styles.ladderHeader}>
          <SectionLabel>Sell Ladder</SectionLabel>
          <View style={styles.autopilotRow}>
            <Text style={styles.autopilotLabel}>Autopilot</Text>
            <Switch
              value={autopilot}
              onValueChange={setAutopilot}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
              thumbColor={COLORS.text}
            />
          </View>
        </View>
        {sellLadder.map((rung, i) => (
          <View key={i} style={styles.rungRow}>
            <View style={styles.rungLeft}>
              <View style={[styles.rungDot, { backgroundColor: rung.triggered ? COLORS.green : COLORS.border }]} />
              <View>
                <Text style={styles.rungLabel}>Sell {rung.pct}% of holdings</Text>
                <Text style={styles.rungSub}>at ${rung.price.toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.rungBadge, { backgroundColor: rung.triggered ? COLORS.green + '22' : COLORS.card2 }]}>
              <Text style={[styles.rungBadgeText, { color: rung.triggered ? COLORS.green : COLORS.muted }]}>
                {rung.triggered ? 'DONE' : 'PENDING'}
              </Text>
            </View>
          </View>
        ))}
        <Text style={styles.ladderNote}>
          Auto-executes via connected exchange when Autopilot is ON
        </Text>
      </Card>

      {/* Risk Profile */}
      <Card>
        <SectionLabel>Risk Profile</SectionLabel>
        <View style={styles.riskRow}>
          {RISK_PROFILES.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.riskBtn, riskProfile === p.toLowerCase() && styles.riskBtnActive]}
              onPress={() => setRiskProfile(p.toLowerCase())}
            >
              <Text style={[styles.riskBtnText, riskProfile === p.toLowerCase() && { color: COLORS.orange }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.riskDesc}>
          {riskProfile === 'conservative' && 'Sell 25% per $50K above $150K. Stop-loss at -20%.'}
          {riskProfile === 'balanced'     && 'Ladder out at $150K, $200K, $275K, $340K (25% each).'}
          {riskProfile === 'aggressive'   && 'Hold to $300K+, single exit near cycle score >90.'}
        </Text>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingHorizontal: 16, paddingBottom: 100 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, paddingVertical: 16 },

  hero:       { borderRadius: 16, padding: 24, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  heroLabel:  { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  heroValue:  { fontSize: 42, fontWeight: '900', color: COLORS.text, marginVertical: 6 },
  btcRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  btcLabel:   { fontSize: 13, color: COLORS.muted },
  btcInput:   {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, padding: 10, borderRadius: 10,
    fontSize: 18, fontWeight: '800', width: 130, textAlign: 'center',
  },

  projRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  projLabel: { fontSize: 13, color: COLORS.text },
  projValue: { fontSize: 14, fontWeight: '800' },

  dcaActionBox: { borderRadius: 12, padding: 14, marginBottom: 12 },
  dcaAction:    { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  dcaDesc:      { fontSize: 13, color: COLORS.muted },

  ladderHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autopilotRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  autopilotLabel:{ fontSize: 13, color: COLORS.text, fontWeight: '600' },

  rungRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rungLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rungDot:   { width: 10, height: 10, borderRadius: 5 },
  rungLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  rungSub:   { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  rungBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rungBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ladderNote:{ fontSize: 11, color: COLORS.muted, marginTop: 10, textAlign: 'center' },

  riskRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  riskBtn:    { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.card2, alignItems: 'center' },
  riskBtnActive: { borderWidth: 1, borderColor: COLORS.orange },
  riskBtnText:{ fontSize: 12, fontWeight: '700', color: COLORS.muted },
  riskDesc:   { fontSize: 12, color: COLORS.muted, lineHeight: 18 },
});

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { PROJECTION_TIMELINE, getProjectedPrice, ATH_TARGETS, formatPrice } from '../utils/cycle';
import { COLORS } from '../utils/theme';

const W = Dimensions.get('window').width - 64;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 30, left: 48 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

function toPoints(values, min, max) {
  return values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1)) * CW,
    y: PAD.top + (1 - (v - min) / (max - min)) * CH,
  }));
}

function pointsToPath(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
    const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
    d += ` C${cp1x},${pts[i - 1].y} ${cp2x},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

export function ProjectionChart({ currentDay }) {
  const days  = PROJECTION_TIMELINE.map(t => t.day);
  const bear  = days.map(d => getProjectedPrice(d, 'bear'));
  const base  = days.map(d => getProjectedPrice(d, 'base'));
  const bull  = days.map(d => getProjectedPrice(d, 'bull'));

  const allVals = [...bear, ...base, ...bull];
  const minV = Math.min(...allVals) * 0.85;
  const maxV = Math.max(...allVals) * 1.05;

  const bearPts = toPoints(bear, minV, maxV);
  const basePts = toPoints(base, minV, maxV);
  const bullPts = toPoints(bull, minV, maxV);

  // Current day marker
  const cdIdx = PROJECTION_TIMELINE.findIndex(t => t.day >= currentDay);
  const cdX = cdIdx >= 0
    ? PAD.left + (cdIdx / (PROJECTION_TIMELINE.length - 1)) * CW
    : PAD.left;

  // Y-axis ticks
  const ticks = [minV, (minV + maxV) / 2, maxV];

  // X-axis labels (every 4th)
  const xLabels = PROJECTION_TIMELINE.filter((_, i) => i % 4 === 0);

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.orange} stopOpacity="0.15" />
            <Stop offset="1" stopColor={COLORS.orange} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis ticks */}
        {ticks.map((t, i) => {
          const y = PAD.top + (1 - (t - minV) / (maxV - minV)) * CH;
          const label = t >= 1000 ? `$${Math.round(t / 1000)}K` : `$${Math.round(t)}`;
          return (
            <React.Fragment key={i}>
              <Line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke={COLORS.border} strokeWidth={0.5} />
              <SvgText x={PAD.left - 4} y={y + 4} fill={COLORS.muted} fontSize={8} textAnchor="end">{label}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Bull line */}
        <Path d={pointsToPath(bullPts)} stroke={COLORS.green} strokeWidth={1.5} fill="none" strokeDasharray="4,2" />
        {/* Base line */}
        <Path d={pointsToPath(basePts)} stroke={COLORS.orange} strokeWidth={2.5} fill="none" />
        {/* Bear line */}
        <Path d={pointsToPath(bearPts)} stroke={COLORS.red} strokeWidth={1.5} fill="none" strokeDasharray="4,2" />

        {/* Current day marker */}
        <Line x1={cdX} y1={PAD.top} x2={cdX} y2={PAD.top + CH} stroke={COLORS.yellow} strokeWidth={1.5} strokeDasharray="3,3" />
        <SvgText x={cdX + 3} y={PAD.top + 10} fill={COLORS.yellow} fontSize={8}>TODAY</SvgText>

        {/* X labels */}
        {xLabels.map(t => {
          const i = PROJECTION_TIMELINE.indexOf(t);
          const x = PAD.left + (i / (PROJECTION_TIMELINE.length - 1)) * CW;
          return (
            <SvgText key={t.label} x={x} y={H - 4} fill={COLORS.muted} fontSize={7} textAnchor="middle">{t.label}</SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: COLORS.red,    label: 'Bear ' + formatPrice(ATH_TARGETS.bear) },
          { color: COLORS.orange, label: 'Base ' + formatPrice(ATH_TARGETS.base) },
          { color: COLORS.green,  label: 'Bull ' + formatPrice(ATH_TARGETS.bull) },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend:     { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.muted },
});

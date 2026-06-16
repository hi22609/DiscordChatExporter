// BOTTOM-ANCHORED 1070/364 CYCLE
// The cycle runs: BOTTOM -> 1070 days up -> TOP -> 364 days down -> BOTTOM.
// Anchored to the last real cycle bottom so the next bottom lands Oct 5, 2026.
export const DAY_MS       = 86400000;
export const ASCENT_DAYS  = 1070;
export const DESCENT_DAYS = 364;
export const CYCLE_LEN    = ASCENT_DAYS + DESCENT_DAYS; // 1434
export const ANCHOR_BOTTOM = new Date('2022-11-01T00:00:00Z'); // last cycle low -> next bottom Oct 5, 2026

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Phases across the FULL cycle (day 0 = bottom)
export const PHASES = [
  { name: 'Accumulation',      emoji: '🟢', start: 0,    end: 180,  color: '#00d084', desc: 'Bottom is in. Whales buying quietly. Best entry window.', action: 'BUY AGGRESSIVELY', risk: 'LOW', riskColor: '#00d084', detail: 'The bottom just formed. Most people have no idea. On-chain data shows long-term holders absorbing supply. This is historically the best time to dollar-cost average.' },
  { name: 'Re-Awakening',      emoji: '🟡', start: 181,  end: 365,  color: '#ffd700', desc: 'Media returns. Retail starts noticing.', action: 'BUY REGULARLY', risk: 'LOW-MED', riskColor: '#c8b400', detail: 'Bitcoin starts appearing in headlines again. Retail wallets are being created. The old ATH is being tested. Continue DCA but watch for acceleration.' },
  { name: 'Momentum Build',    emoji: '🟠', start: 366,  end: 540,  color: '#f7931a', desc: 'Old ATH broken. Price discovery begins.', action: 'BUY LESS, HOLD', risk: 'MEDIUM', riskColor: '#f7931a', detail: 'New all-time highs are being set. Price discovery is happening. Slow down new buys and let existing positions run. Watch on-chain signals closely.' },
  { name: 'Parabolic Advance', emoji: '🔥', start: 541,  end: 780,  color: '#ff6b35', desc: 'Exponential move. FOMO is here.', action: 'STOP BUYING, HOLD', risk: 'HIGH', riskColor: '#ff6b35', detail: 'The move is vertical. Leverage is building. Stop adding new positions. Hold existing and start planning your exit ladders. Be ready to act fast.' },
  { name: 'Blow-Off Top',      emoji: '🚨', start: 781,  end: 1070, color: '#ff4560', desc: 'Euphoria. Everyone talks Bitcoin. START SELLING.', action: 'SELL IN LADDERS', risk: 'EXIT', riskColor: '#ff4560', detail: 'Your coworkers are asking about Bitcoin. CNBC is running crypto segments. This is historically the time to execute sell ladders. Do NOT wait for the exact top.' },
  { name: 'Denial',            emoji: '😬', start: 1071, end: 1130, color: '#ff6b35', desc: 'ATH is in. Dip-buyers think it is just a correction.', action: 'WAIT — do not catch the knife', risk: 'HIGH', riskColor: '#ff6b35', detail: 'Price has rolled over but most people call it a healthy pullback. Sell ladders should already be mostly filled. Avoid buying back in yet.' },
  { name: 'Capitulation',      emoji: '😱', start: 1131, end: 1220, color: '#ff4560', desc: 'Panic selling. Cascading liquidations.', action: 'WAIT — bottom not in yet', risk: 'HIGH', riskColor: '#ff4560', detail: 'Leveraged longs are getting wiped out. Headlines call it "the end of crypto." This is painful but normal, and not the time to buy yet.' },
  { name: 'Despair',           emoji: '😴', start: 1221, end: 1350, color: '#6b6b80', desc: 'Dead market. Nobody talks crypto. Best DCA window opens.', action: 'START DCA — accumulate', risk: 'LOW', riskColor: '#00d084', detail: 'Volume dries up. Crypto Twitter goes quiet. This boring, depressing stretch is historically one of the best times to start buying again.' },
  { name: 'Stealth Bottom',    emoji: '🌱', start: 1351, end: 1434, color: '#7c3aed', desc: 'Bottom forming. Whales absorbing supply.', action: 'BUY AGGRESSIVELY', risk: 'LOW', riskColor: '#00d084', detail: 'Smart money is quietly accumulating again ahead of the next cycle. Nobody is talking about it. That is exactly the point.' },
];

// Price scenario anchors along the calendar (base = mid case)
export const PRICE_ANCHORS = [
  { date: new Date('2022-11-01T00:00:00Z'), bear: 15500,  base: 15500,  bull: 15500  }, // last bottom
  { date: new Date('2025-10-06T00:00:00Z'), bear: 110000, base: 150000, bull: 200000 }, // cycle ATH
  { date: new Date('2026-10-05T00:00:00Z'), bear: 40000,  base: 55000,  bull: 75000  }, // NEXT BOTTOM
  { date: new Date('2029-09-10T00:00:00Z'), bear: 250000, base: 400000, bull: 700000 }, // next cycle ATH
];

// Next-ATH targets used by the portfolio (the 2029 top)
export const ATH_TARGETS = { bear: 250000, base: 400000, bull: 700000 };

export function currentCycleStart() {
  const elapsed = Date.now() - ANCHOR_BOTTOM.getTime();
  const n = Math.floor(elapsed / (CYCLE_LEN * DAY_MS));
  return new Date(ANCHOR_BOTTOM.getTime() + n * CYCLE_LEN * DAY_MS);
}

export function getCycleDay() {
  return Math.floor((Date.now() - currentCycleStart().getTime()) / DAY_MS);
}

// Calendar date of a given day within the current cycle
export function dateOfCycleDay(d) {
  return new Date(currentCycleStart().getTime() + d * DAY_MS);
}

export function getPhase(day) {
  for (const p of PHASES) {
    if (day >= p.start && day <= p.end) return p;
  }
  return PHASES[PHASES.length - 1];
}

// 0 at bottom, ~95 at top. Rises through the ascent, falls through the descent.
export function getCycleScore(day) {
  if (day <= ASCENT_DAYS) {
    return Math.min(95, Math.round(8 + (day / ASCENT_DAYS) * 87));
  }
  const descPct = (day - ASCENT_DAYS) / DESCENT_DAYS;
  return Math.max(6, Math.round(95 - descPct * 89));
}

// Next major cycle event from where we are
export function getNextEvent() {
  const day = getCycleDay();
  if (day < ASCENT_DAYS) {
    return { name: 'Cycle ATH', date: dateOfCycleDay(ASCENT_DAYS) };
  }
  return { name: 'Cycle Bottom', date: dateOfCycleDay(CYCLE_LEN) };
}

export function getArcProgress(day) {
  if (day <= ASCENT_DAYS) {
    return { arc: 1, pct: Math.min(100, (day / ASCENT_DAYS) * 100), remaining: Math.max(0, ASCENT_DAYS - day) };
  }
  const d2 = day - ASCENT_DAYS;
  return { arc: 2, pct: Math.min(100, (d2 / DESCENT_DAYS) * 100), remaining: Math.max(0, DESCENT_DAYS - d2) };
}

export function getCountdown(targetDate) {
  const now = new Date();
  const diff = Math.max(0, targetDate - now);
  return {
    total: diff,
    days:    Math.floor(diff / DAY_MS),
    hours:   Math.floor((diff % DAY_MS) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

// Smooth calendar-anchored price projection model
function smoothstep(t) { return t * t * (3 - 2 * t); }

export function projectedPriceOn(dateObj, scenario) {
  const t = dateObj.getTime();
  const A = PRICE_ANCHORS;
  if (t <= A[0].date.getTime()) return A[0][scenario];
  for (let i = 0; i < A.length - 1; i++) {
    const a = A[i], b = A[i + 1];
    if (t >= a.date.getTime() && t <= b.date.getTime()) {
      const frac = (t - a.date.getTime()) / (b.date.getTime() - a.date.getTime());
      const s = smoothstep(frac);
      return Math.round(a[scenario] + (b[scenario] - a[scenario]) * s);
    }
  }
  return A[A.length - 1][scenario];
}

export function getProjectedPrice(day, scenario = 'base') {
  return projectedPriceOn(dateOfCycleDay(day), scenario);
}

// Calendar months spanning the chart, expressed as cycle-relative days
export const PROJECTION_TIMELINE = (() => {
  const months = ['2025-07','2025-10','2026-01','2026-04','2026-07','2026-10','2027-01','2027-04','2027-07','2027-10','2028-04','2028-10','2029-09'];
  const start = currentCycleStart().getTime();
  return months.map(ym => {
    const d = new Date(ym + '-15T00:00:00Z');
    const day = Math.round((d.getTime() - start) / DAY_MS);
    const label = MONTHS[d.getUTCMonth()] + " '" + String(d.getUTCFullYear()).slice(2);
    return { label, day, date: d };
  });
})();

export function formatPrice(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n.toLocaleString();
}

export function formatLargePrice(n) {
  return '$' + n.toLocaleString('en-US');
}

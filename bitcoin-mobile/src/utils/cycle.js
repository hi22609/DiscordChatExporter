export const HALVING_DATE = new Date('2024-04-19T00:00:00Z');
export const ATH_DATE     = new Date('2027-01-24T00:00:00Z');
export const BOTTOM_DATE  = new Date('2028-01-23T00:00:00Z');
export const ARC1_DAYS    = 1070;
export const ARC2_DAYS    = 364;

export const PHASES = [
  {
    name: 'Accumulation',
    emoji: '🟢',
    start: 0, end: 180,
    color: '#00d084',
    desc: 'Whales buying quietly. Best entry window.',
    action: 'BUY AGGRESSIVELY',
    risk: 'LOW',
    riskColor: '#00d084',
    detail: 'The halving just happened. Most people have no idea. On-chain data shows long-term holders absorbing supply. This is historically the best time to dollar-cost average.',
  },
  {
    name: 'Re-Awakening',
    emoji: '🟡',
    start: 181, end: 365,
    color: '#ffd700',
    desc: 'Media returns. Retail starts noticing.',
    action: 'BUY REGULARLY',
    risk: 'LOW-MED',
    riskColor: '#c8b400',
    detail: 'Bitcoin starts appearing in headlines again. Retail wallets are being created. The old ATH is being tested. Continue DCA but watch for acceleration.',
  },
  {
    name: 'Momentum Build',
    emoji: '🟠',
    start: 366, end: 540,
    color: '#f7931a',
    desc: 'Old ATH broken. Price discovery begins.',
    action: 'HOLD / REDUCE DCA',
    risk: 'MEDIUM',
    riskColor: '#f7931a',
    detail: 'New all-time highs are being set. Price discovery is happening. Slow down new buys and let existing positions run. Watch on-chain signals closely.',
  },
  {
    name: 'Parabolic Advance',
    emoji: '🔥',
    start: 541, end: 780,
    color: '#ff6b35',
    desc: 'Exponential move. FOMO everywhere.',
    action: 'STOP BUYING / HOLD',
    risk: 'HIGH',
    riskColor: '#ff6b35',
    detail: 'The move is vertical. Leverage is building. Stop adding new positions. Hold existing and start planning your exit ladders. Be ready to act fast.',
  },
  {
    name: 'Blow-Off Top',
    emoji: '🚨',
    start: 781, end: 1070,
    color: '#ff4560',
    desc: 'Euphoria. Everyone is talking Bitcoin.',
    action: 'SELL IN LADDERS',
    risk: 'EXIT',
    riskColor: '#ff4560',
    detail: 'Your coworkers are asking about Bitcoin. CNBC is running crypto segments. This is historically the time to execute sell ladders. Do NOT wait for the exact top.',
  },
];

export const ARC2_PHASES = [
  { name: 'Denial',         start: 0,   end: 60,  color: '#ff6b35', desc: 'Dip buyers flood in. "It\'s just a correction."' },
  { name: 'Capitulation',   start: 61,  end: 150, color: '#ff4560', desc: 'Panic. Cascading liquidations. -50 to -65%.' },
  { name: 'Despair',        start: 151, end: 280, color: '#6b6b80', desc: 'Nobody talks crypto. Dead market. Best DCA window.' },
  { name: 'Stealth Bottom', start: 281, end: 364, color: '#7c3aed', desc: 'Whales absorbing. Pre-halving hype building.' },
];

export function getCycleDay() {
  const now = new Date();
  return Math.floor((now - HALVING_DATE) / 86400000);
}

export function getPhase(day) {
  if (day <= ARC1_DAYS) {
    return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[PHASES.length - 1];
  }
  const arc2Day = day - ARC1_DAYS;
  return ARC2_PHASES.find(p => arc2Day >= p.start && arc2Day <= p.end) || ARC2_PHASES[ARC2_PHASES.length - 1];
}

export function getArc(day) {
  return day <= ARC1_DAYS ? 1 : 2;
}

export function getArc2Day(day) {
  return Math.max(0, day - ARC1_DAYS);
}

export function getCycleScore(day) {
  if (day > ARC1_DAYS) {
    const arc2Day = day - ARC1_DAYS;
    return Math.max(5, Math.round(85 - (arc2Day / ARC2_DAYS) * 75));
  }
  const pct = day / ARC1_DAYS;
  return Math.min(95, Math.round(15 + pct * 80));
}

export function getCountdown(targetDate) {
  const now = new Date();
  const diff = Math.max(0, targetDate - now);
  return {
    total: diff,
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function getArcProgress(day) {
  if (day <= ARC1_DAYS) {
    return { arc: 1, pct: Math.min(100, (day / ARC1_DAYS) * 100), remaining: Math.max(0, ARC1_DAYS - day) };
  }
  const arc2Day = day - ARC1_DAYS;
  return { arc: 2, pct: Math.min(100, (arc2Day / ARC2_DAYS) * 100), remaining: Math.max(0, ARC2_DAYS - arc2Day) };
}

// Price projection model
export function getProjectedPrice(day, scenario = 'base') {
  const halvingPrice = 62000;
  const multipliers = { bear: 2.26, base: 3.23, bull: 5.65 };
  const m = multipliers[scenario];

  if (day <= ARC1_DAYS) {
    const sig = 1 / (1 + Math.exp(-(day - 600) / 130));
    return Math.round(halvingPrice * (1 + (m - 1) * sig));
  }
  const ath = halvingPrice * m;
  const arc2Day = day - ARC1_DAYS;
  const drawdowns = { bear: 0.77, base: 0.79, bull: 0.80 };
  const dd = drawdowns[scenario];
  const decay = 1 - dd * (1 - Math.exp(-arc2Day / 85));
  return Math.round(ath * decay);
}

export const PROJECTION_TIMELINE = [
  { label: 'Apr \'24', day: 0 },
  { label: 'Jul \'24', day: 91 },
  { label: 'Oct \'24', day: 183 },
  { label: 'Jan \'25', day: 274 },
  { label: 'Apr \'25', day: 365 },
  { label: 'Jul \'25', day: 457 },
  { label: 'Oct \'25', day: 548 },
  { label: 'Jan \'26', day: 640 },
  { label: 'Apr \'26', day: 731 },
  { label: 'Jul \'26', day: 822 },
  { label: 'Oct \'26', day: 913 },
  { label: 'Jan \'27', day: 1070 },
  { label: 'Apr \'27', day: 1160 },
  { label: 'Jul \'27', day: 1251 },
  { label: 'Oct \'27', day: 1342 },
  { label: 'Jan \'28', day: 1434 },
];

export function formatPrice(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n.toLocaleString();
}

export function formatLargePrice(n) {
  return '$' + n.toLocaleString('en-US');
}

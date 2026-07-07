// Bitcoin 4-year cycle math — the SAME model the app uses, standalone so the
// content engine grounds every post in the real current cycle position.
// Bottom-anchored: BOTTOM -> 1070d up -> TOP -> 364d down -> BOTTOM.

const DAY_MS = 86400000;
export const ASCENT_DAYS = 1070;
export const DESCENT_DAYS = 364;
export const CYCLE_LEN = ASCENT_DAYS + DESCENT_DAYS; // 1434
const ANCHOR_BOTTOM = new Date('2022-11-01T00:00:00Z'); // last real cycle low

export const ATH_TARGETS = { bear: 250000, base: 400000, bull: 700000 };

export const PHASES = [
  { name: 'Accumulation',      start: 0,    end: 180,  desc: 'Bottom is in. Whales buying quietly. Best entry window.', dca: 'BUY AGGRESSIVELY',  verdict: 'BUY',          risk: 'LOW' },
  { name: 'Re-Awakening',      start: 181,  end: 365,  desc: 'Media returns. Retail starts noticing.',                  dca: 'BUY REGULARLY',     verdict: 'BUY',          risk: 'LOW' },
  { name: 'Momentum Build',    start: 366,  end: 540,  desc: 'Old ATH broken. Price discovery begins.',                 dca: 'BUY LESS, HOLD',    verdict: 'HOLD',         risk: 'MED' },
  { name: 'Parabolic Advance', start: 541,  end: 780,  desc: 'Exponential move. FOMO is here.',                         dca: 'STOP BUYING, HOLD', verdict: 'HOLD',         risk: 'HIGH' },
  { name: 'Blow-Off Top',      start: 781,  end: 1070, desc: 'Euphoria. Everyone talks Bitcoin. Start selling.',        dca: 'SELL IN LADDERS',   verdict: 'TAKE PROFITS', risk: 'EXIT' },
  { name: 'Denial',            start: 1071, end: 1130, desc: 'ATH is in. Dip-buyers think it is just a correction.',     dca: 'WAIT',              verdict: 'WAIT',         risk: 'HIGH' },
  { name: 'Capitulation',      start: 1131, end: 1220, desc: 'Panic selling. Cascading liquidations.',                  dca: 'WAIT',              verdict: 'WAIT',         risk: 'HIGH' },
  { name: 'Despair',           start: 1221, end: 1350, desc: 'Dead market. Nobody talks crypto. Best DCA window opens.', dca: 'START DCA',         verdict: 'ACCUMULATE',   risk: 'LOW' },
  { name: 'Stealth Bottom',    start: 1351, end: 1434, desc: 'Bottom forming. Whales absorbing supply.',                dca: 'BUY AGGRESSIVELY',  verdict: 'BUY',          risk: 'LOW' },
];

export function getCycleDay(now = Date.now()) {
  return Math.floor((now - ANCHOR_BOTTOM.getTime()) / DAY_MS) % CYCLE_LEN;
}

export function getPhase(day) {
  return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[PHASES.length - 1];
}

// A compact, plain-English snapshot of where we are — passed into every prompt
// so the model writes about the ACTUAL cycle moment, not generic hype.
export function cycleSnapshot(now = Date.now()) {
  const day = getCycleDay(now);
  const phase = getPhase(day);
  const inAscent = day <= ASCENT_DAYS;
  const pct = (day / CYCLE_LEN * 100).toFixed(1);
  const daysToTop = Math.max(0, ASCENT_DAYS - day);
  const daysToBottom = day <= ASCENT_DAYS ? (CYCLE_LEN - day) : (CYCLE_LEN - day);
  const nextEvent = inAscent
    ? { name: 'projected cycle top', inDays: daysToTop }
    : { name: 'projected cycle bottom', inDays: daysToBottom };
  return {
    day, cycleLength: CYCLE_LEN,
    phaseName: phase.name,
    phaseDesc: phase.desc,
    verdict: phase.verdict,
    action: phase.dca,
    risk: phase.risk,
    direction: inAscent ? 'ASCENT (heading toward the top)' : 'DESCENT (heading toward the bottom)',
    progressPct: pct,
    nextEvent,
    athTargets: ATH_TARGETS,
  };
}

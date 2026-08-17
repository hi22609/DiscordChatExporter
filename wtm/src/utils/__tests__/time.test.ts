import { formatMoveDuration, getMoveUrgency, isMoveHappeningNow } from '../time';

function minutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

describe('getMoveUrgency', () => {
  it('flags already-started moves as now', () => {
    expect(getMoveUrgency(minutesFromNow(-10))).toBe('now');
  });
  it('flags moves within 2 hours as soon', () => {
    expect(getMoveUrgency(minutesFromNow(45))).toBe('soon');
  });
});

describe('isMoveHappeningNow', () => {
  it('is true inside an explicit window', () => {
    expect(isMoveHappeningNow(minutesFromNow(-30), minutesFromNow(60))).toBe(true);
  });
  it('is false after the window ends', () => {
    expect(isMoveHappeningNow(minutesFromNow(-120), minutesFromNow(-60))).toBe(false);
  });
  it('uses a 30-minute grace period with no end time', () => {
    expect(isMoveHappeningNow(minutesFromNow(-10), null)).toBe(true);
    expect(isMoveHappeningNow(minutesFromNow(-90), null)).toBe(false);
  });
});

describe('formatMoveDuration', () => {
  it('formats hours and minutes', () => {
    const start = minutesFromNow(0);
    const end = minutesFromNow(90);
    expect(formatMoveDuration(start, end)).toBe('1h 30m');
  });
  it('returns empty string with no end time', () => {
    expect(formatMoveDuration(minutesFromNow(0), null)).toBe('');
  });
});

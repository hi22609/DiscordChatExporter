import { formatDistance, haversineDistanceMeters, metersToMiles } from '../distance';

describe('formatDistance', () => {
  it('shows feet under a mile', () => {
    expect(formatDistance(500)).toMatch(/ft$/);
  });
  it('shows one decimal under 10 miles', () => {
    expect(formatDistance(8047)).toBe('5.0 mi');
  });
  it('rounds whole miles at 10+', () => {
    expect(formatDistance(40234)).toBe('25 mi');
  });
  it('says nearby when very close', () => {
    expect(formatDistance(50)).toBe('nearby');
  });
});

describe('haversineDistanceMeters', () => {
  it('is zero for identical points', () => {
    expect(haversineDistanceMeters(40.44, -79.99, 40.44, -79.99)).toBe(0);
  });
  it('measures downtown Pittsburgh to Oakland at roughly 5km', () => {
    const d = haversineDistanceMeters(40.4406, -79.9959, 40.4444, -79.9533);
    expect(d).toBeGreaterThan(3000);
    expect(d).toBeLessThan(4500);
  });
});

describe('metersToMiles', () => {
  it('converts a mile exactly', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1);
  });
});

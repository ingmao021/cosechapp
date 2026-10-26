import { addDaysToDateKey, colombiaDateKey, daysBetweenDateKeys } from './index';

describe('date keys (Colombia)', () => {
  it('names the Colombian day of an instant, whatever the phone time zone', () => {
    // 27 oct 2026, 03:00 UTC = 26 oct 22:00 en Colombia
    expect(colombiaDateKey('2026-10-27T03:00:00Z')).toBe('2026-10-26');
    expect(colombiaDateKey(new Date('2026-10-27T05:00:00Z'))).toBe('2026-10-27');
  });

  it('moves across months and counts days between keys', () => {
    expect(addDaysToDateKey('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDaysToDateKey('2026-10-26', -6)).toBe('2026-10-20');
    expect(daysBetweenDateKeys('2026-10-22', '2026-10-26')).toBe(4);
  });
});

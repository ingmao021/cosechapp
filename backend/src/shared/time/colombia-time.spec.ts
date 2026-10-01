import { startOfDayInColombia, startOfWeekInColombia } from './colombia-time';

describe('colombia-time', () => {
  it('starts the Colombian day at 05:00 UTC', () => {
    // 30 sep 2026, 03:00 UTC = 29 sep 22:00 en Colombia
    expect(startOfDayInColombia(new Date('2026-09-30T03:00:00Z')).toISOString()).toBe('2026-09-29T05:00:00.000Z');
    // 30 sep 2026, 15:00 UTC = 30 sep 10:00 en Colombia
    expect(startOfDayInColombia(new Date('2026-09-30T15:00:00Z')).toISOString()).toBe('2026-09-30T05:00:00.000Z');
  });

  it('starts the week on Monday in Colombia', () => {
    // miércoles 30 sep 2026 → lunes 28 sep 2026
    expect(startOfWeekInColombia(new Date('2026-09-30T15:00:00Z')).toISOString()).toBe('2026-09-28T05:00:00.000Z');
    // domingo 4 oct 2026 → lunes 28 sep 2026
    expect(startOfWeekInColombia(new Date('2026-10-04T20:00:00Z')).toISOString()).toBe('2026-09-28T05:00:00.000Z');
  });
});

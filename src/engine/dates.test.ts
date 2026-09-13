import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayString, yesterdayString, daysAgoString } from './dates';

// CLAUDE.md says `npm test` guards this rule. Until now it did not: no test
// imported dates.ts at all, so the invariant was documented and unenforced.
//
// The trap: `new Date().toISOString()` is UTC, so from ~17:00 US Pacific the
// "today" it reports is already tomorrow. A streak written in the evening then
// looks like a gap the next morning and her streak silently resets.

const AFTER_UTC_MIDNIGHT_LOCAL_EVENING = new Date(2026, 2, 14, 19, 30, 0); // 14 Mar 2026, 19:30 local

afterEach(() => { vi.useRealTimers(); });

describe('dates are local, never UTC', () => {
  it('todayString reports the local calendar day, not the UTC one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(AFTER_UTC_MIDNIGHT_LOCAL_EVENING);

    const d = AFTER_UTC_MIDNIGHT_LOCAL_EVENING;
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    expect(todayString()).toBe(expected);
    expect(todayString()).toBe('2026-03-14');
  });

  it('an evening of play does not read as yesterday the next morning', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 2, 14, 21, 0, 0)); // she plays at 9pm
    const played = todayString();

    vi.setSystemTime(new Date(2026, 2, 15, 8, 0, 0)); // next morning
    expect(yesterdayString()).toBe(played);
    expect(todayString()).not.toBe(played);
  });

  it('daysAgoString walks back one calendar day at a time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 19, 30, 0));

    expect(daysAgoString(0)).toBe(todayString());
    expect(daysAgoString(1)).toBe(yesterdayString());
    expect(daysAgoString(14)).toBe('2026-02-28');
  });

  it('crosses a month boundary correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 22, 0, 0)); // 1 Mar, 10pm local
    expect(todayString()).toBe('2026-03-01');
    expect(yesterdayString()).toBe('2026-02-28');
  });

  it('never emits a UTC-shifted day for a late-evening local time', () => {
    vi.useFakeTimers();
    for (const hour of [17, 18, 20, 22, 23]) {
      vi.setSystemTime(new Date(2026, 5, 10, hour, 0, 0));
      expect(todayString()).toBe('2026-06-10');
    }
  });
});

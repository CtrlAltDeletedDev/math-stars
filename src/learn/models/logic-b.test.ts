import { describe, expect, it } from 'vitest';
import { ModelState } from '../types';
import {
  addCoin, addOne, addTen, addToRow, angleDelta, badOffset, blocksValue, canTradeNow, clockToMinutes, clockWords, coinTotal,
  graphCap, graphColumns, hourHandAngle, minuteHandAngle, minutesToClock, partWeights, placeUnit, removeCoin, removeFromRow,
  removeOne, removeTen, removeUnit, setHourFromAngle, shadedCount, snapMinute, snapTime, stepHour, stepMinute, toClockHour,
  toggleShade, togglePick, trade, MAX_TRAY_COINS,
} from './logic-b';

type S<K extends ModelState['model']> = Extract<ModelState, { model: K }>;
const blocks = (tens: number, ones: number, extra: Partial<S<'blocks'>> = {}): S<'blocks'> => ({ model: 'blocks', tens, ones, ...extra });
const clock = (hour: number, minute: number, snapMinutes?: 60 | 30 | 15 | 5): S<'clock'> => ({ model: 'clock', hour, minute, snapMinutes });

describe('blocks', () => {
  it('adds and removes tens and ones, never below zero', () => {
    expect(addTen(blocks(2, 3))).toMatchObject({ tens: 3, ones: 3 });
    expect(addOne(blocks(2, 3))).toMatchObject({ tens: 2, ones: 4 });
    expect(removeTen(blocks(0, 3))).toMatchObject({ tens: 0 });
    expect(removeOne(blocks(1, 0))).toMatchObject({ ones: 0 });
    expect(removeOne(blocks(1, 5))).toMatchObject({ ones: 4 });
  });

  it('respects maxTens', () => {
    expect(addTen(blocks(5, 0, { maxTens: 5 })).tens).toBe(5);
    expect(addTen(blocks(9, 0)).tens).toBe(10);
    expect(addTen(blocks(10, 0)).tens).toBe(10);
  });

  it('never puts ten in the ones place unless trading is allowed', () => {
    expect(addOne(blocks(0, 9)).ones).toBe(9);
    expect(addOne(blocks(0, 9, { canTrade: true })).ones).toBe(10);
    expect(addOne(blocks(0, 20, { canTrade: true })).ones).toBe(20);
  });

  it('trades ten ones for a ten without changing the number', () => {
    const s = blocks(1, 12, { canTrade: true });
    expect(canTradeNow(s)).toBe(true);
    const t = trade(s);
    expect(t).toMatchObject({ tens: 2, ones: 2 });
    expect(blocksValue(t)).toBe(blocksValue(s));
  });

  it('will not trade without canTrade, with fewer than ten, or with no room for a rod', () => {
    expect(trade(blocks(1, 12))).toMatchObject({ tens: 1, ones: 12 });
    expect(trade(blocks(1, 9, { canTrade: true }))).toMatchObject({ tens: 1, ones: 9 });
    expect(trade(blocks(3, 10, { canTrade: true, maxTens: 3 }))).toMatchObject({ tens: 3, ones: 10 });
  });
});

describe('clock', () => {
  it('wraps hours into 1..12', () => {
    expect([0, 1, 12, 13, -1, 24].map(toClockHour)).toEqual([12, 1, 12, 1, 11, 12]);
  });

  it('snaps minutes', () => {
    expect(snapMinute(22, 5)).toBe(20);
    expect(snapMinute(23, 5)).toBe(25);
    expect(snapMinute(20, 30)).toBe(30);
    expect(snapMinute(14, 30)).toBe(0);
    expect(snapMinute(50, 60)).toBe(0);
  });

  it('snapping a time carries into the next hour like a real clock', () => {
    expect(snapTime(clockToMinutes(3, 58), 5)).toEqual({ hour: 4, minute: 0 });
    expect(snapTime(clockToMinutes(12, 50), 30)).toEqual({ hour: 1, minute: 0 });
    expect(snapTime(clockToMinutes(12, 2), 15)).toEqual({ hour: 12, minute: 0 });
  });

  it('round-trips times through minutes', () => {
    for (let h = 1; h <= 12; h++) for (const m of [0, 5, 30, 55]) expect(minutesToClock(clockToMinutes(h, m))).toEqual({ hour: h, minute: m });
  });

  it('puts the hour hand part way to the next hour (halfway at half past)', () => {
    expect(hourHandAngle(3, 0)).toBe(90);
    expect(hourHandAngle(3, 30)).toBe(105);
    expect(hourHandAngle(12, 0)).toBe(0);
    expect(hourHandAngle(12, 30)).toBe(15);
    expect(minuteHandAngle(15)).toBe(90);
  });

  it('steps the hour and leaves the minutes', () => {
    expect(stepHour(clock(12, 30), 1)).toMatchObject({ hour: 1, minute: 30 });
    expect(stepHour(clock(1, 0), -1)).toMatchObject({ hour: 12, minute: 0 });
  });

  it('steps the minute hand by the snap, carrying into the hour', () => {
    expect(stepMinute(clock(3, 45, 15), 1)).toMatchObject({ hour: 4, minute: 0 });
    expect(stepMinute(clock(4, 0, 15), -1)).toMatchObject({ hour: 3, minute: 45 });
    expect(stepMinute(clock(12, 30, 30), 1)).toMatchObject({ hour: 1, minute: 0 });
    expect(stepMinute(clock(2, 20), 1)).toMatchObject({ hour: 2, minute: 25 }); // default snap 5
    expect(stepMinute(clock(2, 0, 60), 1)).toMatchObject({ hour: 2, minute: 0 }); // o'clock only: no minute steps
  });

  it('steps an off-grid minute onto the grid first', () => {
    expect(stepMinute(clock(3, 7, 5), 1)).toMatchObject({ hour: 3, minute: 10 });
    expect(stepMinute(clock(3, 7, 5), -1)).toMatchObject({ hour: 3, minute: 5 });
  });

  it('sets the hour from where she points, allowing for the minutes', () => {
    expect(setHourFromAngle(clock(12, 0), 90)).toMatchObject({ hour: 3 });
    expect(setHourFromAngle(clock(12, 0), 100)).toMatchObject({ hour: 3 });
    // At half past, the hour hand for 3 sits at 105 degrees.
    expect(setHourFromAngle(clock(12, 30), 105)).toMatchObject({ hour: 3, minute: 30 });
    expect(setHourFromAngle(clock(5, 0), 359)).toMatchObject({ hour: 12 });
    const same = clock(3, 0);
    expect(setHourFromAngle(same, 92)).toBe(same);
  });

  it('measures drag deltas the short way round', () => {
    expect(angleDelta(350, 10)).toBe(20);
    expect(angleDelta(10, 350)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
  });

  it('says times in words', () => {
    expect(clockWords(3, 0)).toBe("3 o'clock");
    expect(clockWords(7, 30)).toBe('half past 7');
    expect(clockWords(10, 5)).toBe('10:05');
  });
});

describe('coins', () => {
  const coins = (tray: number[]): S<'coins'> => ({ model: 'coins', tray, bank: [1, 5, 10, 25] });
  it('totals, adds and removes the coin she tapped', () => {
    expect(coinTotal([25, 10, 5, 1, 1])).toBe(42);
    expect(addCoin(coins([10]), 5).tray).toEqual([10, 5]);
    expect(removeCoin(coins([10, 5, 1]), 1).tray).toEqual([10, 1]);
    expect(removeCoin(coins([10]), 3).tray).toEqual([10]);
  });
  it('caps the tray', () => {
    const full = coins(Array(MAX_TRAY_COINS).fill(1));
    expect(addCoin(full, 1)).toBe(full);
  });
});

describe('fraction', () => {
  const frac = (parts: number, shaded: boolean[]): S<'fraction'> => ({ model: 'fraction', shape: 'circle', parts, shaded });
  it('toggles a part, padding a short shaded list', () => {
    const s = toggleShade(frac(4, []), 2);
    expect(s.shaded).toEqual([false, false, true, false]);
    expect(toggleShade(s, 2).shaded).toEqual([false, false, false, false]);
    expect(shadedCount(s)).toBe(1);
    expect(toggleShade(s, 9)).toBe(s);
  });
  it('makes equal parts equal and unequal parts visibly different', () => {
    expect(partWeights(4)).toEqual([1, 1, 1, 1]);
    for (const n of [2, 3, 4, 6, 8]) {
      const w = partWeights(n, true);
      expect(w).toHaveLength(n);
      for (let i = 0; i < n; i++) expect(Math.abs(w[i] - w[(i + 1) % n])).toBeGreaterThan(0.2);
    }
  });
});

describe('shapes', () => {
  it('picks and unpicks, keeping picked sorted', () => {
    const s: S<'shapes'> = { model: 'shapes', items: ['circle', 'square', 'triangle'], picked: [] };
    const a = togglePick(togglePick(s, 2), 0);
    expect(a.picked).toEqual([0, 2]);
    expect(togglePick(a, 2).picked).toEqual([0]);
    expect(togglePick(a, 7)).toBe(a);
  });
});

describe('measure', () => {
  const m = (placed: number, length = 4): S<'measure'> => ({ model: 'measure', object: '✏️', length, unit: '🟩', placed });
  it('lays and takes back units, a couple past the end at most', () => {
    expect(placeUnit(m(0)).placed).toBe(1);
    expect(placeUnit(m(6)).placed).toBe(6);
    expect(removeUnit(m(0)).placed).toBe(0);
    expect(removeUnit(m(3)).placed).toBe(2);
  });
  it('lays bad units with gaps and an overlap, so the count does not fit', () => {
    const steps = Array.from({ length: 8 }, (_, i) => badOffset(i + 1) - badOffset(i));
    expect(steps.some((d) => d > 1.05)).toBe(true);
    expect(steps.some((d) => d < 0.95)).toBe(true);
    expect(badOffset(0)).toBe(0);
  });
});

describe('graph', () => {
  const g = (counts: number[], max?: number): S<'graph'> => ({ model: 'graph', rows: counts.map((count, i) => ({ emoji: '🍎', label: `r${i}`, count })), max });
  it('adds to and takes from one row only', () => {
    const s = g([2, 3]);
    expect(addToRow(s, 1).rows.map((r) => r.count)).toEqual([2, 4]);
    expect(removeFromRow(s, 0).rows.map((r) => r.count)).toEqual([1, 3]);
    expect(removeFromRow(g([0]), 0).rows[0].count).toBe(0);
    expect(addToRow(s, 5)).toBe(s);
  });
  it('stops at max', () => {
    expect(addToRow(g([6], 6), 0).rows[0].count).toBe(6);
    expect(graphCap(g([1]))).toBe(10);
  });
  it('sizes the grid to max, else the longest row (at least 5)', () => {
    expect(graphColumns(g([2], 8))).toBe(8);
    expect(graphColumns(g([2, 3]))).toBe(5);
    expect(graphColumns(g([7, 3]))).toBe(7);
  });
});

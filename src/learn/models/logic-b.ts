import { ModelState } from '../types';

// Pure state helpers for the Blocks, Clock, Coins, Fraction, Shapes, Measure
// and Graph models. The components call these to make the next state; lesson
// goals and tests can call them too. Every helper returns a new state (or the
// same object when nothing may change) and never mutates its input.

type S<K extends ModelState['model']> = Extract<ModelState, { model: K }>;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// --- Blocks -------------------------------------------------------------------

/** Rods she may have when the lesson does not say: up to 100. */
export const DEFAULT_MAX_TENS = 10;

export const maxTensOf = (s: S<'blocks'>) => s.maxTens ?? DEFAULT_MAX_TENS;

/**
 * Loose ones she may lay down. With `canTrade` there is room for two tens'
 * worth so she can see a ten waiting to be bundled; without it, a ones place
 * never holds ten.
 */
export const maxOnesOf = (s: S<'blocks'>) => (s.canTrade ? 20 : 9);

export const blocksValue = (s: S<'blocks'>) => s.tens * 10 + s.ones;

export function addTen(s: S<'blocks'>): S<'blocks'> {
  return s.tens >= maxTensOf(s) ? s : { ...s, tens: s.tens + 1 };
}

export function addOne(s: S<'blocks'>): S<'blocks'> {
  return s.ones >= maxOnesOf(s) ? s : { ...s, ones: s.ones + 1 };
}

export function removeTen(s: S<'blocks'>): S<'blocks'> {
  return s.tens <= 0 ? s : { ...s, tens: s.tens - 1 };
}

export function removeOne(s: S<'blocks'>): S<'blocks'> {
  return s.ones <= 0 ? s : { ...s, ones: s.ones - 1 };
}

/** Ten loose ones can become a rod: the lesson allows it, there are ten, and a rod fits. */
export const canTradeNow = (s: S<'blocks'>) => !!s.canTrade && s.ones >= 10 && s.tens < maxTensOf(s);

/** Bundle ten ones into one rod. The number does not change; only how it is made. */
export function trade(s: S<'blocks'>): S<'blocks'> {
  return canTradeNow(s) ? { ...s, tens: s.tens + 1, ones: s.ones - 10 } : s;
}

// --- Clock --------------------------------------------------------------------

export type Snap = 60 | 30 | 15 | 5;
export const snapOf = (s: S<'clock'>): Snap => s.snapMinutes ?? 5;

/** 0..11 hours into 1..12. */
export const toClockHour = (h: number) => ((((Math.round(h) - 1) % 12) + 12) % 12) + 1;

/** The nearest allowed minute, 0..59. 58 with 5-minute snap is 0 (the next hour); see `snapTime`. */
export function snapMinute(minute: number, snap: Snap): number {
  return (((Math.round(minute / snap) * snap) % 60) + 60) % 60;
}

/** Minutes past 12:00, 0..719, for doing arithmetic on times. */
export const clockToMinutes = (hour: number, minute: number) => ((hour % 12) * 60 + minute + 720) % 720;

/** Back from minutes past 12:00 (any integer, wraps) to an hour 1..12 and minute 0..59. */
export function minutesToClock(total: number): { hour: number; minute: number } {
  const t = ((Math.round(total) % 720) + 720) % 720;
  return { hour: toClockHour(Math.floor(t / 60)), minute: t % 60 };
}

/** Snap a whole time (in minutes past 12:00) to the clock's step, carrying into the hour as a real clock does. */
export function snapTime(total: number, snap: Snap): { hour: number; minute: number } {
  return minutesToClock(Math.round(total / snap) * snap);
}

/** Degrees clockwise from 12 for the minute hand. */
export const minuteHandAngle = (minute: number) => (minute / 60) * 360;

/** Degrees clockwise from 12 for the hour hand: part way to the next hour, as a real clock (halfway at :30). */
export const hourHandAngle = (hour: number, minute: number) => ((hour % 12) + minute / 60) * 30;

/** One hour on or back. The minute hand does not move. */
export function stepHour(s: S<'clock'>, by: number): S<'clock'> {
  return { ...s, hour: toClockHour(s.hour + by) };
}

/**
 * One step of the minute hand on or back (by `snapMinutes`). Going past 12
 * moves the hour on, as winding a real clock does: 3:45 then 4:00.
 */
export function stepMinute(s: S<'clock'>, by: number): S<'clock'> {
  const snap = snapOf(s);
  if (snap === 60) return s;
  const now = clockToMinutes(s.hour, s.minute);
  // Off the grid (a lesson set 3:07 on a 5-minute clock): the first step lands on the grid.
  const next = now % snap === 0 ? now + by * snap
    : by > 0 ? Math.ceil(now / snap) * snap + (by - 1) * snap
    : Math.floor(now / snap) * snap + (by + 1) * snap;
  return { ...s, ...minutesToClock(next) };
}

/** Put the hour hand where she pointed (degrees clockwise from 12). It lands on a whole hour. */
export function setHourFromAngle(s: S<'clock'>, angle: number): S<'clock'> {
  // The hand sits minute/60 of the way past its hour, so take that off first.
  const h = toClockHour(Math.round(angle / 30 - s.minute / 60));
  return h === s.hour ? s : { ...s, hour: h };
}

/** A drag delta in degrees, normalised to (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d <= -180) d += 360;
  if (d > 180) d -= 360;
  return d;
}

export function clockWords(hour: number, minute: number): string {
  if (minute === 0) return `${hour} o'clock`;
  if (minute === 30) return `half past ${hour}`;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

// --- Coins --------------------------------------------------------------------

export type CoinValue = 1 | 5 | 10 | 25;
export const COIN_VALUES: CoinValue[] = [1, 5, 10, 25];
export const MAX_TRAY_COINS = 15;

export const coinTotal = (coins: number[]) => coins.reduce((a, c) => a + c, 0);

export function addCoin(s: S<'coins'>, value: number): S<'coins'> {
  return s.tray.length >= MAX_TRAY_COINS ? s : { ...s, tray: [...s.tray, value] };
}

export function removeCoin(s: S<'coins'>, index: number): S<'coins'> {
  if (index < 0 || index >= s.tray.length) return s;
  return { ...s, tray: s.tray.filter((_, i) => i !== index) };
}

export const coinName = (v: number) => (v === 1 ? 'penny' : v === 5 ? 'nickel' : v === 10 ? 'dime' : v === 25 ? 'quarter' : `${v} cent coin`);

// --- Fraction -----------------------------------------------------------------

/** `shaded`, exactly `parts` long. */
export const shadedOf = (s: S<'fraction'>) => Array.from({ length: s.parts }, (_, i) => !!s.shaded[i]);

export function toggleShade(s: S<'fraction'>, i: number): S<'fraction'> {
  if (i < 0 || i >= s.parts) return s;
  const shaded = shadedOf(s);
  shaded[i] = !shaded[i];
  return { ...s, shaded };
}

export const shadedCount = (s: S<'fraction'>) => shadedOf(s).filter(Boolean).length;

/**
 * Relative sizes of the parts. Equal parts are all 1; unequal parts are
 * clearly different (no two neighbours alike), so "are these halves?" has a
 * visible answer.
 */
export function partWeights(parts: number, unequal?: boolean): number[] {
  if (!unequal || parts < 2) return Array.from({ length: parts }, () => 1);
  const pattern = [1.75, 0.8, 1.25, 0.55, 1.45, 0.7, 1.1, 0.6, 1.35, 0.85, 1.2, 0.65];
  return Array.from({ length: parts }, (_, i) => pattern[i % pattern.length]);
}

// --- Shapes -------------------------------------------------------------------

export function togglePick(s: S<'shapes'>, i: number): S<'shapes'> {
  if (i < 0 || i >= s.items.length) return s;
  const picked = s.picked.includes(i) ? s.picked.filter((p) => p !== i) : [...s.picked, i].sort((a, b) => a - b);
  return { ...s, picked };
}

// --- Measure ------------------------------------------------------------------

/** She may lay a couple past the end, so "too many" is a mistake she can make and see. */
export const maxPlacedOf = (s: S<'measure'>) => Math.max(s.length + 2, s.placed);

export function placeUnit(s: S<'measure'>): S<'measure'> {
  return s.placed >= maxPlacedOf(s) ? s : { ...s, placed: s.placed + 1 };
}

export function removeUnit(s: S<'measure'>): S<'measure'> {
  return s.placed <= 0 ? s : { ...s, placed: s.placed - 1 };
}

/**
 * Where unit i starts, in units, when laid badly: gaps between some, and one
 * overlap, so the count does not match the length.
 */
export function badOffset(i: number): number {
  const gaps = [0, 0.3, 0.15, -0.25, 0.4, 0.2, 0.1, 0.35, -0.15, 0.25, 0.3, 0.1];
  let x = 0;
  for (let k = 1; k <= i; k++) x += 1 + gaps[k % gaps.length];
  return x;
}

// --- Graph --------------------------------------------------------------------

export const GRAPH_CAP = 10;

/** How many columns the grid has: `max`, or room for the biggest row (at least 5). */
export function graphColumns(s: S<'graph'>): number {
  return s.max ?? Math.max(5, ...s.rows.map((r) => r.count));
}

/** The most one row may hold when she adds: `max`, else 10. */
export const graphCap = (s: S<'graph'>) => s.max ?? Math.max(GRAPH_CAP, ...s.rows.map((r) => r.count));

export function addToRow(s: S<'graph'>, row: number): S<'graph'> {
  const r = s.rows[row];
  if (!r || r.count >= graphCap(s)) return s;
  return { ...s, rows: s.rows.map((x, i) => (i === row ? { ...x, count: x.count + 1 } : x)) };
}

export function removeFromRow(s: S<'graph'>, row: number): S<'graph'> {
  const r = s.rows[row];
  if (!r || r.count <= 0) return s;
  return { ...s, rows: s.rows.map((x, i) => (i === row ? { ...x, count: x.count - 1 } : x)) };
}

export { clamp };

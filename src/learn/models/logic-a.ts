import { CounterColour, ModelState } from '../types';

// Pure state helpers for the ten frame, number line, objects, bond, compare
// and text models. The components only draw a state and call these to make
// the next one, so every tap she can make is tested here without a browser.

export type TenFrameState = Extract<ModelState, { model: 'tenFrame' }>;
export type NumberLineState = Extract<ModelState, { model: 'numberLine' }>;
export type ObjectsState = Extract<ModelState, { model: 'objects' }>;
export type BondState = Extract<ModelState, { model: 'bond' }>;
export type CompareState = Extract<ModelState, { model: 'compare' }>;
export type TextState = Extract<ModelState, { model: 'text' }>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// --- Ten frame ---------------------------------------------------------------

/** The cells, always exactly frames × 10 long (a short or long array is padded or cut). */
export function tenFrameCells(s: TenFrameState): (CounterColour | null)[] {
  const n = s.frames * 10;
  return Array.from({ length: n }, (_, i) => s.cells[i] ?? null);
}

/**
 * The counter an empty-cell tap would place: 'a' while the tray has any, then
 * 'b'. With no tray at all the supply is endless 'a' counters, so a lesson that
 * says "show 6" without setting up a tray can still be done. A take-away frame
 * with no tray places nothing: taking away is not the moment to add.
 */
export function nextTrayCounter(s: TenFrameState): CounterColour | null {
  if (!s.tray) return s.takeAway ? null : 'a';
  if (s.tray.a > 0) return 'a';
  if (s.tray.b > 0) return 'b';
  return null;
}

/**
 * Put the next tray counter in cell `i`. Fill order is wherever she taps; we
 * do not snap to the first empty cell, so the frame shows what she did.
 */
export function placeCounter(s: TenFrameState, i: number): TenFrameState {
  const cells = tenFrameCells(s);
  if (i < 0 || i >= cells.length || cells[i] !== null) return s;
  const c = nextTrayCounter(s);
  if (!c) return s;
  cells[i] = c;
  const tray = s.tray ? { ...s.tray, [c]: s.tray[c] - 1 } : undefined;
  return { ...s, cells, ...(tray ? { tray } : {}) };
}

/** Take the counter in cell `i` back to the tray (or just away, when there is no tray). */
export function removeCounter(s: TenFrameState, i: number): TenFrameState {
  const cells = tenFrameCells(s);
  const c = cells[i];
  if (!c) return s;
  cells[i] = null;
  const next: TenFrameState = { ...s, cells };
  if (s.tray) next.tray = { ...s.tray, [c]: s.tray[c] + 1 };
  if (s.crossed?.includes(i)) next.crossed = s.crossed.filter((k) => k !== i);
  return next;
}

/** Cross out the counter in cell `i`, or un-cross it. Empty cells cannot be crossed. */
export function crossOut(s: TenFrameState, i: number): TenFrameState {
  const cells = tenFrameCells(s);
  if (!cells[i]) return s;
  const crossed = s.crossed ?? [];
  return crossed.includes(i)
    ? { ...s, crossed: crossed.filter((k) => k !== i) }
    : { ...s, crossed: [...crossed, i].sort((x, y) => x - y) };
}

/** What a tap on cell `i` does in "do": place, remove, or (take-away) cross. */
export function tapTenFrameCell(s: TenFrameState, i: number): TenFrameState {
  const cells = tenFrameCells(s);
  if (cells[i] === null) return placeCounter(s, i);
  return s.takeAway ? crossOut(s, i) : removeCounter(s, i);
}

export function tenFrameLabel(s: TenFrameState): string {
  const cells = tenFrameCells(s);
  const a = cells.filter((c) => c === 'a').length;
  const b = cells.filter((c) => c === 'b').length;
  const crossed = (s.crossed ?? []).filter((i) => cells[i]).length;
  const frames = s.frames === 2 ? 'Two ten frames' : 'Ten frame';
  const parts: string[] = [];
  if (a + b === 0) parts.push('empty');
  else if (b === 0) parts.push(plural(a, 'counter'));
  else if (a === 0) parts.push(plural(b, 'counter'));
  else parts.push(`${a} and ${b} more, ${plural(a + b, 'counter')}`);
  if (crossed) parts.push(`${crossed} crossed out`);
  const waiting = s.tray ? s.tray.a + s.tray.b : 0;
  if (waiting) parts.push(`${waiting} waiting`);
  return `${frames}: ${parts.join(', ')}`;
}

// --- Number line -------------------------------------------------------------

/** How long one hop is: `jumps`, or 1. */
export function hopSize(s: NumberLineState): number {
  return s.jumps && s.jumps > 0 ? s.jumps : 1;
}

/** Where she is now: the last number landed on, else the start. */
export function hereOf(s: NumberLineState): number | null {
  return s.path.length ? s.path[s.path.length - 1] : s.start;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * A tap on the number `n`. The first tap sets the start (on a line of tens,
 * the nearest ten from `min`); every later tap hops, one hop at a time, to
 * the nearest number she can reach from where she is, adding each landing to
 * `path`. Tapping where she already is does nothing.
 */
export function tapNumberLine(s: NumberLineState, n: number): NumberLineState {
  const step = hopSize(s);
  if (s.start === null) {
    const start = clamp(s.min + Math.round((n - s.min) / step) * step, s.min, s.max);
    return { ...s, start, path: [] };
  }
  const here = hereOf(s)!;
  let k = Math.round((n - here) / step);
  // Never hop off the line.
  while (k > 0 && here + k * step > s.max) k--;
  while (k < 0 && here + k * step < s.min) k++;
  if (k === 0) return s;
  const dir = k > 0 ? 1 : -1;
  const landed: number[] = [];
  for (let j = 1; j <= Math.abs(k); j++) landed.push(here + dir * j * step);
  return { ...s, path: [...s.path, ...landed] };
}

/** One hop forward (+1) or back (−1), if it stays on the line. */
export function hop(s: NumberLineState, dir: 1 | -1): NumberLineState {
  const here = hereOf(s);
  if (here === null) return s;
  const to = here + dir * hopSize(s);
  if (to < s.min || to > s.max) return s;
  return { ...s, path: [...s.path, to] };
}

/**
 * Take back the last hop. With no hops left it clears the start, unless
 * `keepStart` (the lesson set the start, so it is not hers to take back).
 */
export function undoHop(s: NumberLineState, keepStart = false): NumberLineState {
  if (s.path.length) return { ...s, path: s.path.slice(0, -1) };
  if (s.start !== null && !keepStart) return { ...s, start: null };
  return s;
}

/** Each hop as from → to, in order. */
export function hopsOf(s: NumberLineState): { from: number; to: number }[] {
  if (s.start === null) return [];
  return s.path.map((to, i) => ({ from: i === 0 ? s.start! : s.path[i - 1], to }));
}

export interface LineWindow { lo: number; hi: number; step: number }

/**
 * The stretch of line to draw so the numbers stay readable: `room` is how
 * many tick marks fit across the width. If the whole line fits it is all
 * drawn; otherwise a window around the start and the hops (with two to spare
 * either side), at least `room` ticks wide where the line allows.
 * The tick step is `jumps` (0–100 by tens draws 11 ticks), else 1.
 */
export function numberLineWindow(s: NumberLineState, room: number): LineWindow {
  const step = hopSize(s);
  const ticks = Math.floor((s.max - s.min) / step) + 1;
  room = Math.max(5, Math.floor(room));
  if (ticks <= room) return { lo: s.min, hi: s.min + (ticks - 1) * step, step };
  const seen = [s.start, ...s.path].filter((n): n is number => n !== null);
  const toTick = (n: number) => Math.round((n - s.min) / step);
  const last = ticks - 1;
  let lo: number, hi: number;
  if (!seen.length) {
    lo = 0; hi = room - 1;
  } else {
    lo = Math.max(0, Math.min(...seen.map(toTick)) - 2);
    hi = Math.min(last, Math.max(...seen.map(toTick)) + 2);
    // The hops are wider than the room: keep where she is now in view.
    if (hi - lo + 1 > room) {
      const here = toTick(hereOf(s)!);
      hi = Math.min(last, here + 2);
      lo = Math.max(0, hi - room + 1);
    }
    while (hi - lo + 1 < room) {
      if (hi < last) hi++;
      if (hi - lo + 1 < room && lo > 0) lo--;
    }
  }
  return { lo: s.min + lo * step, hi: s.min + hi * step, step };
}

export function numberLineLabel(s: NumberLineState): string {
  const base = `Number line from ${s.min} to ${s.max}${s.jumps ? `, by ${s.jumps}s` : ''}`;
  if (s.start === null) return base;
  const hops = hopsOf(s);
  const fwd = hops.filter((h) => h.to > h.from).length;
  const back = hops.length - fwd;
  const bits = [`start on ${s.start}`];
  if (fwd) bits.push(`${plural(fwd, 'hop')} forward`);
  if (back) bits.push(`${plural(back, 'hop')} back`);
  if (hops.length) bits.push(`now on ${hereOf(s)}`);
  return `${base}: ${bits.join(', ')}`;
}

// --- Objects -------------------------------------------------------------------

/**
 * A tap on object `i` in "do": an uncounted one gets the next number; the last
 * one counted is un-counted (her undo). Crossed-out things are not counted.
 */
export function countObject(s: ObjectsState, i: number): ObjectsState {
  if (i < 0 || i >= s.count || s.crossed?.includes(i)) return s;
  const at = s.counted.indexOf(i);
  if (at === -1) return { ...s, counted: [...s.counted, i] };
  if (at === s.counted.length - 1) return { ...s, counted: s.counted.slice(0, -1) };
  return s;
}

/** A small seeded random number generator, so scattered pictures never move between renders. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where scattered things sit, as fractions (0–1) of a 4:3 box, the same
 * every time for the same count. Each is a cell of a loose grid nudged off
 * centre, so nothing overlaps and the heap still looks like a heap.
 */
export function scatterPositions(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  const rand = mulberry32(count * 7919 + 13);
  const cols = Math.max(2, Math.ceil(Math.sqrt(count * 4 / 3)));
  const rows = Math.ceil(count / cols) + (count > 3 ? 1 : 0);
  const cells = Array.from({ length: cols * rows }, (_, k) => k);
  // Shuffle the cells, then keep the first `count`.
  for (let k = cells.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [cells[k], cells[j]] = [cells[j], cells[k]];
  }
  return cells.slice(0, count).sort((p, q) => p - q).map((cell) => {
    const c = cell % cols, r = Math.floor(cell / cols);
    return {
      x: (c + 0.5 + (rand() - 0.5) * 0.45) / cols,
      y: (r + 0.5 + (rand() - 0.5) * 0.45) / rows,
    };
  });
}

export function objectsLabel(s: ObjectsState): string {
  const crossed = (s.crossed ?? []).filter((i) => i < s.count).length;
  const bits = [`${s.count} ${s.emoji}`];
  if (crossed) bits.push(`${crossed} crossed out`);
  if (s.counted.length) bits.push(`${s.counted.length} counted`);
  return bits.join(', ');
}

// --- Bond --------------------------------------------------------------------------

/** How many counters sit in the left part: `split`, else what the parts say, else all. */
export function bondSplit(s: BondState): number {
  const whole = s.whole ?? 0;
  if (s.split !== undefined) return clamp(s.split, 0, whole);
  if (s.parts[0] !== null) return clamp(s.parts[0], 0, whole);
  if (s.parts[1] !== null) return clamp(whole - s.parts[1], 0, whole);
  return whole;
}

/**
 * Move one counter out of part `from` (0 left, 1 right) into the other.
 * `split` and both `parts` move together, so the numbers always match the
 * counters she sees.
 */
export function moveSplit(s: BondState, from: 0 | 1): BondState {
  const whole = s.whole ?? 0;
  const split = bondSplit(s);
  const next = from === 0 ? split - 1 : split + 1;
  if (next < 0 || next > whole) return s;
  return { ...s, split: next, parts: [next, whole - next] };
}

export function bondLabel(s: BondState): string {
  const n = (v: number | null) => (v === null ? 'something' : String(v));
  if (s.counters && s.whole !== null) {
    const split = bondSplit(s);
    return `Number bond: ${s.whole} counters, ${split} and ${s.whole - split}`;
  }
  if (s.whole === null) return `Number bond: ${n(s.parts[0])} and ${n(s.parts[1])} make something`;
  return `Number bond: ${s.whole} is ${n(s.parts[0])} and ${n(s.parts[1])}`;
}

// --- Compare -------------------------------------------------------------------------

export function compareLabel(s: CompareState): string {
  const [a, b] = s.rows;
  const base = `${a.count} ${a.emoji} and ${b.count} ${b.emoji}`;
  if (!s.matched) return base;
  const extra = Math.abs(a.count - b.count);
  if (!extra) return `${base}, matched, the same`;
  return `${base}, matched, ${extra} extra ${a.count > b.count ? a.emoji : b.emoji}`;
}

// --- Text ------------------------------------------------------------------------------

export type TextPiece = { text: string; kind: 'plus' | 'minus' | 'plain' };

/**
 * Split text into runs so the signs can be coloured: + teal, − orange. A tone
 * of 'plus' or 'minus' colours only that sign; 'plain' colours nothing; no
 * tone colours both. A hyphen between spaces or numbers is shown as a true
 * minus sign (−), hyphens inside words are left alone.
 */
export function textPieces(text: string, tone?: TextState['tone']): TextPiece[] {
  const shown = text.replace(/(^|[\s\d?])-(?=[\s\d?]|$)/g, '$1−');
  const out: TextPiece[] = [];
  for (const part of shown.split(/([+−])/)) {
    if (!part) continue;
    let kind: TextPiece['kind'] = 'plain';
    if (part === '+' && tone !== 'plain' && tone !== 'minus') kind = 'plus';
    if (part === '−' && tone !== 'plain' && tone !== 'plus') kind = 'minus';
    out.push({ text: part, kind });
  }
  return out;
}

export function textLabel(s: TextState): string {
  return textPieces(s.text, 'plain').map((p) => p.text).join('')
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*−\s*/g, ' minus ')
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/\s+/g, ' ')
    .trim();
}

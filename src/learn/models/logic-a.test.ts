import { describe, expect, it } from 'vitest';
import {
  TenFrameState, NumberLineState, ObjectsState, BondState,
  tenFrameCells, placeCounter, removeCounter, crossOut, tapTenFrameCell, tenFrameLabel, nextTrayCounter,
  tapNumberLine, hop, undoHop, hereOf, hopsOf, numberLineWindow, numberLineLabel,
  countObject, scatterPositions, objectsLabel,
  bondSplit, moveSplit, bondLabel, compareLabel, textPieces, textLabel,
} from './logic-a';

const empty = (frames: 1 | 2 = 1): (null)[] => Array(frames * 10).fill(null);

describe('ten frame', () => {
  const tf = (over: Partial<TenFrameState> = {}): TenFrameState =>
    ({ model: 'tenFrame', frames: 1, cells: empty(), ...over });

  it('pads or cuts cells to frames × 10', () => {
    expect(tenFrameCells(tf({ cells: ['a'] }))).toHaveLength(10);
    expect(tenFrameCells(tf({ frames: 2, cells: ['a'] }))).toHaveLength(20);
    expect(tenFrameCells(tf({ cells: Array(14).fill('a') }))).toHaveLength(10);
  });

  it('places tray counters a first, then b, where they tap', () => {
    let s = tf({ tray: { a: 1, b: 1 } });
    s = placeCounter(s, 7);
    expect(s.cells[7]).toBe('a');
    expect(s.tray).toEqual({ a: 0, b: 1 });
    s = placeCounter(s, 0);
    expect(s.cells[0]).toBe('b');
    expect(s.tray).toEqual({ a: 0, b: 0 });
    // The tray is empty: nothing more to place.
    expect(placeCounter(s, 3)).toBe(s);
  });

  it('never places on a full cell', () => {
    const s = tf({ cells: ['a', ...empty().slice(1)], tray: { a: 2, b: 0 } });
    expect(placeCounter(s, 0)).toBe(s);
  });

  it('with no tray, supplies endless a counters (but not when taking away)', () => {
    expect(nextTrayCounter(tf())).toBe('a');
    const s = placeCounter(tf(), 4);
    expect(s.cells[4]).toBe('a');
    expect(s.tray).toBeUndefined();
    expect(nextTrayCounter(tf({ takeAway: true }))).toBeNull();
  });

  it('returns a tapped counter to the tray, in its own colour', () => {
    let s = tf({ cells: ['a', 'b', ...empty().slice(2)], tray: { a: 0, b: 0 }, crossed: [1] });
    s = removeCounter(s, 1);
    expect(s.cells[1]).toBeNull();
    expect(s.tray).toEqual({ a: 0, b: 1 });
    expect(s.crossed).toEqual([]);
    expect(removeCounter(s, 5)).toBe(s);
  });

  it('crosses out and un-crosses in take-away mode', () => {
    let s = tf({ cells: ['a', 'a', 'a', ...empty().slice(3)], takeAway: true });
    s = tapTenFrameCell(s, 2);
    expect(s.crossed).toEqual([2]);
    expect(s.cells[2]).toBe('a');
    s = tapTenFrameCell(s, 0);
    expect(s.crossed).toEqual([0, 2]);
    s = tapTenFrameCell(s, 2);
    expect(s.crossed).toEqual([0]);
    // An empty cell cannot be crossed, and nothing is placed.
    expect(tapTenFrameCell(s, 6)).toBe(s);
    expect(crossOut(s, 6)).toBe(s);
  });

  it('tap places on empty and removes when not taking away', () => {
    let s = tf({ tray: { a: 3, b: 0 } });
    s = tapTenFrameCell(s, 0);
    s = tapTenFrameCell(s, 1);
    expect(s.cells.filter(Boolean)).toHaveLength(2);
    s = tapTenFrameCell(s, 0);
    expect(s.cells[0]).toBeNull();
    expect(s.tray).toEqual({ a: 2, b: 0 });
  });

  it('describes itself', () => {
    expect(tenFrameLabel(tf())).toBe('Ten frame: empty');
    expect(tenFrameLabel(tf({ cells: ['a', 'a', 'a', 'a', 'a', 'a', 'a', null, null, null], crossed: [4, 5, 6] })))
      .toBe('Ten frame: 7 counters, 3 crossed out');
    expect(tenFrameLabel(tf({ frames: 2, cells: [...Array(8).fill('a'), 'b', 'b', 'b', 'b', 'b', ...empty().slice(13)] as TenFrameState['cells'] })))
      .toBe('Two ten frames: 8 and 5 more, 13 counters');
    expect(tenFrameLabel(tf({ tray: { a: 2, b: 1 } }))).toBe('Ten frame: empty, 3 waiting');
  });
});

describe('number line', () => {
  const nl = (over: Partial<NumberLineState> = {}): NumberLineState =>
    ({ model: 'numberLine', min: 0, max: 20, start: null, path: [], ...over });

  it('first tap sets the start, later taps hop one by one', () => {
    let s = tapNumberLine(nl(), 8);
    expect(s.start).toBe(8);
    expect(s.path).toEqual([]);
    s = tapNumberLine(s, 11);
    expect(s.path).toEqual([9, 10, 11]);
    s = tapNumberLine(s, 9);
    expect(s.path).toEqual([9, 10, 11, 10, 9]);
    expect(hereOf(s)).toBe(9);
    expect(tapNumberLine(s, 9)).toBe(s);
  });

  it('hops by jumps, landing on the nearest reachable number', () => {
    let s = nl({ max: 100, jumps: 10, start: 23 });
    s = tapNumberLine(s, 52);
    expect(s.path).toEqual([33, 43, 53]);
    // Never hops off the end.
    s = tapNumberLine(s, 100);
    expect(s.path[s.path.length - 1]).toBe(93);
    expect(hop(s, 1)).toBe(s);
  });

  it('snaps a first tap on a line of tens to a ten', () => {
    expect(tapNumberLine(nl({ max: 100, jumps: 10 }), 37).start).toBe(40);
  });

  it('hop buttons move one hop and stop at the ends', () => {
    let s = nl({ start: 1 });
    s = hop(s, -1);
    expect(s.path).toEqual([0]);
    expect(hop(s, -1)).toBe(s);
    expect(hop(nl(), 1)).toEqual(nl()); // no start yet: nothing to hop from
  });

  it('undo takes back hops, then the start unless it was given', () => {
    let s = nl({ start: 5, path: [6, 7] });
    s = undoHop(s);
    expect(s.path).toEqual([6]);
    s = undoHop(undoHop(s));
    expect(s.start).toBeNull();
    const given = nl({ start: 5 });
    expect(undoHop(given, true)).toBe(given);
  });

  it('lists hops with their direction', () => {
    expect(hopsOf(nl({ start: 3, path: [4, 3] }))).toEqual([{ from: 3, to: 4 }, { from: 4, to: 3 }]);
  });

  it('draws the whole line when it fits, else a window around the hops', () => {
    expect(numberLineWindow(nl(), 25)).toEqual({ lo: 0, hi: 20, step: 1 });
    expect(numberLineWindow(nl({ max: 100, jumps: 10 }), 12)).toEqual({ lo: 0, hi: 100, step: 10 });
    const w = numberLineWindow(nl({ start: 14, path: [13, 12, 11] }), 11);
    expect(w.hi - w.lo + 1).toBe(11);
    expect(w.lo).toBeLessThanOrEqual(9);
    expect(w.hi).toBeGreaterThanOrEqual(16);
    const end = numberLineWindow(nl({ start: 19 }), 11);
    expect(end).toEqual({ lo: 10, hi: 20, step: 1 });
    // 0–100 by ones on a phone: a window, never 101 ticks.
    const big = numberLineWindow(nl({ max: 100, start: 47, path: [48, 49] }), 11);
    expect(big.hi - big.lo).toBe(10);
    expect(big.lo).toBeLessThanOrEqual(45);
    expect(big.hi).toBeGreaterThanOrEqual(51);
  });

  it('keeps the start and all the hops in view while they fit', () => {
    const w = numberLineWindow(nl({ start: 14, path: [13, 12, 11, 10, 9, 8] }), 9);
    expect(w.lo).toBeLessThanOrEqual(8);
    expect(w.hi).toBeGreaterThanOrEqual(14);
    expect(w.hi - w.lo + 1).toBe(9);
  });

  it('keeps where they are in view when the hops outgrow the window', () => {
    const path = Array.from({ length: 15 }, (_, i) => 1 + i);
    const w = numberLineWindow(nl({ start: 0, path }), 11);
    expect(w.hi).toBeGreaterThanOrEqual(15);
    expect(w.lo).toBeLessThanOrEqual(15);
    expect(w.hi - w.lo + 1).toBe(11);
  });

  it('describes itself', () => {
    expect(numberLineLabel(nl({ start: 8, path: [9, 10, 11] })))
      .toBe('Number line from 0 to 20: start on 8, 3 hops forward, now on 11');
    expect(numberLineLabel(nl({ start: 5, path: [4] }))).toContain('1 hop back');
  });
});

describe('objects', () => {
  const ob = (over: Partial<ObjectsState> = {}): ObjectsState =>
    ({ model: 'objects', emoji: '🍎', count: 5, counted: [], ...over });

  it('counts in tap order, un-counts only the last', () => {
    let s = countObject(ob(), 3);
    s = countObject(s, 0);
    expect(s.counted).toEqual([3, 0]);
    expect(countObject(s, 3)).toBe(s);
    s = countObject(s, 0);
    expect(s.counted).toEqual([3]);
  });

  it('skips crossed-out things and taps off the end', () => {
    const s = ob({ crossed: [4] });
    expect(countObject(s, 4)).toBe(s);
    expect(countObject(s, 9)).toBe(s);
  });

  it('scatters the same way every time, inside the box, without overlapping', () => {
    for (const n of [1, 3, 7, 12, 20]) {
      const a = scatterPositions(n);
      expect(a).toEqual(scatterPositions(n));
      expect(a).toHaveLength(n);
      for (const p of a) {
        expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(1);
        expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(1);
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = Math.hypot((a[i].x - a[j].x) * 4, (a[i].y - a[j].y) * 3);
        expect(d).toBeGreaterThan(0.25);
      }
    }
  });

  it('describes itself', () => {
    expect(objectsLabel(ob({ count: 7, crossed: [5, 6], counted: [0, 1] }))).toBe('7 🍎, 2 crossed out, 2 counted');
  });
});

describe('bond', () => {
  const bd = (over: Partial<BondState> = {}): BondState =>
    ({ model: 'bond', whole: 7, parts: [null, null], counters: true, ...over });

  it('reads the split from split, then parts, then all in the left', () => {
    expect(bondSplit(bd({ split: 3 }))).toBe(3);
    expect(bondSplit(bd({ parts: [2, null] }))).toBe(2);
    expect(bondSplit(bd({ parts: [null, 2] }))).toBe(5);
    expect(bondSplit(bd())).toBe(7);
    expect(bondSplit(bd({ split: 12 }))).toBe(7);
  });

  it('moves one counter at a time and keeps parts in step', () => {
    let s = moveSplit(bd({ split: 7 }), 0);
    expect(s.split).toBe(6);
    expect(s.parts).toEqual([6, 1]);
    s = moveSplit(s, 1);
    expect(s.parts).toEqual([7, 0]);
    expect(moveSplit(s, 1)).toBe(s); // right part is empty
    const none = bd({ split: 0 });
    expect(moveSplit(none, 0)).toBe(none);
  });

  it('describes itself', () => {
    expect(bondLabel({ model: 'bond', whole: 10, parts: [6, null] })).toBe('Number bond: 10 is 6 and something');
    expect(bondLabel({ model: 'bond', whole: null, parts: [3, 4] })).toBe('Number bond: 3 and 4 make something');
    expect(bondLabel(bd({ split: 4 }))).toBe('Number bond: 7 counters, 4 and 3');
  });
});

describe('compare and text', () => {
  it('compare names the extras once matched', () => {
    expect(compareLabel({ model: 'compare', rows: [{ emoji: '🐶', count: 5 }, { emoji: '🦴', count: 3 }], matched: true }))
      .toBe('5 🐶 and 3 🦴, matched, 2 extra 🐶');
  });

  it('colours signs by tone and turns hyphens into minus signs', () => {
    expect(textPieces('8 + 5 = 13')).toEqual([
      { text: '8 ', kind: 'plain' }, { text: '+', kind: 'plus' }, { text: ' 5 = 13', kind: 'plain' },
    ]);
    expect(textPieces('9 - 4').map((p) => p.kind)).toEqual(['plain', 'minus', 'plain']);
    expect(textPieces('9 - 4', 'plus').map((p) => p.kind)).toEqual(['plain']);
    expect(textPieces('3 + 4 − 2', 'minus').map((p) => p.kind)).toEqual(['plain', 'minus', 'plain']);
    expect(textPieces('take-away', 'plain')).toEqual([{ text: 'take-away', kind: 'plain' }]);
    expect(textLabel({ model: 'text', text: '9 - 4 = 5' })).toBe('9 minus 4 equals 5');
  });
});

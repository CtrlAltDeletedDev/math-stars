import { describe, it, expect } from 'vitest';
import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { UNIT as stories } from './stories';
import { UNIT as tensOnes } from './tensOnes';
import { UNIT as length } from './length';
import { UNIT as graphs } from './graphs';
import { UNIT as time } from './time';
import { UNIT as shapes } from './shapes';
import { UNIT as money } from './money';

// The world units, answered a second time from scratch: every answer is
// worked out here from the picture or the numbers it was built from, never
// from the code that built it. course.test.ts checks the shape of every
// lesson; this checks the maths.

const N = 150;
type M<K extends ModelState['model']> = Extract<ModelState, { model: K }>;

function itemsOf(unit: Unit): Item[] {
  return unit.lessons.flatMap((l: Lesson) => {
    const gens = [l.practice, l.check, l.review].filter(Boolean) as (() => Item)[];
    const asked = l.teach.flatMap((s) => (s.type === 'ask' ? [s.item] : []));
    return [...asked, ...gens.flatMap((g) => Array.from({ length: N }, g))];
  });
}

const choicesOf = (i: Item): Choice[] => (typeof i.input === 'object' && 'choices' in i.input ? i.input.choices : []);
const rightChoice = (i: Item) => choicesOf(i).find((c) => c.value === i.answer)!;
const wrongChoices = (i: Item) => choicesOf(i).filter((c) => c.value !== i.answer);
const solutionOf = (i: Item) => (typeof i.input === 'object' && 'solution' in i.input ? i.input.solution : undefined);
const is = <K extends ModelState['model']>(m: ModelState | undefined, k: K): m is M<K> => m?.model === k;
const total = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** Solve "12 − 5 = ?", "9 + ? = 14", "? − 5 = 7": the number that goes in the box, or null if none does. */
function solve(sentence: string): number | null {
  const m = sentence.match(/^(\S+) ([+−]) (\S+) = (\S+)$/);
  if (!m) throw new Error(`not a sentence: ${sentence}`);
  const [, a, op, b, c] = m;
  const n = (s: string) => Number(s);
  let x: number;
  if (c === '?') x = op === '+' ? n(a) + n(b) : n(a) - n(b);
  else if (a === '?') x = op === '+' ? n(c) - n(b) : n(c) + n(b);
  else x = op === '+' ? n(c) - n(a) : n(a) - n(c);
  return x >= 0 ? x : null;
}

describe('story problems, solved from their numbers', () => {
  const items = itemsOf(stories);
  it('answers every story with the right operation on its two numbers', () => {
    for (const item of items) {
      const m = item.id.match(/^story-(put|join|take|rest|more|fewer)-(\d+)-(\d+)(-eq)?$/);
      expect(m, item.id).toBeTruthy();
      const [, kind, xs, ys, eq] = m!;
      const x = Number(xs), y = Number(ys);
      const want = kind === 'put' || kind === 'join' ? x + y : x - y;
      expect(want, item.id).toBeGreaterThan(0);
      expect(want, item.id).toBeLessThanOrEqual(20);
      // Both numbers are spoken, and so is the question.
      expect(item.say, item.id).toMatch(new RegExp(`\\b${x}\\b`));
      expect(item.say, item.id).toMatch(new RegExp(`\\b${y}\\b`));
      expect(item.say, item.id).toMatch(/\?$/);
      if (eq) {
        // Exactly one sentence solves to the story's answer, and it is the right one.
        const solving = choicesOf(item).filter((c) => solve(c.value) === want);
        expect(solving.map((c) => c.value), item.id).toEqual([item.answer]);
      } else {
        expect(Number(item.answer), item.id).toBe(want);
      }
    }
  });

  it('never offers "the only one with a minus" as a giveaway', () => {
    for (const item of items.filter((i) => i.id.endsWith('-eq'))) {
      if (!item.answer.includes('−')) continue;
      expect(wrongChoices(item).some((c) => c.value.includes('−')), item.id).toBe(true);
    }
  });
});

describe('tens and ones, counted from the blocks', () => {
  const items = itemsOf(tensOnes);
  it('reads every pictured number from its blocks', () => {
    for (const item of items) {
      if (is(item.figure, 'blocks')) expect(Number(item.answer), item.id).toBe(item.figure.tens * 10 + item.figure.ones);
      const sol = solutionOf(item);
      if (is(sol, 'blocks')) {
        expect(sol.tens * 10 + sol.ones, item.id).toBe(Number(item.answer));
        expect(sol.ones, item.id).toBeLessThan(10);
      }
    }
  });

  it('works out every sum and every next number', () => {
    for (const item of items) {
      const sum = item.prompt.match(/^(\d+) ([+−]) (\d+) = \?$/);
      if (sum) {
        expect(Number(item.answer), item.id).toBe(solve(item.prompt));
        // First grade adds and takes away tens within 100.
        for (const n of [sum[1], sum[3], item.answer]) expect(Number(n), item.id).toBeLessThan(100);
      }
      const seq = item.prompt.match(/^(\d+), (\d+), (\d+), \?$/);
      if (seq) expect(Number(item.answer), item.id).toBe(2 * Number(seq[3]) - Number(seq[2]));
    }
  });

  it('compares by value, and the digits swapped are offered when they differ', () => {
    for (const item of items) {
      const sign = item.prompt.match(/^(\d+) ◯ (\d+)$/);
      if (sign) {
        const [a, b] = [Number(sign[1]), Number(sign[2])];
        expect(item.answer, item.id).toBe(a > b ? '>' : a < b ? '<' : '=');
      }
      if (/^Which is (more|less)\?$/.test(item.prompt)) {
        const vals = choicesOf(item).map((c) => Number(c.value));
        expect(Number(item.answer), item.id).toBe(item.prompt.includes('more') ? Math.max(...vals) : Math.min(...vals));
        for (const c of choicesOf(item)) if (is(c.model, 'blocks')) expect(c.model.tens * 10 + c.model.ones).toBe(Number(c.value));
      }
      const words = item.prompt.match(/^(\d+) tens? and (\d+) ones?$/);
      if (words) {
        expect(Number(item.answer), item.id).toBe(Number(words[1]) * 10 + Number(words[2]));
        if (words[1] !== words[2]) expect(choicesOf(item).map((c) => c.value), item.id).toContain(`${words[2]}${words[1]}`);
      }
    }
  });
});

describe('clocks, read from the hands', () => {
  const items = itemsOf(time);
  const label = (c: M<'clock'>) => `${c.hour}:${String(c.minute).padStart(2, '0')}`;
  it('answers each clock with the time its hands show', () => {
    for (const item of items) {
      if (is(item.figure, 'clock')) {
        expect(item.figure.minute === 0 || item.figure.minute === 30, item.id).toBe(true);
        if (item.input === 'number') expect(item.answer, item.id).toBe(String(item.figure.hour));
        else expect(item.answer, item.id).toBe(label(item.figure));
      }
      const sol = solutionOf(item);
      if (is(sol, 'clock')) expect(label(sol), item.id).toBe(item.answer);
      // "Which clock shows 3:30?": the right clock shows it, and no other clock does.
      const asked = item.prompt.match(/^Which clock shows (\d+:\d\d)\?$/);
      if (asked) {
        const right = rightChoice(item).model;
        expect(is(right, 'clock') && label(right), item.id).toBe(asked[1]);
        for (const c of wrongChoices(item)) expect(is(c.model, 'clock') && label(c.model), item.id).not.toBe(asked[1]);
      }
    }
  });

  it('offers the hands read the wrong way round, or the hour off by one', () => {
    for (const item of items.filter((i) => is(i.figure, 'clock') && i.input !== 'number')) {
      const c = item.figure as M<'clock'>;
      const next = (c.hour % 12) + 1;
      const plausible = choicesOf(item).some((x) => x.value === `${next}:${String(c.minute).padStart(2, '0')}` || x.value.startsWith('12:') || x.value.startsWith('6:'));
      expect(plausible, item.id).toBe(true);
    }
  });
});

describe('coins, counted in cents', () => {
  const items = itemsOf(money);
  const VALUE: Record<string, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
  const cents = (s: string) => Number(s.replace('¢', ''));
  it('totals every pictured handful', () => {
    for (const item of items) {
      if (!is(item.figure, 'coins')) continue;
      const tray = item.figure.tray;
      for (const v of tray) expect([1, 5, 10, 25]).toContain(v);
      if (item.prompt === 'How many cents?') {
        expect(cents(item.answer), item.id).toBe(total(tray));
        // Counting every coin as one cent is the wrong answer offered below the right one.
        const below = choicesOf(item).map((c) => cents(c.value)).filter((v) => v < cents(item.answer));
        if (below.length && tray.some((v) => v > 1)) expect(below, item.id).toContain(tray.length);
      }
      if (item.prompt === 'Which coin?') expect(VALUE[item.answer], item.id).toBe(tray[0]);
      if (/is worth\?$/.test(item.prompt)) expect(cents(item.answer), item.id).toBe(tray[0]);
      if (item.prompt === 'Same as 25¢?') {
        expect(total((rightChoice(item).model as M<'coins'>).tray), item.id).toBe(25);
        for (const c of wrongChoices(item)) expect(total((c.model as M<'coins'>).tray), item.id).not.toBe(25);
      }
    }
  });

  it('makes every amount it asks for, and the richer purse wins', () => {
    for (const item of items) {
      const sol = solutionOf(item);
      if (is(sol, 'coins')) expect(total(sol.tray), item.id).toBe(cents(item.answer));
      if (item.prompt === 'Who has more money?') {
        const right = total((rightChoice(item).model as M<'coins'>).tray);
        for (const c of wrongChoices(item)) expect(right, item.id).toBeGreaterThan(total((c.model as M<'coins'>).tray));
      }
    }
  });
});

describe('length, measured from the picture', () => {
  const items = itemsOf(length);
  it('counts the cubes, compares by length, and subtracts the difference', () => {
    for (const item of items) {
      if (is(item.figure, 'measure')) {
        expect(item.figure.gaps, item.id).toBeFalsy();
        expect(item.figure.placed, item.id).toBe(item.figure.length);
        expect(Number(item.answer), item.id).toBe(item.figure.length);
      }
      const which = item.prompt.match(/^Which is (longer|shorter|longest|shortest)\?$/);
      if (which) {
        const ls = choicesOf(item).map((c) => (c.model as M<'measure'>).length);
        const want = /long/.test(which[1]) ? Math.max(...ls) : Math.min(...ls);
        expect((rightChoice(item).model as M<'measure'>).length, item.id).toBe(want);
        expect(ls.filter((l) => l === want), item.id).toHaveLength(1);
      }
      const diff = item.prompt.match(/ (\d+) cubes, \S+ (\d+) cubes\. How many (longer|shorter)\?$/);
      if (diff) expect(Number(item.answer), item.id).toBe(Number(diff[1]) - Number(diff[2]));
      if (item.prompt === 'Which is measured right?') expect((rightChoice(item).model as M<'measure'>).gaps, item.id).toBeFalsy();
    }
  });
});

describe('graphs, read from the rows', () => {
  const items = itemsOf(graphs);
  it('answers from the rows the graph shows', () => {
    for (const item of items) {
      const sol = solutionOf(item);
      if (is(sol, 'graph')) expect(sol.rows.map((r) => r.count).join(','), item.id).toBe(item.answer);
      if (!is(item.figure, 'graph')) continue;
      const rows = item.figure.rows;
      const count = (emoji: string) => rows.find((r) => r.emoji === emoji)!.count;
      let m: RegExpMatchArray | null;
      if (item.prompt === 'How many in all?') expect(Number(item.answer), item.id).toBe(total(rows.map((r) => r.count)));
      else if ((m = item.prompt.match(/^How many more (\S+) than (\S+)\?$/))) expect(Number(item.answer), item.id).toBe(count(m[1]) - count(m[2]));
      else if ((m = item.prompt.match(/^How many fewer (\S+) than (\S+)\?$/))) expect(Number(item.answer), item.id).toBe(count(m[2]) - count(m[1]));
      else if ((m = item.prompt.match(/^How many (\S+)\?$/))) expect(Number(item.answer), item.id).toBe(count(m[1]));
      else if ((m = item.prompt.match(/^Which has the (most|fewest)\?$/))) {
        const counts = rows.map((r) => r.count);
        const want = m[1] === 'most' ? Math.max(...counts) : Math.min(...counts);
        expect(rows.find((r) => r.label === item.answer)!.count, item.id).toBe(want);
        expect(counts.filter((c) => c === want), item.id).toHaveLength(1);
      } else throw new Error(`unchecked graph question: ${item.prompt}`);
    }
  });
});

describe('shapes and fractions, from the figure', () => {
  const items = itemsOf(shapes);
  const SIDES: Record<string, number> = { circle: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6, trapezoid: 4, rhombus: 4 };
  it('counts sides and corners, and names the shape shown', () => {
    for (const item of items) {
      if (is(item.figure, 'shapes')) {
        const s = item.figure.items[0];
        if (/^How many (sides|corners)\?$/.test(item.prompt)) expect(Number(item.answer), item.id).toBe(SIDES[s]);
        if (item.prompt === 'What shape is this?') expect(item.answer, item.id).toBe(s);
      }
      const sort = item.prompt.match(/^Tap all with (3|4|6) sides$/);
      const sol = solutionOf(item);
      if (sort && is(sol, 'shapes')) {
        const want = sol.items.flatMap((s, i) => (SIDES[s] === Number(sort[1]) ? [i] : []));
        expect([...sol.picked].sort(), item.id).toEqual(want.sort());
      }
    }
  });

  it('names the shaded part from its parts', () => {
    for (const item of items) {
      if (!is(item.figure, 'fraction')) continue;
      const shaded = item.figure.shaded.filter(Boolean).length;
      const want = shaded === item.figure.parts ? 'the whole' : item.figure.parts === 2 ? 'one half' : 'one fourth';
      expect(shaded, item.id).toBeGreaterThan(0);
      expect(item.answer, item.id).toBe(want);
    }
    for (const item of items.filter((i) => i.prompt === 'Which shows halves?' || i.prompt === 'Which shows one half?')) {
      const f = rightChoice(item).model as M<'fraction'>;
      expect(f.parts, item.id).toBe(2);
      expect(f.unequal, item.id).toBeFalsy();
      for (const c of wrongChoices(item)) {
        const w = c.model as M<'fraction'>;
        const alsoHalf = w.parts === 2 && !w.unequal && (item.prompt === 'Which shows halves?' || w.shaded.filter(Boolean).length === 1);
        expect(alsoHalf, item.id).toBe(false);
      }
    }
  });
});

describe('the world units', () => {
  const PRONOUN = /\b(he|she|him|his|hers|herself|himself)\b/i;
  it('never use a pronoun for a person, even in what a choice says', () => {
    for (const unit of [stories, tensOnes, length, graphs, time, shapes, money]) {
      for (const item of itemsOf(unit)) {
        for (const text of [item.say, item.prompt, item.hint ?? '', ...choicesOf(item).flatMap((c) => [c.label, c.say ?? ''])]) {
          expect(text, item.id).not.toMatch(PRONOUN);
        }
      }
    }
  });

  it('keep the same words for the same item id, so review brings back the same question', () => {
    for (const unit of [stories, tensOnes, length, graphs, time, shapes, money]) {
      const seen = new Map<string, string>();
      for (const item of itemsOf(unit)) {
        const key = `${item.say}|${item.prompt}|${item.answer}`;
        const before = seen.get(item.id);
        if (before !== undefined) expect(key, item.id).toBe(before);
        seen.set(item.id, key);
      }
    }
  });
});

// --- Every do task, replayed through the models' own tap logic -------------------

import { tapNumberLine, tapTenFrameCell, tenFrameCells, bondSplit, moveSplit } from '../models/logic-a';
import {
  addTen, addOne, removeTen, removeOne, trade, stepHour, stepMinute, setHourFromAngle, addCoin, removeCoin,
  toggleShade, togglePick, placeUnit, removeUnit, addToRow, removeFromRow,
} from '../models/logic-b';

/** Keys sorted, so two states compare by content. */
const stable = (v: unknown): string => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));

/** Breadth-first over the taps a model allows, until the target state is reached. */
function search<S>(from: S, to: S, moves: (s: S) => S[], limit = 5000): boolean {
  const want = stable(to);
  const seen = new Set([stable(from)]);
  let frontier = [from];
  while (frontier.length && seen.size < limit) {
    if (frontier.some((s) => stable(s) === want)) return true;
    const next: S[] = [];
    for (const s of frontier) for (const m of moves(s)) { const k = stable(m); if (!seen.has(k)) { seen.add(k); next.push(m); } }
    frontier = next;
  }
  return frontier.some((s) => stable(s) === want);
}

/** null when her taps can turn `from` into exactly `to`; otherwise why not. */
function reach(from: ModelState, to: ModelState): string | null {
  if (from.model !== to.model) return 'model changed';
  switch (from.model) {
    case 'tenFrame': {
      const t = to as M<'tenFrame'>;
      let s = from;
      const want = tenFrameCells(t);
      for (const colour of ['a', 'b'] as const) for (const [i, c] of want.entries()) if (c === colour && tenFrameCells(s)[i] === null) s = tapTenFrameCell(s, i);
      for (const i of t.crossed ?? []) if (!(s.crossed ?? []).includes(i)) s = tapTenFrameCell(s, i);
      return stable({ ...s, crossed: [...(s.crossed ?? [])].sort() }) === stable({ ...t, crossed: [...(t.crossed ?? [])].sort() }) ? null : `got ${stable(s)}`;
    }
    case 'numberLine': {
      const t = to as M<'numberLine'>;
      let s = from;
      if (s.start === null && t.start !== null) s = tapNumberLine(s, t.start);
      for (const p of t.path) s = tapNumberLine(s, p);
      return stable(s) === stable(t) ? null : `got start ${s.start}, path ${s.path}`;
    }
    case 'bond': {
      let s = from;
      for (let g = 0; g < 40 && bondSplit(s) !== (to as M<'bond'>).split; g++) s = moveSplit(s, bondSplit(s) > (to as M<'bond'>).split! ? 0 : 1);
      return stable(s) === stable(to) ? null : `got ${stable(s)}`;
    }
    case 'blocks':
      return search(from, to as M<'blocks'>, (s) => [addTen(s), addOne(s), removeTen(s), removeOne(s), trade(s)]) ? null : 'blocks not reachable';
    case 'clock':
      return search(from, to as M<'clock'>, (s) => [stepHour(s, 1), stepHour(s, -1), stepMinute(s, 1), stepMinute(s, -1), ...Array.from({ length: 12 }, (_, h) => setHourFromAngle(s, h * 30))]) ? null : 'clock not reachable';
    case 'coins': {
      let s = from;
      while (s.tray.length) s = removeCoin(s, 0);
      for (const v of (to as M<'coins'>).tray) { if (!(s.bank ?? []).includes(v)) return `no ${v} in the bank`; s = addCoin(s, v); }
      return stable(s) === stable(to) ? null : `got ${stable(s)}`;
    }
    case 'fraction': {
      let s = from;
      (to as M<'fraction'>).shaded.forEach((on, i) => { if (!!s.shaded[i] !== on) s = toggleShade(s, i); });
      return stable(s) === stable(to) ? null : `got ${stable(s)}`;
    }
    case 'shapes': {
      let s = from;
      const t = to as M<'shapes'>;
      for (const i of new Set([...s.picked, ...t.picked])) if (s.picked.includes(i) !== t.picked.includes(i)) s = togglePick(s, i);
      return stable(s) === stable(t) ? null : `got ${stable(s)}`;
    }
    case 'measure': {
      let s = from;
      for (let g = 0; g < 40 && s.placed !== (to as M<'measure'>).placed; g++) s = s.placed < (to as M<'measure'>).placed ? placeUnit(s) : removeUnit(s);
      return stable(s) === stable(to) ? null : `got ${stable(s)}`;
    }
    case 'graph': {
      let s = from;
      (to as M<'graph'>).rows.forEach((r, i) => { for (let g = 0; g < 40 && s.rows[i].count !== r.count; g++) s = s.rows[i].count < r.count ? addToRow(s, i) : removeFromRow(s, i); });
      return stable(s) === stable(to) ? null : `got ${stable(s)}`;
    }
    default:
      return `she cannot change a ${from.model}`;
  }
}

const WORLD = [stories, tensOnes, length, graphs, time, shapes, money];
const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

describe('the world lessons, step by step', () => {
  for (const unit of WORLD) {
    for (const lesson of unit.lessons) {
      it(`${lesson.id}: 3-6 shows, 2-4 dos, at most one ask, short lines`, () => {
        const count = (t: string) => lesson.teach.filter((s) => s.type === t).length;
        expect(count('show'), lesson.id).toBeGreaterThanOrEqual(3);
        expect(count('show'), lesson.id).toBeLessThanOrEqual(6);
        expect(count('do'), lesson.id).toBeGreaterThanOrEqual(2);
        expect(count('do'), lesson.id).toBeLessThanOrEqual(4);
        expect(count('ask'), lesson.id).toBeLessThanOrEqual(1);
        for (const s of lesson.teach) {
          if (s.type === 'ask') continue;
          expect(words(s.say), s.say).toBeLessThanOrEqual(20);
          if (s.caption) expect(words(s.caption), s.caption).toBeLessThanOrEqual(8);
          if (s.type === 'do') expect(words(s.then), s.then).toBeLessThanOrEqual(20);
        }
      });

      it(`${lesson.id}: every do task and every model question can be done by tapping`, () => {
        for (const s of lesson.teach) if (s.type === 'do') expect(reach(s.model, s.solution), s.say).toBeNull();
        for (const g of [lesson.practice, lesson.check].filter(Boolean) as (() => Item)[]) {
          for (let k = 0; k < 40; k++) {
            const item = g();
            if (typeof item.input === 'object' && 'model' in item.input) expect(reach(item.input.model, item.input.solution), item.id).toBeNull();
          }
        }
      });
    }
  }
});

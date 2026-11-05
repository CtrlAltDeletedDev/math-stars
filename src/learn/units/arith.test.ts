import { describe, it, expect } from 'vitest';
import { STAGES } from '@/core/stages';
import { Item, Lesson, ModelState, TeachStep } from '../types';
import { UNIT as numbers } from './numbers';
import { UNIT as add10 } from './add10';
import { UNIT as sub10 } from './sub10';
import { UNIT as within20 } from './within20';
import { crossedCount, placed, topRow, bottomRow } from './helpers-arith';
import { bondSplit, countObject, moveSplit, tapNumberLine, tapTenFrameCell, tenFrameCells } from '../models/logic-a';

// The arithmetic units, checked harder than the course harness does: every
// answer is worked out again from the question alone, every "do" solution must
// be reachable by their taps from the starting state, and every spoken line is
// short enough to follow by ear.

const UNITS = [numbers, add10, sub10, within20];
const SAMPLES = 150;

function itemsOf(lesson: Lesson): { item: Item; inCheck: boolean }[] {
  const asked = lesson.teach.filter((s): s is Extract<TeachStep, { type: 'ask' }> => s.type === 'ask').map((s) => ({ item: s.item, inCheck: false }));
  const gen = (g: (() => Item) | undefined, inCheck: boolean) => (g ? Array.from({ length: SAMPLES }, () => ({ item: g(), inCheck })) : []);
  return [...asked, ...gen(lesson.practice, false), ...gen(lesson.check, true), ...gen(lesson.review, true)];
}

/** How many things a figure or picture shows, for "How many?". */
function countIn(m: ModelState | undefined): number | null {
  if (!m) return null;
  if (m.model === 'objects') return m.count;
  if (m.model === 'tenFrame') return placed(m) - crossedCount(m);
  return null;
}

/** The answer to a number question, from its prompt (and figure) alone. */
function solve(item: Item): number | null {
  const p = item.prompt;
  let m: RegExpMatchArray | null;
  const n = (i: number) => Number(m![i]);
  if ((m = p.match(/^(\d+) \+ (\d+) = \?$/))) return n(1) + n(2);
  if ((m = p.match(/^(\d+) − (\d+) = \?$/))) return n(1) - n(2);
  if ((m = p.match(/^(\d+) \+ \? = (\d+)$/))) return n(2) - n(1);
  if ((m = p.match(/^\? \+ (\d+) = (\d+)$/))) return n(2) - n(1);
  if ((m = p.match(/^(\d+) − \? = (\d+)$/))) return n(1) - n(2);
  if ((m = p.match(/^(\d+) \+ (\d+) = (\d+) \+ \?$/))) return n(1) + n(2) - n(3);
  if ((m = p.match(/^(\d+) = 10 \+ \?$/))) return n(1) - 10;
  if ((m = p.match(/^1 more than (\d+) = \?$/))) return n(1) + 1;
  if ((m = p.match(/^1 less than (\d+) = \?$/))) return n(1) - 1;
  if ((m = p.match(/^(\d+), (\d+), (\d+), \?$/))) return n(3) + (n(3) - n(2));
  if ((m = p.match(/^(\d+), \?, (\d+)$/))) return (n(1) + n(2)) / 2;
  if ((m = p.match(/^(\d+) is \? more than (\d+)$/))) {
    const f = item.figure;
    if (f?.model === 'compare') expect([f.rows[0].count, f.rows[1].count].sort()).toEqual([n(1), n(2)].sort());
    return n(1) - n(2);
  }
  if (p === 'How many?') return countIn(item.figure);
  return null;
}

/** Is "a + b = c" / "a − b = c" true? */
function trueSentence(s: string): boolean | null {
  const m = s.match(/^(\d+) ([+−]) (\d+) = (\d+)$/);
  if (!m) return null;
  const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[4])];
  return (m[2] === '+' ? a + b : a - b) === c;
}

/** Re-derive the right choice from the question, for every kind of choice item these units ask. */
function rightChoice(item: Item): string | null {
  if (typeof item.input !== 'object' || !('choices' in item.input)) return null;
  const choices = item.input.choices;
  const id = item.id;
  if (id.startsWith('tf-')) return trueSentence(item.prompt) ? 'yes' : 'no';
  if (id.startsWith('which-frame-') || id.startsWith('which-has-')) {
    const want = Number(item.prompt.match(/(\d+)/)![1]);
    const hits = choices.filter((c) => countIn(c.model) === want);
    expect(hits, id).toHaveLength(1);
    return hits[0].value;
  }
  if (id.startsWith('which-sum-')) {
    const [a, b] = item.prompt.split(' + ').map(Number);
    const hits = choices.filter((c) => c.model?.model === 'tenFrame'
      && c.model.cells.filter((x) => x === 'a').length === a && c.model.cells.filter((x) => x === 'b').length === b);
    expect(hits, id).toHaveLength(1);
    return hits[0].value;
  }
  if (id.startsWith('which-double-')) {
    const hits = choices.filter((c) => c.model?.model === 'tenFrame' && topRow(c.model) === bottomRow(c.model));
    expect(hits, id).toHaveLength(1);
    return hits[0].value;
  }
  if (id.startsWith('turn-')) {
    const [a, b] = item.prompt.match(/^(\d+) \+ (\d+)/)!.slice(1).map(Number);
    const same = choices.filter((c) => {
      const m = c.value.match(/^(\d+) \+ (\d+)$/);
      return m && Number(m[1]) + Number(m[2]) === a + b && new Set([m[1], m[2]].map(Number)).has(a) && new Set([m[1], m[2]].map(Number)).has(b);
    });
    expect(same, id).toHaveLength(1);
    return same[0].value;
  }
  if (id.startsWith('family-')) {
    const m = item.prompt.match(/^(\d+) \+ (\d+) = (\d+)/)!;
    const fam = [m[1], m[2], m[3]].map(Number).sort((x, y) => x - y);
    const inFamily = choices.filter((c) => {
      const nums = (c.value.match(/\d+/g) ?? []).map(Number).sort((x, y) => x - y);
      return trueSentence(c.value) === true && nums.join() === fam.join();
    });
    expect(inFamily, id).toHaveLength(1);
    return inFamily[0].value;
  }
  if (/^(more|fewer)-\d+-\d+$/.test(id)) {
    const nums = choices.map((c) => Number(c.value));
    return String(id.startsWith('more') ? Math.max(...nums) : Math.min(...nums));
  }
  return null;
}

/**
 * Replay their taps through the models' own logic (models/logic-a.ts) and check
 * they land exactly on the solution: removals, then placements (the tray gives
 * its first colour first), crosses, hops, counting taps, bond moves.
 */
function reachable(from: ModelState, to: ModelState): string | null {
  if (from.model === 'tenFrame' && to.model === 'tenFrame') {
    if (from.frames !== to.frames || !!from.takeAway !== !!to.takeAway) return 'frame changed';
    const want = tenFrameCells(to);
    let s = from;
    for (const [i, c] of tenFrameCells(from).entries()) if (c && c !== want[i] && !from.takeAway) s = tapTenFrameCell(s, i);
    for (const colour of ['a', 'b'] as const) {
      for (const [i, c] of want.entries()) if (c === colour && tenFrameCells(s)[i] === null) s = tapTenFrameCell(s, i);
    }
    const crossedNow = new Set(s.crossed ?? []);
    const crossedWant = new Set(to.crossed ?? []);
    for (const i of new Set([...crossedNow, ...crossedWant])) if (crossedNow.has(i) !== crossedWant.has(i)) s = tapTenFrameCell(s, i);
    if (JSON.stringify(tenFrameCells(s)) !== JSON.stringify(want)) return `cells: got ${JSON.stringify(tenFrameCells(s))}`;
    const sortNums = (xs?: number[]) => [...(xs ?? [])].sort((x, y) => x - y).join();
    if (sortNums(s.crossed) !== sortNums(to.crossed)) return `crossed: got ${sortNums(s.crossed)}`;
    if (JSON.stringify(s.tray ?? null) !== JSON.stringify(to.tray ?? null)) return `tray: got ${JSON.stringify(s.tray)}`;
    return null;
  }
  if (from.model === 'numberLine' && to.model === 'numberLine') {
    if (from.min !== to.min || from.max !== to.max) return 'line changed';
    if (to.start === null) return 'no start';
    let s = from;
    if (s.start === null) s = tapNumberLine(s, to.start);
    if (from.path.some((p, i) => to.path[i] !== p)) return 'earlier hops undone';
    for (const p of to.path.slice(from.path.length)) s = tapNumberLine(s, p);
    if (s.start !== to.start || s.path.join() !== to.path.join()) return `got start ${s.start}, path ${s.path}`;
    return null;
  }
  if (from.model === 'objects' && to.model === 'objects') {
    if (from.count !== to.count || from.emoji !== to.emoji) return 'objects changed';
    let s = from;
    for (const i of to.counted.slice(from.counted.length)) s = countObject(s, i);
    return s.counted.join() === to.counted.join() ? null : `counted: got ${s.counted}`;
  }
  if (from.model === 'bond' && to.model === 'bond') {
    if (from.whole !== to.whole || !from.counters || to.split === undefined) return 'bond changed, or has no counters to move';
    let s = from;
    for (let guard = 0; bondSplit(s) !== to.split && guard < 50; guard++) s = moveSplit(s, bondSplit(s) > to.split ? 0 : 1);
    if (s.split !== to.split) return `split: got ${s.split}`;
    if (to.parts.some((p, i) => p !== null && p !== s.parts[i])) return `parts: got ${s.parts}`;
    return null;
  }
  return `cannot move a ${from.model}`;
}

const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

describe('arithmetic units', () => {
  it('each have 5 to 7 lessons', () => {
    for (const u of UNITS) expect(u.lessons.length, u.id).toBeGreaterThanOrEqual(5);
    for (const u of UNITS) expect(u.lessons.length, u.id).toBeLessThanOrEqual(7);
  });

  for (const unit of UNITS) {
    for (const lesson of unit.lessons) {
      describe(`${unit.id} / ${lesson.id}`, () => {
        it('teaches with 3-6 show steps, 2-4 do steps and at most one ask', () => {
          const count = (t: TeachStep['type']) => lesson.teach.filter((s) => s.type === t).length;
          expect(count('show')).toBeGreaterThanOrEqual(3);
          expect(count('show')).toBeLessThanOrEqual(6);
          expect(count('do')).toBeGreaterThanOrEqual(2);
          expect(count('do')).toBeLessThanOrEqual(4);
          expect(count('ask')).toBeLessThanOrEqual(1);
        });

        it('says short things: 20 words or fewer, captions a few words', () => {
          for (const s of lesson.teach) {
            if (s.type === 'ask') continue;
            expect(words(s.say), s.say).toBeLessThanOrEqual(20);
            if (s.caption) expect(words(s.caption), s.caption).toBeLessThanOrEqual(8);
            if (s.type === 'do') expect(words(s.then), s.then).toBeLessThanOrEqual(20);
          }
        });

        it('has do solutions they can reach by tapping, and hints for where they are', () => {
          for (const s of lesson.teach) {
            if (s.type !== 'do') continue;
            expect(reachable(s.model, s.solution), s.say).toBeNull();
            const hint = typeof s.hint === 'string' ? s.hint : s.hint(s.model);
            expect(hint.length, s.say).toBeGreaterThan(0);
            if (typeof s.hint === 'function') expect(s.hint(s.solution).length).toBeGreaterThan(0);
          }
        });

        it('answers every question correctly, worked out from the question alone', () => {
          for (const { item } of itemsOf(lesson)) {
            const where = `${item.id}: ${item.prompt}`;
            if (item.input === 'number') {
              const solved = solve(item);
              expect(solved, `${where}: no independent solver for this prompt`).not.toBeNull();
              expect(String(solved), where).toBe(item.answer);
            } else if ('choices' in item.input) {
              const right = rightChoice(item);
              expect(right, `${where}: no independent solver for this choice item`).not.toBeNull();
              expect(right, where).toBe(item.answer);
            }
          }
        });

        it('uses fact ids that match the sum shown', () => {
          for (const { item } of itemsOf(lesson)) {
            const add = item.id.match(/^add-(\d+)\+(\d+)$/);
            const sub = item.id.match(/^sub-(\d+)-(\d+)$/);
            if (add) expect(item.prompt).toBe(`${add[1]} + ${add[2]} = ?`);
            if (sub) expect(item.prompt).toBe(`${sub[1]} − ${sub[2]} = ?`);
            if (/^(add|sub)-/.test(item.id)) expect(item.input).toBe('number');
          }
        });

        it('checks with no picture, and every question has a hint that does not name its answer', () => {
          for (const { item, inCheck } of itemsOf(lesson)) {
            if (inCheck) expect(item.picture, `${item.id} in the check`).toBeUndefined();
            expect(item.hint, item.id).toBeTruthy();
            if (item.input !== 'number') continue;
            // Stricter than the course harness: "equals", "are" and "left" too.
            const states = new RegExp(`(=|\\bis|\\bmakes?|\\bequals|\\bare|\\bleft)\\s*${item.answer}(?!\\d)`, 'i');
            if (new RegExp(`(^|[^\\d])${item.answer}([^\\d]|$)`).test(item.prompt)) continue;
            expect(item.hint, `${item.id}: ${item.hint}`).not.toMatch(states);
          }
        });

        it('hides the answer from picture-choice labels', () => {
          for (const { item } of itemsOf(lesson)) {
            if (typeof item.input !== 'object' || !('choices' in item.input)) continue;
            for (const c of item.input.choices) if (c.model) expect(c.label ?? '', item.id).toBe('');
          }
        });

        if (lesson.placedBy) {
          it('is placed by a real stage', () => {
            const placed = lesson.placedBy!;
            for (const { track, stage } of Array.isArray(placed) ? placed : [placed]) {
              expect(STAGES[track][stage], `${track} ${stage}`).toBeDefined();
            }
          });
        }
      });
    }
  }
});

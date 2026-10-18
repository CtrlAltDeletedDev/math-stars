import { describe, it, expect } from 'vitest';
import { Question } from '@/types';
import { generateCompareQuestion, compareFromId, COMPARE_ID_PATTERN } from '@/data/compareGen';

// Every check re-derives the answer from the numbers she sees, never from
// `correctAnswer`.

const SAMPLE = 4000;

const RUNGS = [
  { label: 'comparing to 10', params: { operation: 'compare', max: 10 }, difficulty: 1, lo: 0, hi: 10 },
  { label: 'comparing to 20', params: { operation: 'compare', max: 20 }, difficulty: 2, lo: 11, hi: 20 },
] as const;

const SAMPLES = RUNGS.map((r) => Array.from({ length: SAMPLE }, () => generateCompareQuestion(r.params)));

interface Solved { shape: 'sign' | 'more' | 'less'; a: number; b: number; answer: string }

function solve(q: Question): Solved {
  let m = q.prompt.match(/^(\d+) ☐ (\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2];
    expect(q.promptEmoji).toBeUndefined();
    return { shape: 'sign', a, b, answer: a > b ? '>' : a < b ? '<' : '=' };
  }
  m = q.prompt.match(/^Which is (more|less)\?$/);
  const n = q.promptEmoji?.match(/^(\d+) {2}or {2}(\d+)$/);
  if (m && n) {
    const a = +n[1], b = +n[2];
    const ask = m[1] as 'more' | 'less';
    return { shape: ask, a, b, answer: String(ask === 'more' ? Math.max(a, b) : Math.min(a, b)) };
  }
  throw new Error(`${q.id}: unrecognised "${q.prompt}" / "${q.promptEmoji}"`);
}

/**
 * Which way she would lean if she lost track of a ten, worked out here
 * independently: comparing only the ones (12 vs 9 → "2 < 9") when the tens
 * differ, or reading a ten as a one (15 vs 3 → "1 < 3") when only one number
 * has a ten.
 */
function slipSays(a: number, b: number): Set<string> {
  const cmp = (x: number, y: number) => (x > y ? '>' : x < y ? '<' : '=');
  const out = new Set<string>();
  if (Math.floor(a / 10) !== Math.floor(b / 10)) out.add(cmp(a % 10, b % 10));
  if ((a >= 10) !== (b >= 10)) out.add(cmp(Number(String(a)[0]), Number(String(b)[0])));
  return out;
}

function tagIsHonest(s: Solved, wrong: string, tag: string): boolean {
  if (tag === 'unknown') return true;
  if (tag !== 'place-value') return false;
  if (s.shape === 'sign') return slipSays(s.a, s.b).has(wrong);
  // Picking `wrong` is a lost ten if a slip makes it look like the one asked for.
  const other = Number(wrong) === s.a ? s.b : s.a;
  return slipSays(Number(wrong), other).has(s.shape === 'more' ? '>' : '<');
}

describe.each(RUNGS.map((r, i) => [r.label, r, SAMPLES[i]] as const))('%s', (_label, rung, qs) => {
  it('marks the right answer, and only one option is right', () => {
    for (const q of qs) {
      const s = solve(q);
      expect(q.correctAnswer, q.id).toBe(s.answer);
      expect(q.choices.filter((c) => c === s.answer), q.id).toHaveLength(1);
      expect(q.type, q.id).toBe('number_compare');
      expect(q.skill, q.id).toBeUndefined();
    }
  });

  it('offers exactly the three signs, or exactly the two numbers', () => {
    for (const q of qs) {
      const s = solve(q);
      expect(new Set(q.choices).size, q.id).toBe(q.choices.length);
      if (s.shape === 'sign') expect([...q.choices].sort(), q.id).toEqual(['<', '=', '>']);
      else {
        expect(s.a, q.id).not.toBe(s.b);
        expect([...q.choices].sort(), q.id).toEqual([String(s.a), String(s.b)].sort());
      }
    }
  });

  it('makes every sign the answer a fair share of the time', () => {
    const signs = qs.map(solve).filter((s) => s.shape === 'sign');
    expect(signs.length / SAMPLE).toBeGreaterThan(0.4);
    for (const sign of ['<', '>', '=']) {
      const share = signs.filter((s) => s.answer === sign).length / signs.length;
      expect(share, sign).toBeGreaterThan(0.2);
      expect(share, sign).toBeLessThan(0.45);
    }
  });

  it('does not let "tap the bigger one" or "tap the first one" work', () => {
    const which = qs.map(solve).filter((s) => s.shape !== 'sign');
    expect(which.length / SAMPLE).toBeGreaterThan(0.25);
    const bigger = which.filter((s) => Number(s.answer) === Math.max(s.a, s.b)).length / which.length;
    const first = which.filter((s) => Number(s.answer) === s.a).length / which.length;
    for (const share of [bigger, first]) {
      expect(share).toBeGreaterThan(0.4);
      expect(share).toBeLessThan(0.6);
    }
    // And the slot it lands in on screen.
    const slot0 = qs.filter((q) => q.choices.length === 2 && q.choices[0] === q.correctAnswer).length;
    expect(slot0 / which.length).toBeGreaterThan(0.4);
    expect(slot0 / which.length).toBeLessThan(0.6);
  });

  it('stays inside its rung', () => {
    for (const q of qs) {
      const s = solve(q);
      expect(q.difficulty, q.id).toBe(rung.difficulty);
      expect(Math.max(s.a, s.b), q.id).toBeLessThanOrEqual(rung.hi);
      expect(Math.max(s.a, s.b), `${q.id} belongs on the rung below`).toBeGreaterThanOrEqual(rung.lo);
      expect(Math.min(s.a, s.b), q.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('tags a wrong option as a lost ten only when a lost ten explains it', () => {
    let tagged = 0;
    for (const q of qs) {
      const s = solve(q);
      expect(q.distractorMeaning![q.correctAnswer], q.id).toBeUndefined();
      for (const c of q.choices.filter((c) => c !== q.correctAnswer)) {
        const tag = q.distractorMeaning![c];
        expect(tag, `${q.id}: no tag for ${c}`).toBeDefined();
        expect(tagIsHonest(s, c, tag), `${q.id}: ${c} is not "${tag}"`).toBe(true);
        if (tag === 'place-value') tagged++;
      }
    }
    // Past ten, the pairs that catch it come up often enough to be worth tagging.
    if (rung.hi > 10) expect(tagged / SAMPLE).toBeGreaterThan(0.25);
  });

  it('tags every lost ten it could have', () => {
    // The other direction: a wrong option a slip explains is never left 'unknown'.
    for (const q of qs) {
      const s = solve(q);
      for (const c of q.choices.filter((c) => c !== q.correctAnswer)) {
        const explained = tagIsHonest(s, c, 'place-value');
        expect(q.distractorMeaning![c], `${q.id}: ${c}`).toBe(explained ? 'place-value' : 'unknown');
      }
    }
  });

  it('can be answered by ear, and the hint never gives the answer', () => {
    const says = (text: string, n: number) => new RegExp(`(^|[^\\d])${n}([^\\d]|$)`).test(text);
    for (const q of qs) {
      const s = solve(q);
      expect(says(q.speakText!, s.a) && says(q.speakText!, s.b), `${q.id}: ${q.speakText}`).toBe(true);
      if (s.shape === 'sign') {
        // She taps a symbol, so she hears what each symbol means.
        for (const words of ['greater than', 'less than', 'equal to']) expect(q.speakText, q.id).toContain(words);
        expect(q.speakText!.indexOf(String(s.a)), q.id).toBeLessThan(q.speakText!.lastIndexOf(String(s.b)));
      } else {
        expect(q.speakText, q.id).toContain(s.shape);
      }
      // The same advice whatever the answer: no numbers, no signs.
      expect(q.hint, q.id).toBeTruthy();
      expect(q.hint, q.id).not.toMatch(/[\d<>=]/);
    }
  });

  it('gives a hint that depends only on the kind of question, never on its answer', () => {
    const hints = new Map<string, Set<string>>();
    for (const q of qs) {
      const key = solve(q).shape;
      if (!hints.has(key)) hints.set(key, new Set());
      hints.get(key)!.add(q.hint!);
    }
    for (const [shape, set] of hints) expect(set.size, shape).toBe(1);
  });

  it('is varied', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBeGreaterThan(rung.hi > 10 ? 250 : 120);
  });

  it('rebuilds every question from its id', () => {
    for (const q of qs) {
      expect(q.id, q.id).toMatch(COMPARE_ID_PATTERN);
      const r = compareFromId(q.id);
      expect(r, q.id).not.toBeNull();
      expect({ ...r!, choices: undefined, distractorMeaning: undefined })
        .toEqual({ ...q, choices: undefined, distractorMeaning: undefined });
      expect([...r!.choices].sort(), q.id).toEqual([...q.choices].sort());
    }
  });
});

describe('comparing to 20', () => {
  it('often pits a teen against a single digit with bigger ones, where looking at the ones gets it wrong', () => {
    const traps = SAMPLES[1].map(solve).filter((s) => s.a !== s.b && slipSays(s.a, s.b).size > 0
      && [...slipSays(s.a, s.b)].some((x) => x !== (s.a > s.b ? '>' : '<')));
    expect(traps.length / SAMPLE).toBeGreaterThan(0.25);
  });
});

describe('compareFromId', () => {
  it('rebuilds every pair either rung can ask, and each one solves', () => {
    for (const shape of ['sign', 'more', 'less']) {
      for (let a = 0; a <= 20; a++) {
        for (let b = 0; b <= 20; b++) {
          const id = `gcmp-${shape}-${a}-${b}`;
          const q = compareFromId(id);
          const askable = shape === 'sign' ? !(a === 0 && b === 0) : a !== b;
          if (!askable) { expect(q, id).toBeNull(); continue; }
          expect(id).toMatch(COMPARE_ID_PATTERN);
          expect(q, id).not.toBeNull();
          expect(q!.id).toBe(id);
          expect(q!.correctAnswer, id).toBe(solve(q!).answer);
          expect(q!.difficulty, id).toBe(Math.max(a, b) > 10 ? 2 : 1);
        }
      }
    }
  });

  it('refuses ids it cannot honestly rebuild', () => {
    for (const id of [
      '', 'gcmp-', 'gcmp-sign', 'gcmp-sign-3', 'gcmp-sign-3-', 'gcmp-sign-21-3', 'gcmp-sign-3-21',
      'gcmp-sign-0-0', 'gcmp-more-5-5', 'gcmp-less-7-7', 'gcmp-less-03-4', 'gcmp-sign--1-3',
      'gcmp-more-3-4-5', 'gcmp-eq-3-3', 'gcmp-bigger-3-4', 'gcmp-sign-3.5-4',
      'cmp-5-gt-3', 'cmp-1', 'gcount-apple-5',
    ]) {
      expect(compareFromId(id), id).toBeNull();
    }
  });

  it('has an id pattern that matches none of the bank’s or other generators’ ids', () => {
    for (const id of ['cmp-5-gt-3', 'cmp-12-eq-12', 'cmp-1', 'gcount-apple-5', 'gorder-next-5']) {
      expect(COMPARE_ID_PATTERN.test(id), id).toBe(false);
    }
  });
});

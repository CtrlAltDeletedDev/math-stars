import { describe, it, expect } from 'vitest';
import { Question } from '@/types';
import { generateStoryProblem, storyProblemFromId, StoryType } from '@/data/storyProblems';
import {
  generateAnyPositionMissing,
  generateRelatedQuestion,
  generateFromParams,
  questionFromId,
  canRebuildFromId,
} from './questionGenerator';
import { CATEGORIES } from '@/data/categories';
import { buildSession } from './sessionBuilder';

// The first-grade unit on adding and subtracting within 20: story problems of
// every shape, "which number sentence matches", "which adding fact helps", and
// the mystery number on either side of the equals sign. These tests solve every
// question independently rather than trusting the generator's own arithmetic.

const N = 1500;

/** Solve "a + ? = c", "17 = ? + 6", "? − 6 = 11" and friends. Null if no whole-number answer. */
function solve(sentence: string): number | null {
  const s = sentence.replace(/−/g, '-').replace(/\s+/g, '');
  let [left, right] = s.split('=');
  // Put the side with the operator on the left.
  if (!/[+-]/.test(left)) [left, right] = [right, left];
  const m = left.match(/^(\?|\d+)([+-])(\?|\d+)$/);
  if (!m) throw new Error(`cannot parse ${sentence}`);
  const [, a, op, b] = m;
  const n = (t: string) => Number(t);
  let out: number;
  if (right === '?') out = op === '+' ? n(a) + n(b) : n(a) - n(b);
  else if (a === '?') out = op === '+' ? n(right) - n(b) : n(right) + n(b);
  else if (b === '?') out = op === '+' ? n(right) - n(a) : n(a) - n(right);
  else throw new Error(`no unknown in ${sentence}`);
  return out >= 0 ? out : null;
}

/** "a + b = c" with no unknown: is it true? */
function isTrue(fact: string): boolean {
  const m = fact.match(/^(\d+) \+ (\d+) = (\d+)$/);
  return !!m && Number(m[1]) + Number(m[2]) === Number(m[3]);
}

function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

const NUMBER_TYPES: StoryType[] = ['result', 'part', 'compare', 'compareQty', 'change', 'mixed'];

describe('story problems within 20', () => {
  it('answer what the story actually asks', () => {
    for (const type of NUMBER_TYPES) {
      for (let i = 0; i < N; i++) {
        const q = generateStoryProblem(type);
        if (q.id.endsWith('-eq') || q.id.endsWith('-eqa')) continue; // mixed sometimes asks for the sentence
        const [, kind, , x, y] = q.id.match(/^st-([a-z]+)-(\d+)-(\d+)-(\d+)$/)!.map((v, i) => (i >= 2 ? Number(v) : v)) as [string, string, number, number, number];
        const expected = ['join', 'total', 'more'].includes(kind) ? x + y : x - y;
        expect(Number(q.correctAnswer), `${q.id}: ${q.prompt}`).toBe(expected);
        expect(expected, q.id).toBeGreaterThan(0);
        // Both story numbers are in the words, and nothing in it goes past 20.
        const shown = numbersIn(q.prompt);
        expect(shown, q.id).toContain(x);
        expect(shown, q.id).toContain(y);
        expect(Math.max(...shown, expected), q.id).toBeLessThanOrEqual(20);
        expect(Math.min(x, y), `${q.id}: a 1 in a story reads "1 are…"`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('usually offers "added the two numbers" on a story that is really a take-away', () => {
    // The exact mistake on her sheet: 14 balls, 6 soccer balls → she chose 20.
    // Not *always*: the sum is always bigger than the answer, so offering it
    // every time would make "never the biggest" a working strategy. The shared
    // builder drops it exactly when it puts every distractor below the answer.
    for (const type of ['part', 'compare', 'change'] as StoryType[]) {
      let offered = 0, seen = 0;
      for (let i = 0; i < N; i++) {
        const q = generateStoryProblem(type);
        if (q.id.startsWith('st-total')) continue;
        seen++;
        const [x, y] = q.id.match(/-(\d+)-(\d+)$/)!.slice(1).map(Number);
        if (!q.choices.includes(String(x + y))) continue;
        offered++;
        expect(q.distractorMeaning![String(x + y)], q.id).toBe('added-story-numbers');
      }
      expect(offered / seen, `${type}: the added-both option is too rare`).toBeGreaterThan(0.6);
    }
  });

  it('does not park the answer at one numeric rank', () => {
    for (const type of ['part', 'compare', 'compareQty', 'change'] as StoryType[]) {
      const ranks = [0, 0, 0, 0];
      for (let i = 0; i < N; i++) {
        const q = generateStoryProblem(type);
        const nums = q.choices.map(Number);
        ranks[[...nums].sort((a, b) => a - b).indexOf(Number(q.correctAnswer))]++;
      }
      const shares = ranks.map((r) => r / N);
      expect(Math.max(...shares), `${type}: ${shares}`).toBeLessThan(0.45);
      expect(Math.min(...shares), `${type}: ${shares}`).toBeGreaterThan(0.08);
    }
  });

  it('cannot be done by always subtracting', () => {
    // A "some and the rest" level made only of take-aways teaches "big minus
    // small" without reading. Some stories in it must be putting together.
    for (const type of ['part', 'compareQty', 'mixed'] as StoryType[]) {
      let adds = 0, subs = 0;
      for (let i = 0; i < N; i++) {
        const q = generateStoryProblem(type);
        if (/^st-(join|total|more)-/.test(q.id)) adds++;
        else subs++;
      }
      expect(adds / N, `${type}: too few adding stories`).toBeGreaterThan(0.15);
      expect(subs / N, `${type}: too few take-away stories`).toBeGreaterThan(0.4);
    }
  });

  it('never guesses a pronoun for the people in the story', () => {
    for (const type of [...NUMBER_TYPES, 'equation'] as StoryType[]) {
      for (let i = 0; i < 400; i++) {
        const q = generateStoryProblem(type);
        expect(q.prompt, q.id).not.toMatch(/\b(he|she|him|her|his|hers)\b/i);
      }
    }
  });

  it('carry the hop line, so she can show her work', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateStoryProblem('part');
      expect(q.visual).toEqual({ kind: 'numberLine', max: 20 });
    }
  });
});

describe('"which number sentence matches the story?"', () => {
  it('has exactly one sentence that solves to the story answer', () => {
    for (let i = 0; i < N * 2; i++) {
      const q = generateStoryProblem('equation');
      const num = storyProblemFromId(q.id.replace(/-eqa?$/, ''))!;
      const answer = Number(num.correctAnswer);
      const right = q.choices.filter((c) => solve(c) === answer);
      expect(right, `${q.id}: ${JSON.stringify(q.choices)}`).toEqual([q.correctAnswer]);
      expect(q.choices.length).toBe(4);
      expect(new Set(q.choices).size).toBe(4);
    }
  });

  it('only offers adding sentences when it asks for an adding problem', () => {
    let asked = 0;
    for (let i = 0; i < N; i++) {
      const q = generateStoryProblem('equation');
      if (!q.id.endsWith('-eqa')) continue;
      asked++;
      for (const c of q.choices) expect(c, q.id).not.toContain('−');
      expect(q.correctAnswer, q.id).toMatch(/^\d+ \+ \? = \d+$/);
    }
    expect(asked).toBeGreaterThan(50);
  });

  it('does not let the shape of the sentence give the answer away', () => {
    // If the right answer were always the only one with a minus, or never a
    // plain "a + b = ?", she could pick it without reading the story.
    const shapeOf = (c: string) => c.replace(/\d+/g, 'n');
    const rightShapes = new Map<string, number>();
    let onlyMinus = 0, total = 0;
    for (let i = 0; i < N * 2; i++) {
      const q = generateStoryProblem('equation');
      total++;
      const shape = shapeOf(q.correctAnswer);
      rightShapes.set(shape, (rightShapes.get(shape) ?? 0) + 1);
      const minuses = q.choices.filter((c) => c.includes('−'));
      if (minuses.length === 1 && minuses[0] === q.correctAnswer) onlyMinus++;
    }
    expect(onlyMinus, 'the right answer was the only sentence with a minus').toBe(0);
    for (const [shape, count] of rightShapes) {
      expect(count / total, `"${shape}" is the answer too often`).toBeLessThan(0.6);
    }
    expect(rightShapes.size).toBeGreaterThanOrEqual(3);
  });
});

describe('adding and subtracting are the same facts', () => {
  it('helper: every option is a true sum, and exactly one is about this subtraction', () => {
    for (let i = 0; i < N; i++) {
      const q = generateRelatedQuestion('helper', 20);
      const [w, p] = q.prompt.match(/(\d+) − (\d+)\?$/)!.slice(1).map(Number);
      for (const c of q.choices) expect(isTrue(c), `${q.id}: "${c}" is false arithmetic`).toBe(true);
      const helpful = q.choices.filter((c) => {
        const [a, b, sum] = numbersIn(c);
        return sum === w && (a === p || b === p);
      });
      expect(helpful, q.id).toEqual([q.correctAnswer]);
      // The worksheet's trap — adding the two numbers in the subtraction — is always there.
      expect(q.choices, q.id).toContain(`${w} + ${p} = ${w + p}`);
    }
  });

  it('restate: the right missing-addend problem solves to the difference', () => {
    for (let i = 0; i < N; i++) {
      const q = generateRelatedQuestion('restate', 20);
      const [w, p] = q.prompt.match(/(\d+) − (\d+) = \?$/)!.slice(1).map(Number);
      const right = q.choices.filter((c) => solve(c) === w - p);
      expect(right, `${q.id}: ${JSON.stringify(q.choices)}`).toEqual([q.correctAnswer]);
    }
  });

  it('both: one number fills both blanks', () => {
    for (let i = 0; i < N; i++) {
      const q = generateRelatedQuestion('both', 20);
      const [first, second] = q.prompt.split('\n');
      expect(solve(first), q.id).toBe(Number(q.correctAnswer));
      expect(solve(second), q.id).toBe(Number(q.correctAnswer));
    }
  });
});

describe('the mystery number anywhere', () => {
  it('solves to the answer in every position, both sides of the equals sign', () => {
    const shapes = new Set<string>();
    for (let i = 0; i < N * 2; i++) {
      const q = generateAnyPositionMissing(20);
      expect(solve(q.prompt), `${q.id}: ${q.prompt}`).toBe(Number(q.correctAnswer));
      shapes.add(q.prompt.replace(/\d+/g, 'n'));
    }
    // a + ? = c, a − ? = c, ? + a = c, c = a + ?, c = ? + a, ? − a = c
    expect(shapes.size).toBe(6);
  });

  it('includes the unit-test form "17 = ? + 6"', () => {
    let seen = false;
    for (let i = 0; i < 500 && !seen; i++) seen = /^\d+ = \? \+ \d+$/.test(generateAnyPositionMissing(20).prompt);
    expect(seen).toBe(true);
  });
});

describe('the new levels', () => {
  const ids = [
    'story-20', 'story-part', 'story-compare', 'story-fewer', 'story-needs', 'story-sentence', 'story-mix-20',
    'ff-helper', 'ff-restate', 'ff-both', 'subtraction-3',
  ];
  const levels = CATEGORIES.flatMap((c) => c.levels).filter((l) => ids.includes(l.id));

  it('all exist', () => {
    expect(levels.map((l) => l.id).sort()).toEqual([...ids].sort());
  });

  it('round-trip through the review session', () => {
    for (const level of levels) {
      for (const q of buildSession(level, {}, 'Friend')) {
        expect(canRebuildFromId(q.id), `${q.id} would be pruned`).toBe(true);
        const back = questionFromId(q.id, 'Friend') as Question;
        expect(back?.prompt, q.id).toBe(q.prompt);
        expect(back.correctAnswer, q.id).toBe(q.correctAnswer);
      }
    }
  });

  it('tag every wrong option with what it means', () => {
    for (const level of levels) {
      for (let i = 0; i < 200; i++) {
        const q = generateFromParams(level.generatorParams!, 'Friend');
        for (const c of q.choices.filter((c) => c !== q.correctAnswer)) {
          expect(q.distractorMeaning?.[c], `${q.id}: "${c}" has no meaning`).toBeDefined();
        }
      }
    }
  });

  it('refuse ids they could not honestly rebuild', () => {
    for (const bad of [
      'st-part-0-6-9',   // the part is bigger than the whole
      'st-part-0-13-1',  // a 1 in a story reads "1 are soccer balls"
      'st-join-0-15-9',  // past 20
      'st-diff-7-12-3',  // no such wording
      'st-join-0-5-3-eqa', // an adding story never asks for "the adding problem"
      'st-nope-0-5-3',
      'rel-helper-13-1', // too small a part to need a helper
      'miss2-eqr-6-9',
    ]) {
      expect(questionFromId(bad), `${bad} should not rebuild`).toBeNull();
    }
  });
});

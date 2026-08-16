import { describe, it, expect } from 'vitest';
import { CATEGORIES, ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { buildSession } from './sessionBuilder';
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateFromParams,
  questionFromId,
} from './questionGenerator';
import { Question } from '@/types';

const ALL = [...ALL_QUESTIONS_BY_ID.values()];
const SAMPLE = 3000;

// ---------------------------------------------------------------------------
// Integrity of the hand-written banks
// ---------------------------------------------------------------------------

describe('question bank integrity', () => {
  it('has questions', () => {
    expect(ALL.length).toBeGreaterThan(300);
  });

  it('always includes the correct answer among the choices', () => {
    const bad = ALL.filter((q) => !q.choices.includes(q.correctAnswer));
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it('never repeats a choice within a question', () => {
    const bad = ALL.filter((q) => new Set(q.choices).size !== q.choices.length);
    expect(bad.map((q) => `${q.id}: ${JSON.stringify(q.choices)}`)).toEqual([]);
  });

  it('offers between 2 and 4 choices', () => {
    const bad = ALL.filter((q) => q.choices.length < 2 || q.choices.length > 4);
    expect(bad.map((q) => `${q.id}: ${q.choices.length}`)).toEqual([]);
  });

  it('has no blank prompts or answers', () => {
    const bad = ALL.filter((q) => !q.prompt.trim() || !q.correctAnswer.trim());
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  // Catches padding a question out to four options with values that can never be
  // right ('Neither', 'Both'), which quietly turns it into a coin flip.
  //
  // Scoped to word answers on purpose. A numeric distractor that happens never
  // to be correct is just a plausible wrong number; a *word* that is never
  // correct anywhere in its group is dead weight the child learns to ignore.
  it('has no word option that is never the answer for its question shape', () => {
    const isWordy = (q: Question) => q.choices.every((c) => Number.isNaN(Number(c)));

    const groups = new Map<string, Question[]>();
    for (const q of ALL) {
      if (!isWordy(q)) continue;
      const key = [...q.choices].sort().join('\u0000');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }

    const deadOptions: string[] = [];
    for (const [, qs] of groups) {
      if (qs.length < 8) continue; // too few to distinguish filler from a plain wrong answer
      const everCorrect = new Set(qs.map((q) => q.correctAnswer));
      for (const opt of qs[0].choices) {
        if (!everCorrect.has(opt)) {
          deadOptions.push(`"${opt}" is never correct across ${qs.length} questions like ${qs[0].id}`);
        }
      }
    }
    expect(deadOptions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The curriculum wiring
// ---------------------------------------------------------------------------

describe('levels', () => {
  const levels = CATEGORIES.flatMap((c) => c.levels);

  it('all have a source of questions', () => {
    const bad = levels.filter((l) => !l.questionBankIds?.length && !l.generatorParams);
    expect(bad.map((l) => l.id)).toEqual([]);
  });

  it('reference only bank ids that exist', () => {
    const bad: string[] = [];
    for (const l of levels) {
      for (const id of l.questionBankIds ?? []) {
        if (!ALL_QUESTIONS_BY_ID.has(id)) bad.push(`${l.id} -> ${id}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('have a bank at least as large as one session', () => {
    const bad = levels
      .filter((l) => l.questionBankIds?.length)
      .filter((l) => l.questionBankIds!.length < l.questionsPerSession)
      .map((l) => `${l.id}: ${l.questionBankIds!.length} < ${l.questionsPerSession}`);
    expect(bad).toEqual([]);
  });

  it('have unique ids', () => {
    const ids = levels.map((l) => l.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('fill a full session with distinct questions', () => {
    const bad: string[] = [];
    for (const l of levels) {
      const s = buildSession(l, {}, 'Friend');
      if (s.length < l.questionsPerSession) bad.push(`${l.id}: got ${s.length}/${l.questionsPerSession}`);
      if (new Set(s.map((q) => q.id)).size !== s.length) bad.push(`${l.id}: repeated a question`);
    }
    expect(bad).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The thing this whole file exists for: position must carry no information
// ---------------------------------------------------------------------------

/** Where the answer sits among the rendered buttons. */
function slotOf(q: Question): number {
  return q.choices.indexOf(q.correctAnswer);
}

/** Where the answer sits once the options are sorted numerically. */
function sortedRankOf(q: Question): number {
  const nums = q.choices.map(Number);
  if (nums.some(Number.isNaN)) return -1;
  return [...nums].sort((a, b) => a - b).indexOf(Number(q.correctAnswer));
}

function expectFlat(counts: number[], label: string, tolerance = 0.08) {
  const total = counts.reduce((a, b) => a + b, 0);
  const expected = 1 / counts.length;
  counts.forEach((c, i) => {
    const share = c / total;
    expect(
      Math.abs(share - expected),
      `${label}: slot ${i} held the answer ${(share * 100).toFixed(1)}% of the time (expected ~${(expected * 100).toFixed(0)}%)`,
    ).toBeLessThan(tolerance);
  });
}

describe('answer position carries no information', () => {
  it('is evenly spread across buttons for every generated level', () => {
    const generated = CATEGORIES.flatMap((c) => c.levels).filter((l) => l.generatorParams);
    expect(generated.length).toBeGreaterThan(0);

    for (const level of generated) {
      const counts = [0, 0, 0, 0];
      for (let i = 0; i < SAMPLE; i++) {
        const q = generateFromParams(level.generatorParams!, 'Friend');
        counts[slotOf(q)]++;
      }
      expectFlat(counts, `level ${level.id}`);
    }
  });

  it('is evenly spread once bank questions go through a session', () => {
    const bankLevels = CATEGORIES.flatMap((c) => c.levels).filter((l) => l.questionBankIds?.length);
    for (const level of bankLevels) {
      const counts = [0, 0, 0, 0];
      let seen = 0;
      for (let i = 0; i < 300; i++) {
        for (const q of buildSession(level, {}, 'Friend')) {
          if (q.choices.length !== 4) continue; // binary questions counted separately
          counts[slotOf(q)]++;
          seen++;
        }
      }
      if (seen < 200) continue;
      expectFlat(counts, `level ${level.id}`, 0.06);
    }
  });

  it('does not put the answer at a fixed numeric rank', () => {
    // The old generator emitted four consecutive integers with the answer third.
    for (const [label, gen] of [
      ['addition to 20', () => generateAdditionQuestion(20)],
      ['subtraction to 10', () => generateSubtractionQuestion(10)],
      ['skip count by 5', () => generateFromParams({ operation: 'skip_count', by: 5, maxStart: 50 })],
      ['times 5', () => generateFromParams({ operation: 'multiplication', tables: '5' })],
      ['missing to 10', () => generateFromParams({ operation: 'missing', maxSum: 10, kind: 'both' })],
    ] as const) {
      const ranks = [0, 0, 0, 0];
      for (let i = 0; i < SAMPLE; i++) {
        const r = sortedRankOf(gen());
        if (r >= 0) ranks[r]++;
      }
      const total = ranks.reduce((a, b) => a + b, 0);
      const shares = ranks.map((r) => r / total);
      const worst = Math.max(...shares);
      const rarest = Math.min(...shares);
      expect(
        worst,
        `${label}: answer was rank ${shares.indexOf(worst)} in ${(worst * 100).toFixed(0)}% of questions`,
      ).toBeLessThan(0.45);
      // "the answer is never the biggest option" is just as exploitable as
      // "always the third" — every rank has to actually occur.
      expect(
        rarest,
        `${label}: answer was never rank ${shares.indexOf(rarest)}, so that option is always wrong`,
      ).toBeGreaterThan(0.08);
    }
  });

  it('does not offer four consecutive integers', () => {
    // Consecutive options are a giveaway and are implausible as mistakes.
    for (const [label, gen] of [
      ['skip count by 5', () => generateFromParams({ operation: 'skip_count', by: 5, maxStart: 50 })],
      ['times 10', () => generateFromParams({ operation: 'multiplication', tables: '10' })],
      ['addition to 20', () => generateAdditionQuestion(20)],
    ] as const) {
      let consecutive = 0;
      for (let i = 0; i < SAMPLE; i++) {
        const nums = gen().choices.map(Number).sort((a, b) => a - b);
        if (nums[3] - nums[0] === 3) consecutive++;
      }
      expect(consecutive / SAMPLE, `${label}`).toBeLessThan(0.2);
    }
  });
});

// ---------------------------------------------------------------------------
// Generated questions
// ---------------------------------------------------------------------------

describe('generated questions', () => {
  const levels = CATEGORIES.flatMap((c) => c.levels).filter((l) => l.generatorParams);

  it('are internally consistent', () => {
    for (const level of levels) {
      for (let i = 0; i < 400; i++) {
        const q = generateFromParams(level.generatorParams!, 'Friend');
        expect(q.choices, `${level.id} / ${q.id}`).toContain(q.correctAnswer);
        expect(new Set(q.choices).size, `${level.id} / ${q.id} had a duplicate choice`).toBe(q.choices.length);
        expect(q.choices.length, `${level.id} / ${q.id}`).toBe(4);
        expect(q.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  it('never offers a negative number', () => {
    for (const level of levels) {
      for (let i = 0; i < 400; i++) {
        const q = generateFromParams(level.generatorParams!, 'Friend');
        const negatives = q.choices.map(Number).filter((n) => !Number.isNaN(n) && n < 0);
        expect(negatives, `${level.id} / ${q.id}`).toEqual([]);
      }
    }
  });

  it('respects the arithmetic in the prompt', () => {
    for (let i = 0; i < SAMPLE; i++) {
      const a = generateAdditionQuestion(20);
      const [x, y] = a.prompt.match(/(\d+) \+ (\d+)/)!.slice(1).map(Number);
      expect(Number(a.correctAnswer)).toBe(x + y);

      const s = generateSubtractionQuestion(10);
      const [p, m] = s.prompt.match(/(\d+) - (\d+)/)!.slice(1).map(Number);
      expect(Number(s.correctAnswer)).toBe(p - m);
      expect(p - m).toBeGreaterThanOrEqual(0);
    }
  });

  it('can be rebuilt from their id, for the review session', () => {
    for (const level of levels) {
      for (let i = 0; i < 100; i++) {
        const q = generateFromParams(level.generatorParams!, 'Friend');
        const rebuilt = questionFromId(q.id);
        expect(rebuilt, `no rebuild for ${q.id}`).not.toBeNull();
        expect(rebuilt!.correctAnswer, `wrong answer rebuilding ${q.id}`).toBe(q.correctAnswer);
        expect(rebuilt!.prompt).toBe(q.prompt);
      }
    }
  });
});

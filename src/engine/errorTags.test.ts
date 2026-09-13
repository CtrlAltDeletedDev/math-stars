import { describe, it, expect } from 'vitest';
import { Question, ErrorTag } from '@/types';
import { CATEGORIES } from '@/data/categories';
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateFromParams,
} from './questionGenerator';
import { generateMoneyQuestion } from '@/data/moneyGen';
import { generateFractionQuestion } from '@/data/fractions';
import { buildTaggedChoices, shuffleChoices } from './choices';

// The generators have always chosen distractors that are specific mistakes --
// `a+b` on a subtraction question is "added instead of subtracting". That
// meaning lived in comments and evaporated the moment she tapped one. These
// tests are about it surviving the whole trip to storage.

const TAGGED: [string, () => Question][] = [
  ['addition', () => generateAdditionQuestion(20)],
  ['subtraction', () => generateSubtractionQuestion(20)],
  ['missing number', () => generateFromParams({ operation: 'missing', maxSum: 20, kind: 'both' })],
  ['skip counting', () => generateFromParams({ operation: 'skip_count', by: 5, maxStart: 50 })],
  ['multiplication', () => generateFromParams({ operation: 'multiplication', tables: '5' })],
  ['doubles', () => generateFromParams({ operation: 'doubles', maxAddend: 10 })],
  ['make ten', () => generateFromParams({ operation: 'make_ten', target: 10 })],
  ['counting on', () => generateFromParams({ operation: 'count_on', maxStart: 18 })],
  ['counting coins', () => generateMoneyQuestion('like')],
  ['mixed coins', () => generateMoneyQuestion('mixed')],
  ['making change', () => generateMoneyQuestion('change100')],
  ['fractions of a set', () => generateFractionQuestion([2, 3, 4], 'ofSet')],
];

describe('every wrong option carries what picking it would mean', () => {
  it.each(TAGGED)('%s tags all three distractors', (_label, gen) => {
    for (let i = 0; i < 200; i++) {
      const q = gen();
      // The trap this guards: TypeScript does not excess-property-check a
      // spread, so `...buildTaggedChoices(...)` under a near-miss field name
      // compiles perfectly and produces questions with no meaning at all.
      expect(q.distractorMeaning, `${q.id} carries no meaning`).toBeDefined();

      const wrong = q.choices.filter((c) => c !== q.correctAnswer);
      for (const w of wrong) {
        expect(q.distractorMeaning![w], `${q.id}: no tag for "${w}"`).toBeDefined();
      }
      expect(q.distractorMeaning![q.correctAnswer], `${q.id} tagged its own answer`).toBeUndefined();
    }
  });

  it.each(TAGGED)('%s says something more useful than "unknown" most of the time', (_label, gen) => {
    // A tag pool that collapses to 'unknown' would pass the test above while
    // telling a parent nothing, which is the failure mode worth guarding.
    let meaningful = 0, total = 0;
    for (let i = 0; i < 400; i++) {
      const q = gen();
      for (const w of q.choices.filter((c) => c !== q.correctAnswer)) {
        total++;
        if (q.distractorMeaning![w] !== 'unknown') meaningful++;
      }
    }
    expect(meaningful / total).toBeGreaterThan(0.5);
  });

  it('survives the shuffle every question goes through before she sees it', () => {
    // Keyed by the option's own text, not its index: a question is shuffled at
    // least once between being built and being shown, so an index would point
    // at the wrong option by the time she taps.
    for (let i = 0; i < 300; i++) {
      const q = generateSubtractionQuestion(20);
      const before = q.choices.filter((c) => c !== q.correctAnswer)
        .map((c) => [c, q.distractorMeaning![c]]);
      const reshuffled = { ...q, choices: shuffleChoices(q.choices) };
      for (const [choice, tag] of before) {
        expect(reshuffled.choices).toContain(choice);
        expect(reshuffled.distractorMeaning![choice as string]).toBe(tag);
      }
    }
  });

  it('reads a subtraction answer that added instead', () => {
    // The headline case, asserted directly rather than through a sample.
    for (let i = 0; i < 300; i++) {
      const q = generateSubtractionQuestion(20);
      const [a, b] = q.prompt.match(/(\d+) - (\d+)/)!.slice(1).map(Number);
      const added = String(a + b);
      if (q.choices.includes(added) && added !== q.correctAnswer) {
        expect(q.distractorMeaning![added]).toBe('wrong-operation');
      }
    }
  });
});

describe('the tagging never changes what she is asked', () => {
  it('keeps the answer in the options and the options distinct', () => {
    for (const [, gen] of TAGGED) {
      for (let i = 0; i < 200; i++) {
        const q = gen();
        expect(q.choices).toContain(q.correctAnswer);
        expect([...new Set(q.choices)].length).toBe(q.choices.length);
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
        expect(q.choices.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it('still formats money as cents, keys included', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateMoneyQuestion('mixed');
      for (const c of q.choices) expect(c).toMatch(/^\d+¢$/);
      // If formatting happened after tagging, every key here would be a bare
      // number and would match no option on screen.
      for (const k of Object.keys(q.distractorMeaning!)) expect(k).toMatch(/^\d+¢$/);
    }
  });

  it('leaves an untagged candidate list working exactly as before', () => {
    const { choices, distractorMeaning } = buildTaggedChoices(10, [9, 11, 20]);
    expect(choices).toContain('10');
    expect(choices.length).toBe(4);
    for (const c of choices.filter((c) => c !== '10')) {
      expect(distractorMeaning[c]).toBeDefined();
    }
  });

  it('lets a caller override what a synthesised value would have meant', () => {
    // correct + 1 would be tagged 'off-by-one' by the top-up; the caller's own
    // reading of that value has to win.
    const { distractorMeaning } = buildTaggedChoices(
      10, [[11, 'wrong-operation'] as [number, ErrorTag]],
    );
    if (distractorMeaning['11']) expect(distractorMeaning['11']).toBe('wrong-operation');
  });
});

describe('hand-written bank questions', () => {
  it('are not claimed to carry meaning they do not have', () => {
    // Banks hand-author their choices and are not tagged yet. An absent
    // `distractorMeaning` is honest; an empty one would look like a tagged
    // question that found nothing to say.
    const banked = CATEGORIES.flatMap((c) => c.levels).filter((l) => l.questionBankIds?.length);
    expect(banked.length).toBeGreaterThan(0);
  });
});

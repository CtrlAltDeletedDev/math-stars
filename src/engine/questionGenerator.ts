import { Question } from '@/types';
import { generateWordProblem, wordProblemFromId } from '@/data/wordProblems';
import { fractionFromId } from '@/data/fractions';
import { moneyFromId } from '@/data/moneyGen';
import { buildChoices, buildTaggedChoices, randomInt } from './choices';

// Distractors are the mistakes a first grader actually makes, not the integers
// nearest the answer. Picking a wrong option should tell us something: that she
// counted one too far, added when the sign said subtract, or landed on the wrong
// multiple. See src/engine/choices.ts for why this matters.

function additionQuestion(a: number, b: number, maxSum: number): Question {
  const correct = a + b;
  return {
    id: `add-${a}+${b}`,
    type: 'addition',
    prompt: `${a} + ${b} = ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(
      correct,
      [
        [correct - 1, 'off-by-one'], // counted one short (the classic counting-on slip)
        [correct + 1, 'off-by-one'], // counted one too far
        [Math.abs(a - b), 'wrong-operation'], // subtracted instead of adding
        [a, 'answered-a-given-number'], // forgot to add the second number
        [b, 'answered-a-given-number'],
        [correct + 10, 'place-value'], // dropped a ten
      ],
      { step: 1 },
    ),
    difficulty: Math.max(1, Math.ceil(maxSum / 5)),
  };
}

function subtractionQuestion(a: number, b: number, maxMinuend: number): Question {
  const correct = a - b;
  return {
    id: `sub-${a}-${b}`,
    type: 'subtraction',
    prompt: `${a} - ${b} = ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(
      correct,
      // Deliberately balanced above and below the answer. A pool weighted
      // upward (a+b, a, correct+1) would park the answer at the same rank in the
      // sorted options, which is the pattern this rewrite exists to remove.
      [
        [a + b, 'wrong-operation'], // added instead of subtracting — the most common error by far
        [correct + 1, 'off-by-one'], // counted one short on the way down
        [correct - 1, 'off-by-one'], // counted one too far
        correct - 2,
        [b, 'answered-a-given-number'], // answered with the number being taken away
        [a, 'answered-a-given-number'], // forgot to take anything away
        Math.max(0, b - 1),
        // Place-value slips. These matter most when b is small: for "12 - 1"
        // every mistake above lands within two of the answer, so the four
        // options come out as four consecutive integers and the answer sits at
        // a predictable rank — the exact tell this file exists to remove. Taking
        // the ten away as well, or leaving it behind, are errors a first grader
        // genuinely makes, and they land far enough out to break up the run.
        [a >= 10 ? a - 10 : -1, 'place-value'],
        [a >= 10 ? correct - 10 : -1, 'place-value'],
      ],
      { step: 1, isValid: (n) => n >= 0 && n <= Math.max(maxMinuend, a + b) },
    ),
    difficulty: Math.max(1, Math.ceil(maxMinuend / 5)),
  };
}

export function generateAdditionQuestion(maxSum: number): Question {
  // Pick the answer (sum) first to get uniform distribution across all possible results,
  // then split it randomly into two operands.
  const sum = randomInt(1, maxSum); // min 1 avoids trivial 0+0
  const a = randomInt(0, sum);
  return additionQuestion(a, sum - a, maxSum);
}

export function generateSubtractionQuestion(maxMinuend: number): Question {
  // Pick the result (difference) first for uniform distribution, then choose minuend.
  const correct = randomInt(0, maxMinuend - 1);
  const a = randomInt(correct + 1, maxMinuend); // ensures b = a - correct >= 1
  return subtractionQuestion(a, a - correct, maxMinuend);
}

// --- Targeted fact practice -----------------------------------------------
//
// "She's working on +2 and -1 this week" is the single most common thing a
// parent knows, and until now there was no way to ask for it. A level capped at
// "sums to 10" spreads its questions over every pair that fits, so only about
// one question in four was actually a +2. These two keep the operation fixed and
// vary the number she starts from, which is exactly how the fact is drilled at
// school: 3 + 2, then 7 + 2, then 15 + 2.
//
// They deliberately reuse additionQuestion/subtractionQuestion, so a targeted
// "7 + 2" is the same question — same id, same SRS card — as a "7 + 2" that the
// general adding level happened to produce. The fact is the fact.

export function generateTargetedAdditionQuestion(addend: number, maxSum: number): Question {
  // Start from 1, not 0: "0 + 2" teaches nothing about counting on.
  const a = randomInt(1, Math.max(1, maxSum - addend));
  return additionQuestion(a, addend, maxSum);
}

export function generateTargetedSubtractionQuestion(subtrahend: number, maxMinuend: number): Question {
  // From the subtrahend upward, so the answer is never negative. Starting *at*
  // it is kept on purpose: "2 - 2 = 0" is a real fact she is taught.
  const a = randomInt(subtrahend, Math.max(subtrahend, maxMinuend));
  return subtractionQuestion(a, subtrahend, maxMinuend);
}

function missingAddQuestion(a: number, sum: number, maxSum: number): Question {
  const missing = sum - a;
  return {
    id: `miss-add-${a}+x=${sum}`,
    type: 'missing_number',
    prompt: `${a} + ? = ${sum}`,
    correctAnswer: String(missing),
    ...buildTaggedChoices(
      missing,
      [
        [sum, 'answered-the-whole'], // answered with the total instead of the part
        [a, 'answered-a-given-number'], // answered with the part already shown
        [sum + a, 'wrong-operation'], // added the two visible numbers
        [missing - 1, 'off-by-one'],
        [missing + 1, 'off-by-one'],
      ],
      { step: 1 },
    ),
    difficulty: Math.max(2, Math.ceil(maxSum / 7)),
    hint: `Start at ${a} and count up until you reach ${sum}. How many did you count?`,
    speakText: `${a} plus what equals ${sum}?`,
  };
}

function missingSubQuestion(a: number, result: number, maxSum: number): Question {
  const missing = a - result;
  return {
    id: `miss-sub-${a}-x=${result}`,
    type: 'missing_number',
    prompt: `${a} − ? = ${result}`,
    correctAnswer: String(missing),
    ...buildTaggedChoices(
      missing,
      [
        [a, 'answered-the-whole'], // answered with the starting number
        [result, 'reversed'], // answered with what's left
        [a + result, 'wrong-operation'], // added the two visible numbers
        [missing - 1, 'off-by-one'],
        [missing + 1, 'off-by-one'],
      ],
      { step: 1 },
    ),
    difficulty: Math.max(2, Math.ceil(maxSum / 7)),
    hint: `Start at ${result} and count up to ${a}. How many steps was that?`,
    speakText: `${a} minus what equals ${result}?`,
  };
}

export function generateMissingNumberQuestion(maxSum: number, kind: 'addition' | 'subtraction' | 'both'): Question {
  const useAdd = kind === 'addition' || (kind === 'both' && Math.random() < 0.5);
  if (useAdd) {
    const sum = randomInt(2, maxSum);
    const a = randomInt(0, sum);
    return missingAddQuestion(a, sum, maxSum);
  }
  const a = randomInt(2, maxSum);
  const result = randomInt(0, a - 1);
  return missingSubQuestion(a, result, maxSum);
}

function skipCountQuestion(by: number, start: number, steps: number, maxStart: number): Question {
  const sequence = Array.from({ length: steps }, (_, i) => start + i * by);
  const correct = start + steps * by;
  const last = sequence[sequence.length - 1];
  return {
    id: `skip-${by}-${start}-${steps}`,
    type: 'skip_count',
    prompt: `${sequence.join(', ')}, ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(
      correct,
      [
        // Wrong multiples — the mistakes that mean something when counting by `by`.
        [correct + by, 'wrong-multiple'], // skipped a step
        [correct - by, 'wrong-multiple'], // repeated the last number
        [last + 1, 'counted-the-wrong-thing'], // counted by ones instead of by `by`
        [correct + 1, 'off-by-one'], // off by one on the multiple
        [correct + by * 2, 'wrong-multiple'],
      ],
      { step: by, isValid: (n) => n >= 0 && n <= maxStart + by * 12 },
    ),
    difficulty: by === 2 ? 2 : by === 5 ? 3 : 4,
  };
}

export function generateSkipCountQuestion(by: number, maxStart: number): Question {
  const start = randomInt(0, Math.floor(maxStart / by)) * by;
  const steps = randomInt(2, 5);
  return skipCountQuestion(by, start, steps, maxStart);
}

function multiplicationQuestion(table: number, b: number): Question {
  const correct = table * b;
  return {
    id: `mul-${table}x${b}`,
    type: 'multiplication',
    prompt: `${table} × ${b} = ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(
      correct,
      [
        [correct + table, 'wrong-multiple'], // one group too many
        [correct - table, 'wrong-multiple'], // one group too few
        [table + b, 'wrong-operation'], // added instead of multiplying
        [correct + table * 2, 'wrong-multiple'],
        // No correct±1 here: nobody answers 41 for 5 × 8. The step-based
        // top-up supplies wrong *multiples*, which is the mistake that happens.
      ],
      { step: table },
    ),
    difficulty: 4,
  };
}

export function generateMultiplicationQuestion(tables: number[]): Question {
  const table = tables[randomInt(0, tables.length - 1)];
  // 1..12 rather than 1..10: a 10-question session needs more than 10 distinct
  // facts or the pool builder can come up short.
  return multiplicationQuestion(table, randomInt(1, 12));
}

// --- First-grade strategy work -------------------------------------------
//
// These three are the backbone of Grade 1 addition and none of them existed:
// doubles are memorised as anchors, making ten is how you break a hard sum
// into an easy one, and counting on is the first real strategy that replaces
// counting everything from one.

function doublesQuestion(a: number): Question {
  const correct = a * 2;
  return {
    id: `dbl-${a}`,
    type: 'addition',
    prompt: `${a} + ${a} = ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(correct, [
      [correct - 1, 'off-by-one'], [correct + 1, 'off-by-one'],
      correct - 2, correct + 2,
      [a, 'answered-a-given-number'], // gave one half instead of the double
    ], { step: 1 }),
    difficulty: a <= 5 ? 1 : 2,
    hint: `A double! ${a} and another ${a}.`,
    speakText: `${a} plus ${a}?`,
  };
}

function makeTenQuestion(target: number, a: number): Question {
  const correct = target - a;
  return {
    id: `mk${target}-${a}`,
    type: 'missing_number',
    prompt: `${a} + ? = ${target}`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(correct, [
      [target, 'answered-the-whole'], [a, 'answered-a-given-number'],
      [target + a, 'wrong-operation'],
      [correct - 1, 'off-by-one'], [correct + 1, 'off-by-one'],
    ], { step: 1 }),
    difficulty: target <= 10 ? 1 : 2,
    hint: `How many more to get from ${a} up to ${target}?`,
    speakText: `${a} plus what makes ${target}?`,
  };
}

function countOnQuestion(a: number, b: number): Question {
  const correct = a + b;
  return {
    id: `cnt-${a}+${b}`,
    type: 'addition',
    prompt: `${a} + ${b} = ?`,
    correctAnswer: String(correct),
    ...buildTaggedChoices(correct, [
      [correct - 1, 'off-by-one'], [correct + 1, 'off-by-one'],
      [a, 'answered-a-given-number'], [b, 'answered-a-given-number'],
      [correct + 10, 'place-value'],
    ], { step: 1 }),
    difficulty: 1,
    hint: `Start at ${a} and count on ${b}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}.`,
    speakText: `${a} plus ${b}?`,
  };
}

export function generateDoublesQuestion(maxAddend: number): Question {
  return doublesQuestion(randomInt(1, maxAddend));
}

export function generateMakeTenQuestion(target: number): Question {
  // "8 + ? = 10" — the pairs that bridge to a ten. The full 0..target range,
  // not 1..target-1: the two ends are real bonds a first grader is taught, and
  // without them a target of 10 yields only 9 distinct questions, one short of
  // filling a session.
  return makeTenQuestion(target, randomInt(0, target));
}

export function generateCountOnQuestion(maxStart: number): Question {
  // Deliberately a big number plus a small one, which is what makes counting on
  // pay off compared with counting everything from one.
  const a = randomInt(Math.max(3, Math.floor(maxStart / 2)), maxStart);
  return countOnQuestion(a, randomInt(1, 3));
}

// Rebuild a generated question from its deterministic ID (used by the
// review session, where SRS cards reference questions no bank contains).
export function questionFromId(id: string, characterName = 'You'): Question | null {
  let m = id.match(/^add-(\d+)\+(\d+)$/);
  if (m) return additionQuestion(+m[1], +m[2], +m[1] + +m[2]);
  m = id.match(/^sub-(\d+)-(\d+)$/);
  if (m) return subtractionQuestion(+m[1], +m[2], +m[1]);
  m = id.match(/^miss-add-(\d+)\+x=(\d+)$/);
  if (m) return missingAddQuestion(+m[1], +m[2], +m[2]);
  m = id.match(/^miss-sub-(\d+)-x=(\d+)$/);
  if (m) return missingSubQuestion(+m[1], +m[2], +m[1]);
  m = id.match(/^mul-(\d+)x(\d+)$/);
  if (m) return multiplicationQuestion(+m[1], +m[2]);
  if (id.startsWith('wp-')) return wordProblemFromId(id, characterName);
  m = id.match(/^dbl-(\d+)$/);
  if (m) return doublesQuestion(+m[1]);
  m = id.match(/^mk(\d+)-(\d+)$/);
  if (m) return makeTenQuestion(+m[1], +m[2]);
  m = id.match(/^cnt-(\d+)\+(\d+)$/);
  if (m) return countOnQuestion(+m[1], +m[2]);
  m = id.match(/^skip-(\d+)-(\d+)-(\d+)$/);
  if (m) return skipCountQuestion(+m[1], +m[2], +m[3], +m[2] + +m[1] * +m[3]);
  if (id.startsWith('frac-')) return fractionFromId(id);
  if (id.startsWith('money-')) return moneyFromId(id);
  return null;
}

export function generateFromParams(params: Record<string, number | string>, characterName = 'You'): Question {
  const op = params.operation as string;
  if (op === 'addition') {
    if (params.fixedAddend !== undefined) {
      return generateTargetedAdditionQuestion(Number(params.fixedAddend), Number(params.maxSum));
    }
    return generateAdditionQuestion(Number(params.maxSum));
  }
  if (op === 'subtraction') {
    if (params.fixedSubtrahend !== undefined) {
      return generateTargetedSubtractionQuestion(Number(params.fixedSubtrahend), Number(params.maxMinuend));
    }
    return generateSubtractionQuestion(Number(params.maxMinuend));
  }
  if (op === 'mixed') {
    const addFirst = Math.random() < 0.5;
    if (addFirst && params.fixedAddend !== undefined) {
      return generateTargetedAdditionQuestion(Number(params.fixedAddend), Number(params.maxSum));
    }
    if (addFirst) return generateAdditionQuestion(Number(params.maxSum));
    if (params.fixedSubtrahend !== undefined) {
      return generateTargetedSubtractionQuestion(Number(params.fixedSubtrahend), Number(params.maxMinuend));
    }
    return generateSubtractionQuestion(Number(params.maxMinuend));
  }
  if (op === 'word_problem') {
    const type = (params.wordType as string) ?? 'mixed';
    return generateWordProblem(characterName, type as 'addition' | 'subtraction' | 'mixed');
  }
  if (op === 'missing') {
    const kind = (params.kind as 'addition' | 'subtraction' | 'both') ?? 'both';
    return generateMissingNumberQuestion(Number(params.maxSum), kind);
  }
  if (op === 'doubles') return generateDoublesQuestion(Number(params.maxAddend));
  if (op === 'make_ten') return generateMakeTenQuestion(Number(params.target));
  if (op === 'count_on') return generateCountOnQuestion(Number(params.maxStart));
  if (op === 'skip_count') return generateSkipCountQuestion(Number(params.by), Number(params.maxStart));
  if (op === 'multiplication') {
    const tables = String(params.tables).split(',').map(Number);
    return generateMultiplicationQuestion(tables);
  }
  return generateAdditionQuestion(10);
}

/**
 * Can a question id be turned back into a question?
 *
 * Cheap prefix check, no construction, because it runs over every SRS card on
 * every Home render. Fraction and money questions mint ids that neither this
 * function nor the bank can resolve, so counting them made the "Practice
 * Mistakes -- N to review" badge promise work the review session could not
 * deliver, landing her on "Nothing to practice!" every single time.
 */
export function canRebuildFromId(id: string): boolean {
  return (
    /^add-\d+\+\d+$/.test(id) ||
    /^sub-\d+-\d+$/.test(id) ||
    /^miss-add-\d+\+x=\d+$/.test(id) ||
    /^miss-sub-\d+-x=\d+$/.test(id) ||
    /^mul-\d+x\d+$/.test(id) ||
    /^dbl-\d+$/.test(id) ||
    /^mk\d+-\d+$/.test(id) ||
    /^cnt-\d+\+\d+$/.test(id) ||
    /^skip-\d+-\d+-\d+$/.test(id) ||
    id.startsWith('wp-') ||
    // Fractions and money were excluded here, which meant pruneSRSCards deleted
    // every one of their cards on the next save. Both are deterministic; the
    // stricter check below is the shape the rebuilders actually accept.
    /^frac-(shaded|which)-(circle|bar)-\d+(-\d+)?$/.test(id) ||
    /^frac-set-\d+-\d+$/.test(id) ||
    /^frac-cmp-(biggest|smallest)-\d+(-\d+)+$/.test(id) ||
    /^money-(name|like)-[a-z]+(-\d+)?$/.test(id) ||
    /^money-mixed-\d+(-\d+)*$/.test(id) ||
    /^money-change-\d+-\d+$/.test(id)
  );
}

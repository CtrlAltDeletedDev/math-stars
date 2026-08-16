import { Question } from '@/types';
import { generateWordProblem } from '@/data/wordProblems';
import { buildChoices, randomInt } from './choices';

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
    choices: buildChoices(
      correct,
      [
        correct - 1, // counted one short (the classic counting-on slip)
        correct + 1, // counted one too far
        Math.abs(a - b), // subtracted instead of adding
        a, // forgot to add the second number
        b,
        correct + 10, // dropped a ten
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
    choices: buildChoices(
      correct,
      // Deliberately balanced above and below the answer. A pool weighted
      // upward (a+b, a, correct+1) would park the answer at the same rank in the
      // sorted options, which is the pattern this rewrite exists to remove.
      [
        a + b, // added instead of subtracting — the most common error by far
        correct + 1, // counted one short on the way down
        correct - 1, // counted one too far
        correct - 2,
        b, // answered with the number being taken away
        a, // forgot to take anything away
        Math.max(0, b - 1),
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

function missingAddQuestion(a: number, sum: number, maxSum: number): Question {
  const missing = sum - a;
  return {
    id: `miss-add-${a}+x=${sum}`,
    type: 'missing_number',
    prompt: `${a} + ? = ${sum}`,
    correctAnswer: String(missing),
    choices: buildChoices(
      missing,
      [
        sum, // answered with the total instead of the part
        a, // answered with the part already shown
        sum + a, // added the two visible numbers
        missing - 1,
        missing + 1,
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
    choices: buildChoices(
      missing,
      [
        a, // answered with the starting number
        result, // answered with what's left
        a + result, // added the two visible numbers
        missing - 1,
        missing + 1,
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
    choices: buildChoices(
      correct,
      [
        // Wrong multiples — the mistakes that mean something when counting by `by`.
        correct + by, // skipped a step
        correct - by, // repeated the last number
        last + 1, // counted by ones instead of by `by`
        correct + 1, // off by one on the multiple
        correct + by * 2,
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
    choices: buildChoices(
      correct,
      [
        correct + table, // one group too many
        correct - table, // one group too few
        table + b, // added instead of multiplying
        correct + table * 2,
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

// Rebuild a generated question from its deterministic ID (used by the
// review session, where SRS cards reference questions no bank contains).
export function questionFromId(id: string): Question | null {
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
  m = id.match(/^skip-(\d+)-(\d+)-(\d+)$/);
  if (m) return skipCountQuestion(+m[1], +m[2], +m[3], +m[2] + +m[1] * +m[3]);
  return null;
}

export function generateFromParams(params: Record<string, number | string>, characterName = 'You'): Question {
  const op = params.operation as string;
  if (op === 'addition') return generateAdditionQuestion(Number(params.maxSum));
  if (op === 'subtraction') return generateSubtractionQuestion(Number(params.maxMinuend));
  if (op === 'mixed') {
    if (Math.random() < 0.5) return generateAdditionQuestion(Number(params.maxSum));
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
  if (op === 'skip_count') return generateSkipCountQuestion(Number(params.by), Number(params.maxStart));
  if (op === 'multiplication') {
    const tables = String(params.tables).split(',').map(Number);
    return generateMultiplicationQuestion(tables);
  }
  return generateAdditionQuestion(10);
}

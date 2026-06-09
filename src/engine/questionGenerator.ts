import { Question, QuestionType } from '@/types';
import { generateWordProblem } from '@/data/wordProblems';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(correct: number, min: number, max: number): string[] {
  // Expand range if needed so there are always at least 4 distinct non-negative
  // integers available — prevents infinite loop when the caller passes a tiny range.
  const lo = 0;
  const hi = Math.max(max, correct + 3, 3);

  const wrong = new Set<number>();
  const candidates = [correct - 2, correct - 1, correct + 1, correct + 2];

  for (const c of candidates) {
    if (c !== correct && c >= lo && c <= hi) wrong.add(c);
    if (wrong.size === 3) break;
  }

  while (wrong.size < 3) {
    const v = randomInt(lo, hi);
    if (v !== correct) wrong.add(v);
  }

  return shuffle([correct, ...Array.from(wrong)]).map(String);
}

function additionQuestion(a: number, b: number, maxSum: number): Question {
  const correct = a + b;
  return {
    id: `add-${a}+${b}`,
    type: 'addition',
    prompt: `${a} + ${b} = ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, maxSum + 2),
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
    choices: generateChoices(correct, 0, a),
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
    choices: generateChoices(missing, 0, maxSum),
    difficulty: Math.max(2, Math.ceil(maxSum / 7)),
    hint: `Count up from ${a} until you reach ${sum}!`,
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
    choices: generateChoices(missing, 0, maxSum),
    difficulty: Math.max(2, Math.ceil(maxSum / 7)),
    hint: `How far is it from ${result} back up to ${a}?`,
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
  if (m) {
    const correct = +m[1] * +m[2];
    return {
      id,
      type: 'multiplication',
      prompt: `${m[1]} × ${m[2]} = ?`,
      correctAnswer: String(correct),
      choices: generateChoices(correct, 0, correct + 15),
      difficulty: 4,
    };
  }
  m = id.match(/^skip-(\d+)-(\d+)-(\d+)$/);
  if (m) {
    const [by, start, steps] = [+m[1], +m[2], +m[3]];
    const sequence = Array.from({ length: steps }, (_, i) => start + i * by);
    const correct = start + steps * by;
    return {
      id,
      type: 'skip_count',
      prompt: `${sequence.join(', ')}, ?`,
      correctAnswer: String(correct),
      choices: generateChoices(correct, 0, correct + by * 3),
      difficulty: by === 2 ? 2 : by === 5 ? 3 : 4,
    };
  }
  return null;
}

export function generateSkipCountQuestion(by: number, maxStart: number): Question {
  const start = randomInt(0, maxStart / by) * by;
  const steps = randomInt(2, 5);
  const sequence = Array.from({ length: steps }, (_, i) => start + i * by);
  const correct = start + steps * by;
  return {
    id: `skip-${by}-${start}-${steps}`,
    type: 'skip_count',
    prompt: `${sequence.join(', ')}, ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, maxStart + by * 6),
    difficulty: by === 2 ? 2 : by === 5 ? 3 : 4,
  };
}

export function generateMultiplicationQuestion(tables: number[]): Question {
  const table = tables[randomInt(0, tables.length - 1)];
  const b = randomInt(1, 10);
  const correct = table * b;
  return {
    id: `mul-${table}x${b}`,
    type: 'multiplication',
    prompt: `${table} × ${b} = ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, correct + 15),
    difficulty: 4,
  };
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

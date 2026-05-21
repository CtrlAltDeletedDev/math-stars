import { Question, QuestionType } from '@/types';

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
  const wrong = new Set<number>();
  const candidates = [correct - 2, correct - 1, correct + 1, correct + 2];

  for (const c of candidates) {
    if (c !== correct && c >= min && c <= max) wrong.add(c);
    if (wrong.size === 3) break;
  }

  while (wrong.size < 3) {
    const v = randomInt(min, max);
    if (v !== correct) wrong.add(v);
  }

  return shuffle([correct, ...Array.from(wrong)]).map(String);
}

export function generateAdditionQuestion(maxSum: number): Question {
  const a = randomInt(0, maxSum);
  const b = randomInt(0, maxSum - a);
  const correct = a + b;
  return {
    id: `add-${a}+${b}-${Date.now()}`,
    type: 'addition',
    prompt: `${a} + ${b} = ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, maxSum + 2),
    difficulty: Math.max(1, Math.ceil(maxSum / 5)),
  };
}

export function generateSubtractionQuestion(maxMinuend: number): Question {
  const a = randomInt(1, maxMinuend);
  const b = randomInt(0, a);
  const correct = a - b;
  return {
    id: `sub-${a}-${b}-${Date.now()}`,
    type: 'subtraction',
    prompt: `${a} - ${b} = ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, a),
    difficulty: Math.max(1, Math.ceil(maxMinuend / 5)),
  };
}

export function generateSkipCountQuestion(by: number, maxStart: number): Question {
  const start = randomInt(0, maxStart / by) * by;
  const steps = randomInt(2, 5);
  const sequence = Array.from({ length: steps }, (_, i) => start + i * by);
  const correct = start + steps * by;
  return {
    id: `skip-${by}-${start}-${steps}-${Date.now()}`,
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
    id: `mul-${table}x${b}-${Date.now()}`,
    type: 'multiplication',
    prompt: `${table} × ${b} = ?`,
    correctAnswer: String(correct),
    choices: generateChoices(correct, 0, correct + 15),
    difficulty: 4,
  };
}

export function generateFromParams(params: Record<string, number | string>): Question {
  const op = params.operation as string;
  if (op === 'addition') return generateAdditionQuestion(Number(params.maxSum));
  if (op === 'subtraction') return generateSubtractionQuestion(Number(params.maxMinuend));
  if (op === 'mixed') {
    if (Math.random() < 0.5) return generateAdditionQuestion(Number(params.maxSum));
    return generateSubtractionQuestion(Number(params.maxMinuend));
  }
  if (op === 'skip_count') return generateSkipCountQuestion(Number(params.by), Number(params.maxStart));
  if (op === 'multiplication') {
    const tables = String(params.tables).split(',').map(Number);
    return generateMultiplicationQuestion(tables);
  }
  return generateAdditionQuestion(10);
}

import { Question } from '@/types';

function ff(
  a: number,
  b: number,
  subB: boolean, // true = subtract b, false = subtract a
): Question {
  const sum = a + b;
  const subtracted = subB ? b : a;
  const correct = subB ? a : b;
  const id = `ff-${a}-${b}-${subB ? 'sub2' : 'sub1'}`;
  const wrongA = Math.max(0, correct - 1);
  const wrongB = correct + 1;
  const wrongC = subB ? b : a; // the other addend — common wrong answer
  const choices = shuffle4([String(correct), String(wrongA), String(wrongB), String(wrongC)], id);
  return {
    id,
    type: 'fact_family',
    prompt: `${a} + ${b} = ${sum}, so ${sum} − ${subtracted} = ?`,
    correctAnswer: String(correct),
    choices,
    difficulty: sum <= 10 ? 2 : 3,
    hint: `The answer is the part that's left: ${sum} − ${subtracted} = ${correct}`,
    speakText: `${a} plus ${b} equals ${sum}, so ${sum} minus ${subtracted} equals what?`,
  };
}

// Simple deterministic shuffler so choices aren't always in the same order
function shuffle4(arr: string[], seed: string): string[] {
  const n = seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const a = [...arr];
  const i0 = n % 4, i1 = (n + 1) % 4;
  [a[0], a[i0]] = [a[i0], a[0]];
  [a[1], a[i1]] = [a[i1], a[1]];
  return a;
}

// Level 1: sums up to 10
export const FACT_FAMILIES_10: Question[] = [
  ff(2, 1, false), ff(2, 1, true),
  ff(3, 2, false), ff(3, 2, true),
  ff(4, 2, false), ff(4, 2, true),
  ff(3, 3, false),
  ff(4, 3, false), ff(4, 3, true),
  ff(5, 2, false), ff(5, 2, true),
  ff(5, 4, false), ff(5, 4, true),
  ff(6, 3, false), ff(6, 3, true),
  ff(6, 4, false),
  ff(7, 2, false), ff(7, 2, true),
  ff(8, 2, false),
  ff(5, 5, false),
];

// Level 2: sums 11–18
export const FACT_FAMILIES_20: Question[] = [
  ff(6, 5, false), ff(6, 5, true),
  ff(7, 4, false), ff(7, 4, true),
  ff(8, 3, false), ff(8, 3, true),
  ff(9, 2, false), ff(9, 2, true),
  ff(7, 5, false), ff(7, 5, true),
  ff(8, 4, false), ff(8, 4, true),
  ff(6, 7, false), ff(6, 7, true),
  ff(8, 5, false), ff(8, 5, true),
  ff(9, 4, false), ff(9, 4, true),
  ff(9, 9, false),
];

export const ALL_FACT_FAMILIES_QUESTIONS: Question[] = [
  ...FACT_FAMILIES_10,
  ...FACT_FAMILIES_20,
];

import { ErrorTag, Question } from '@/types';

// What a typed wrong answer means.
//
// With four choices, each wrong option carried its meaning because we wrote
// it. With a number pad she can type anything, which is better evidence: 12
// for 9 − 3 is her adding instead, not an option we happened to offer. These
// are the same mistakes the old distractors modelled.

function parts(prompt: string): { a: number; b: number; op: '+' | '-' } | null {
  const m = prompt.match(/^(\d+)\s*([+\-−])\s*(\d+)\s*=\s*\?$/);
  if (!m) return null;
  return { a: Number(m[1]), b: Number(m[3]), op: m[2] === '+' ? '+' : '-' };
}

export function classifyTyped(q: Question, typed: string): ErrorTag {
  const n = Number(typed);
  const answer = Number(q.correctAnswer);
  if (!Number.isFinite(n) || n === answer) return 'unknown';
  const p = parts(q.prompt);
  if (!p) return q.distractorMeaning?.[typed] ?? 'unknown';
  const { a, b, op } = p;
  if (op === '-' && n === a + b) return 'wrong-operation';
  if (op === '+' && n === Math.abs(a - b) && a !== b) return 'wrong-operation';
  if (Math.abs(n - answer) === 1) return 'off-by-one';
  if (n === a || n === b) return 'answered-a-given-number';
  if (Math.abs(n - answer) === 10) return 'place-value';
  return 'unknown';
}

import { Item, Lesson, TeachStep } from '@/learn/types';

// The order a lesson is played in, as a flat list of cards.
//
//   intro      the lesson's title, and a Start tap (which also unlocks speech)
//   warm-up    up to three questions from lessons they did before
//   teach      the lesson's show / do / ask steps, in its own order
//   practice   "you do": the picture is there for the first half, then waits
//              behind "Show me"
//   check      no picture and no hints; how they do here decides the stone
//   result
//
// Pure, so the shape of every lesson is testable without a screen.

/** How much help a question comes with. */
export type Support = 'picture' | 'tap' | 'none';

export type Card =
  | { kind: 'intro' }
  | { kind: 'item'; phase: 'warmup' | 'practice' | 'check'; item: Item; support: Support }
  | { kind: 'teach'; step: TeachStep; index: number }
  | { kind: 'result' };

export const DEFAULT_PRACTICE = 6;
export const DEFAULT_CHECK = 4;

/** A few draws, so one lesson's questions do not repeat each other. */
function distinct(gen: () => Item, n: number, avoid: Set<string>): Item[] {
  const out: Item[] = [];
  for (let i = 0; i < n; i++) {
    let item = gen();
    for (let tries = 0; tries < 10 && avoid.has(item.id); tries++) item = gen();
    avoid.add(item.id);
    out.push(item);
  }
  return out;
}

export function lessonCards(lesson: Lesson, warmups: Item[] = []): Card[] {
  const seen = new Set<string>();
  const cards: Card[] = [{ kind: 'intro' }];
  for (const item of warmups.slice(0, 3)) {
    seen.add(item.id);
    cards.push({ kind: 'item', phase: 'warmup', item, support: 'tap' });
  }
  lesson.teach.forEach((step, index) => {
    if (step.type === 'ask') seen.add(step.item.id);
    cards.push({ kind: 'teach', step, index });
  });
  const practice = distinct(lesson.practice, lesson.practiceCount ?? DEFAULT_PRACTICE, seen);
  practice.forEach((item, i) => {
    cards.push({ kind: 'item', phase: 'practice', item, support: i < Math.ceil(practice.length / 2) ? 'picture' : 'tap' });
  });
  for (const item of distinct(lesson.check ?? lesson.practice, lesson.checkCount ?? DEFAULT_CHECK, seen)) {
    cards.push({ kind: 'item', phase: 'check', item, support: 'none' });
  }
  cards.push({ kind: 'result' });
  return cards;
}

/** The check's score from the first-try results recorded so far. */
export function checkScore(cards: Card[], firstTry: Record<number, boolean>): { right: number; total: number } {
  let right = 0;
  let total = 0;
  cards.forEach((c, i) => {
    if (c.kind === 'item' && c.phase === 'check') {
      total++;
      if (firstTry[i]) right++;
    }
  });
  return { right, total };
}

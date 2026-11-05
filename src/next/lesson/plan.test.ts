import { describe, it, expect } from 'vitest';
import { lessonCards, checkScore, DEFAULT_CHECK, DEFAULT_PRACTICE } from './plan';
import { Item, Lesson } from '@/learn/types';

let n = 0;
const item = (id = `add-${n}+1`): Item => ({ id, say: 'x', prompt: `${n++} + 1 = ?`, answer: '1', input: 'number', picture: { model: 'text', text: 'x' } });
const lesson: Lesson = {
  id: 'fixture', title: 'Fixture', goal: 'A lesson for testing the plan.', emoji: '🧪',
  teach: [
    { type: 'show', say: 'a', model: { model: 'text', text: '1' } },
    { type: 'do', say: 'b', model: { model: 'text', text: '1' }, goal: () => false, solution: { model: 'text', text: '2' }, hint: 'h', then: 't' },
  ],
  practice: () => item(),
};

describe('a lesson, card by card', () => {
  it('goes intro, warm-up, teach, practice, check, result', () => {
    const cards = lessonCards(lesson, [item('w1'), item('w2'), item('w3'), item('w4')]);
    const shape = cards.map((c) => (c.kind === 'item' ? c.phase : c.kind));
    expect(shape).toEqual([
      'intro', 'warmup', 'warmup', 'warmup', 'teach', 'teach',
      ...Array(DEFAULT_PRACTICE).fill('practice'), ...Array(DEFAULT_CHECK).fill('check'), 'result',
    ]);
  });

  it('shows the picture for the first half of practice, then behind Show me, and none in the check', () => {
    const cards = lessonCards(lesson);
    const supports = cards.flatMap((c) => (c.kind === 'item' ? [`${c.phase}:${c.support}`] : []));
    expect(supports).toEqual([
      'practice:picture', 'practice:picture', 'practice:picture', 'practice:tap', 'practice:tap', 'practice:tap',
      'check:none', 'check:none', 'check:none', 'check:none',
    ]);
  });

  it('does not ask the same question twice in one lesson when it can help it', () => {
    let k = 0;
    const few = { ...lesson, practice: () => item(`add-${k++ % 20}+1`) };
    const ids = lessonCards(few).flatMap((c) => (c.kind === 'item' ? [c.item.id] : []));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scores only the check', () => {
    const cards = lessonCards(lesson);
    const firstTry: Record<number, boolean> = {};
    cards.forEach((c, i) => { if (c.kind === 'item') firstTry[i] = c.phase !== 'check'; });
    expect(checkScore(cards, firstTry)).toEqual({ right: 0, total: DEFAULT_CHECK });
  });
});

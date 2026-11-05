import { describe, it, expect } from 'vitest';
import { answerPlacement, applyPlacement, placementItem, startPlacement, MAX_QUESTIONS, PlacementState } from './placement';
import { COURSE } from './course';
import { lessonDone, todaysLesson } from './progress';
import { newLearner, Learner } from '@/core/learner';
import { parseLearner } from '@/core/validate';
import { todayString } from '@/engine/dates';
import { Lesson, Unit } from './types';
import { GradeCourse } from './units';

// A small course of its own, so these tests do not move when lessons are written.
const lesson = (id: string): Lesson => ({
  id, title: id, goal: 'A lesson for testing placement.', emoji: '🧪', teach: [],
  practice: () => ({ id: `${id}-q`, say: 's', prompt: '1 + 1 = ?', answer: '2', input: 'number' }),
});
const unit = (id: string, n: number): Unit => ({
  id, title: id, emoji: '📦', about: 'x', colour: '#000',
  lessons: Array.from({ length: n }, (_, i) => lesson(`${id}-${i + 1}`)),
});
const course: GradeCourse[] = [
  { grade: '1', title: '1st grade', units: [unit('a', 3), unit('empty', 0), unit('b', 4), unit('c', 2)] },
  { grade: '2', title: '2nd grade', units: [unit('d', 3)] },
];

/** Play placement with a child who knows every lesson whose id is in `knows`. */
function run(knows: (lessonId: string) => boolean, l: Learner = newLearner()): { s: PlacementState; asked: string[] } {
  let s = startPlacement(l, course);
  const asked: string[] = [];
  while (!s.done) {
    const { lesson: from } = placementItem(s)!;
    asked.push(from.id);
    s = answerPlacement(s, knows(from.id));
  }
  return { s, asked };
}

describe('finding the level', () => {
  it('starts a child who knows nothing at the first lesson, after a couple of questions', () => {
    const { s, asked } = run(() => false);
    expect(s.start).toBe('a-1');
    expect(s.known).toEqual([]);
    expect(asked).toEqual(['a-3', 'a-1']);
  });

  it('skips whole units the child knows, two questions each, and skips empty units', () => {
    const { s, asked } = run((id) => id.startsWith('a') || ['b-1', 'b-2'].includes(id));
    expect(asked.slice(0, 2)).toEqual(['a-3', 'a-3']);
    expect(s.known).toEqual(['a-1', 'a-2', 'a-3', 'b-1', 'b-2']);
    expect(s.start).toBe('b-3');
  });

  it('starts on the unit\'s last lesson when every earlier one is known', () => {
    const { s } = run((id) => id !== 'b-4' && !id.startsWith('c') && !id.startsWith('d'));
    expect(s.start).toBe('b-4');
    expect(s.known).toContain('b-3');
  });

  it('carries on into the next grade, and finds nothing to start when it all is known', () => {
    const into2 = run((id) => !id.startsWith('d'));
    expect(into2.s.start).toBe('d-1');
    const all = run(() => true);
    expect(all.s.start).toBeNull();
    expect(all.s.known).toHaveLength(3 + 4 + 2 + 3);
  });

  it('starts at the child\'s grade', () => {
    const second = { ...newLearner(), profile: { ...newLearner().profile, grade: '2' as const } };
    expect(placementItem(startPlacement(second, course))!.lesson.id).toBe('d-3');
  });

  it('never runs longer than the cap', () => {
    expect(run(() => true).asked.length).toBeLessThanOrEqual(MAX_QUESTIONS);
  });
});

describe('recording placement', () => {
  it('marks the known lessons done and placed, keeps real passes, and records the day', () => {
    let l = newLearner();
    l = { ...l, lessons: { 'a-1': { tries: 2, best: 0.75, done: '2026-10-01', last: '2026-10-01' } } };
    const { s } = run((id) => id.startsWith('a'));
    const after = applyPlacement(l, s);
    expect(after.lessons['a-1']).toEqual(l.lessons['a-1']);
    expect(after.lessons['a-2']).toMatchObject({ done: todayString(), placed: true });
    expect(after.placedOn).toBe(todayString());
  });

  it('survives a save and reload', () => {
    const { s } = run((id) => id.startsWith('a'));
    const after = applyPlacement(newLearner(), s);
    expect(parseLearner(JSON.parse(JSON.stringify(after)))).toEqual(after);
  });

  it('moves today\'s lesson in the real course past what the child knows', () => {
    const lessons = COURSE[0].units.flatMap((u) => u.lessons);
    if (lessons.length < 8) return; // still being written
    let s = startPlacement(newLearner());
    const knownUnit = s.units[0].lessons.map((x) => x.id);
    while (!s.done) {
      const { lesson: from } = placementItem(s)!;
      s = answerPlacement(s, knownUnit.includes(from.id));
    }
    const l = applyPlacement(newLearner(), s);
    for (const id of knownUnit) expect(lessonDone(l, lessons.find((x) => x.id === id)!)).toBe(true);
    expect(todaysLesson(l)?.id).toBe(s.start);
  });
});

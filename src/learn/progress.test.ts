import { describe, it, expect } from 'vitest';
import { lessonDone, passed, recordItem, recordLesson, touchLesson, todaysLesson, warmupItems, PASS } from './progress';
import { LESSONS } from './course';
import { newLearner, Learner } from '@/core/learner';
import { newTrack } from '@/core/track';
import { todayString } from '@/engine/dates';
import { Lesson } from './types';

const fixture = (over: Partial<Lesson> = {}): Lesson => ({
  id: 'fx', title: 'Fixture', goal: 'For tests of progress.', emoji: '🧪', teach: [],
  practice: () => ({ id: 'add-2+3', say: 's', prompt: '2 + 3 = ?', answer: '5', input: 'number' }),
  ...over,
});

describe('lesson progress', () => {
  it('passes with all but one of four right, not with two', () => {
    expect(passed(3, 4)).toBe(true);
    expect(passed(2, 4)).toBe(false);
    expect(passed(0, 0)).toBe(false);
    expect(PASS).toBe(0.75);
  });

  it('records the first pass day and keeps it, with the best score', () => {
    let l = recordLesson(newLearner(), 'fx', 2, 4);
    expect(l.lessons.fx).toMatchObject({ tries: 1, best: 0.5, done: null });
    l = recordLesson(l, 'fx', 4, 4);
    expect(l.lessons.fx).toMatchObject({ tries: 2, best: 1, done: todayString() });
    l = recordLesson(l, 'fx', 1, 4);
    expect(l.lessons.fx).toMatchObject({ tries: 3, best: 1, done: todayString() });
  });

  it('counts a lesson done when her plus/minus path is already past it', () => {
    const l: Learner = { ...newLearner(), tracks: { plus: { ...newTrack(), stage: 4 }, minus: newTrack() } };
    expect(lessonDone(l, fixture({ placedBy: { track: 'plus', stage: 2 } }))).toBe(true);
    expect(lessonDone(l, fixture({ placedBy: { track: 'plus', stage: 4 } }))).toBe(false);
    expect(lessonDone(l, fixture())).toBe(false);
  });

  it('marks a lesson started without passing it', () => {
    expect(touchLesson(newLearner(), 'fx').lessons.fx).toMatchObject({ tries: 0, done: null });
  });

  it('records a fact item to the fact record, without moving her track', () => {
    const l = recordItem(newLearner(), fixture().practice(), false, '6', undefined);
    expect(l.facts['add-2+3']).toMatchObject({ seen: 1, right: 0, said: '6', tag: 'off-by-one' });
    expect(l.tracks.plus.recent).toEqual([]);
    expect(l.days[todayString()]).toMatchObject({ answered: 1, right: 0 });
  });

  it('records any other item toward today and her streak', () => {
    const l = recordItem(newLearner(), { id: 'clock-3-00', say: 's', prompt: 'What time?', answer: '3', input: 'number' }, true);
    expect(Object.keys(l.facts)).toEqual([]);
    expect(l.days[todayString()]).toMatchObject({ answered: 1, right: 1 });
    expect(l.streak.current).toBe(1);
  });

  it('gives today\'s lesson in course order, or a grown-up\'s pin', () => {
    if (LESSONS.length < 2) return; // the course is still being written
    const l = newLearner();
    expect(todaysLesson(l)?.id).toBe(LESSONS[0].id);
    const pinned = { ...l, pinnedLesson: LESSONS[1].id };
    expect(todaysLesson(pinned)?.id).toBe(LESSONS[1].id);
  });

  it('warms up only from lessons she has done', () => {
    expect(warmupItems(newLearner())).toEqual([]);
    if (LESSONS.length === 0) return;
    const l = recordLesson(newLearner(), LESSONS[0].id, 4, 4);
    expect(warmupItems(l, 3).length).toBe(1);
  });
});

describe('growing with her', () => {
  it('starts today\'s lesson at her grade, and carries on into the next grade', async () => {
    const { COURSE } = await import('./course');
    const first = COURSE.find((g) => g.grade === '1')!.units.flatMap((u) => u.lessons);
    const second = COURSE.find((g) => g.grade === '2')!.units.flatMap((u) => u.lessons);
    if (first.length === 0 || second.length === 0) return; // still being written
    const inSecond = { ...newLearner(), profile: { ...newLearner().profile, grade: '2' as const } };
    expect(second.map((x) => x.id)).toContain(todaysLesson(inSecond)!.id);
    // Every first-grade lesson done: she carries on into second grade.
    let l = newLearner();
    for (const lesson of first) l = recordLesson(l, lesson.id, 4, 4);
    expect(second.map((x) => x.id)).toContain(todaysLesson(l)!.id);
  });
});

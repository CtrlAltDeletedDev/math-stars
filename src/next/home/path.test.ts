import { describe, expect, it } from 'vitest';
import { newLearner } from '@/core/learner';
import { COURSE } from '@/learn/course';
import { todaysLesson } from '@/learn/progress';
import type { GradeCourse } from '@/learn/units';
import { Lesson, Unit } from '@/learn/types';
import { friendFor } from '../ui/friends';
import { AHEAD_SHOWN, CourseView, LessonStone, UnitSign, courseView, earnsFriend } from './path';
import { PATH_W, SIGN, layoutPath, pebblePillWidth, roomySide } from './layout';

// A small course of our own, so these tests do not move when the real units
// are written: 1st grade has an empty unit (skipped), 2nd grade one unit.

const lesson = (id: string): Lesson => ({
  id, title: `Lesson ${id}`, goal: '', emoji: '⭐', teach: [],
  practice: () => ({ id, say: '', prompt: '', answer: '1', input: 'number' }),
});
const unit = (id: string, n: number, colour = '#123456'): Unit => ({
  id, title: `Unit ${id}`, emoji: '🔢', about: '', colour,
  lessons: Array.from({ length: n }, (_, i) => lesson(`${id}-${i + 1}`)),
});
const FIXTURE: GradeCourse[] = [
  { grade: '1', title: '1st grade', units: [unit('a', 6, '#111111'), unit('empty', 0), unit('b', 4, '#222222')] },
  { grade: '2', title: '2nd grade', units: [unit('c', 5, '#333333')] },
];
const ALL = FIXTURE.flatMap((g) => g.units.flatMap((u) => u.lessons));
const byId = (id: string) => ALL.find((l) => l.id === id)!;

function view(doneIds: string[], todayId: string | null): CourseView {
  const done = new Set(doneIds);
  return courseView(newLearner(), { course: FIXTURE, today: todayId ? byId(todayId) : null, done: (l) => done.has(l.id) });
}
const stones = (v: CourseView) => v.nodes.filter((n): n is LessonStone => n.kind === 'lesson');
const signs = (v: CourseView) => v.nodes.filter((n): n is UnitSign => n.kind === 'unit');

describe('courseView', () => {
  it('starts each unit with its sign, skips empty units, and stops a few stones past today', () => {
    const v = view([], 'a-1');
    expect(v.nodes[0]).toMatchObject({ kind: 'unit', id: 'a', grade: '1st grade', colour: '#111111' });
    expect(stones(v).map((s) => s.id)).toEqual(['a-1', 'a-2', 'a-3', 'a-4'].slice(0, AHEAD_SHOWN + 1));
    expect(signs(v).map((s) => s.id)).toEqual(['a']);
    expect(v.nodes[v.hers]).toMatchObject({ kind: 'lesson', id: 'a-1', state: 'today' });
  });

  it('runs on across units and into the next grade, with a grade sign where it begins', () => {
    const v = view(ALL.slice(0, 10).map((l) => l.id), 'c-1');
    expect(signs(v).map((s) => [s.id, s.grade])).toEqual([['a', '1st grade'], ['b', null], ['c', '2nd grade']]);
    expect(signs(v).some((s) => s.id === 'empty')).toBe(false);
    expect(v.nodes[v.hers]).toMatchObject({ id: 'c-1', state: 'today' });
    // Every stone below today's is drawn, so she can scroll back down the road.
    expect(stones(v)[0].id).toBe('a-1');
  });

  it('colours stones done, today, open (behind) and ahead (fading)', () => {
    // A grown-up pinned b-2: a-4..b-1 are behind today but not done.
    const v = view(['a-1', 'a-2', 'a-3'], 'b-2');
    const state = Object.fromEntries(stones(v).map((s) => [s.id, s.state]));
    expect(state).toMatchObject({ 'a-1': 'done', 'a-3': 'done', 'a-4': 'open', 'b-1': 'open', 'b-2': 'today', 'b-3': 'ahead', 'b-4': 'ahead' });
    const ahead = stones(v).filter((s) => s.state === 'ahead').map((s) => s.ahead);
    expect(ahead).toEqual([1, 2, 3]);
    expect(stones(v).filter((s) => s.state !== 'ahead').every((s) => s.ahead === 0)).toBe(true);
  });

  it('seats a fixed friend by every third done stone and the end of a unit', () => {
    const v = view(ALL.slice(0, 10).map((l) => l.id), 'c-1');
    const friends = stones(v).filter((s) => s.friend).map((s) => s.id);
    // Unit a (6): 3rd and 6th. Unit b (4): 3rd and its last.
    expect(friends).toEqual(['a-3', 'a-6', 'b-3', 'b-4']);
    expect(stones(v).find((s) => s.id === 'a-6')!.friend).toBe(friendFor(5));
    expect(earnsFriend(0, 6)).toBe(false);
    expect(earnsFriend(3, 4)).toBe(true);
  });

  it('shows lessons done in today\'s unit beside her', () => {
    const v = view(['a-1', 'a-2', 'b-1'], 'a-3');
    expect(v.progress).toEqual({ emoji: '🔢', colour: '#111111', done: 2, total: 6 });
  });

  it('with nothing to do today, stands her at the end of the road and Go has no lesson', () => {
    const v = view(ALL.map((l) => l.id), null);
    expect(v.today).toBeNull();
    expect(v.progress).toBeNull();
    expect(v.hers).toBe(v.nodes.length - 1);
    expect(stones(v)).toHaveLength(ALL.length);
  });

  it('never leaves the path empty, even with no lessons written yet', () => {
    const v = courseView(newLearner(), { course: [{ grade: '1', title: '1st grade', units: [unit('x', 0)] }], today: null });
    expect(v.nodes).toEqual([{ kind: 'start', ahead: 0 }]);
    expect(v.hers).toBe(0);
  });

  it('reads the real course: today is her stone, and empty units are skipped', () => {
    const l = newLearner();
    const v = courseView(l);
    const today = todaysLesson(l);
    if (today) expect(v.nodes[v.hers]).toMatchObject({ kind: 'lesson', id: today.id, state: 'today' });
    const empty = new Set(COURSE.flatMap((g) => g.units).filter((u) => u.lessons.length === 0).map((u) => u.id));
    expect(signs(v).some((s) => empty.has(s.id))).toBe(false);
  });
});

describe('layoutPath', () => {
  it('stacks the first node at the bottom and every node above the one before', () => {
    for (let hers = 0; hers < 10; hers++) {
      const kinds = Array.from({ length: hers + 4 }, (_, i) => (i % 5 === 0 ? 'unit' as const : 'lesson' as const));
      const { spots, height } = layoutPath(kinds, hers);
      for (let i = 1; i < kinds.length; i++) expect(spots[i].y).toBeLessThan(spots[i - 1].y);
      expect(spots[0].y).toBeLessThan(height);
      expect(spots[kinds.length - 1].y).toBeGreaterThan(0);
      expect(spots[0].r).toBe(SIGN.h / 2);
    }
  });

  it('leaves her progress dots room on the side they go', () => {
    for (let hers = 0; hers < 13; hers++) {
      const s = layoutPath(Array(hers + 1).fill('lesson'), hers).spots[hers];
      const w = pebblePillWidth(6);
      if (roomySide(s) === 'right') expect(s.x + s.r + 12 + w).toBeLessThanOrEqual(PATH_W + 12);
      else expect(s.x - s.r - 12 - w).toBeGreaterThanOrEqual(-12);
    }
  });
});

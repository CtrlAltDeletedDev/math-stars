import { todayString, daysAgoString } from '@/engine/dates';
import { Learner, applyAnswer, bumpStreak, standingOn } from '@/core/learner';
import { trackOfFact } from '@/core/stages';
import { classifyTyped } from '@/core/mistakes';
import { LESSONS, LESSON_BY_ID, gradeAtLeast, gradeOfUnit, unitOf } from './course';
import { Item, Lesson } from './types';

// Where they are in the course, and recording what they do in a lesson.
//
// Nothing is locked: any lesson can be opened from their path. "Today's lesson"
// is just the first one, in course order, that they have not done yet -- done
// meaning they passed its check, or their plus/minus path already puts them past
// it (`placedBy`), so they are not re-taught "+1" from scratch.

export const PASS = 0.75;

export function lessonDone(l: Learner, lesson: Lesson): boolean {
  if (l.lessons[lesson.id]?.done) return true;
  const p = lesson.placedBy;
  if (!p) return false;
  return (Array.isArray(p) ? p : [p]).every((x) => standingOn(l, x.track) > x.stage);
}

/**
 * Today's lesson: a grown-up's pin, else the first lesson not yet done from
 * their grade onward. Grades below theirs are behind them (still tappable, and
 * back as review once done); grades above are ahead, and they carry on into
 * them by themselves when their own grade's lessons are done -- the course grows
 * with them instead of stopping.
 */
export function todaysLesson(l: Learner): Lesson | null {
  const pinned = l.pinnedLesson ? LESSON_BY_ID.get(l.pinnedLesson) : undefined;
  if (pinned && !l.lessons[pinned.id]?.done) return pinned;
  const fromHerGrade = (lesson: Lesson) => {
    const g = gradeOfUnit(unitOf(lesson.id)?.id ?? '');
    return !g || gradeAtLeast(g, l.profile.grade);
  };
  return LESSONS.find((lesson) => fromHerGrade(lesson) && !lessonDone(l, lesson)) ?? null;
}

export function passed(right: number, total: number): boolean {
  return total > 0 && right / total >= PASS - 1e-9;
}

/** The check is over: remember how it went. */
export function recordLesson(l: Learner, lessonId: string, right: number, total: number, now = Date.now()): Learner {
  const day = todayString(new Date(now));
  const prev = l.lessons[lessonId] ?? { tries: 0, best: 0, done: null, last: day };
  const score = total > 0 ? right / total : 0;
  return {
    ...l,
    lessons: {
      ...l.lessons,
      [lessonId]: {
        tries: prev.tries + 1,
        best: Math.max(prev.best, score),
        done: prev.done ?? (passed(right, total) ? day : null),
        last: day,
      },
    },
  };
}

/** They opened a lesson: it is started, even before the check. */
export function touchLesson(l: Learner, lessonId: string, now = Date.now()): Learner {
  const day = todayString(new Date(now));
  const prev = l.lessons[lessonId];
  return { ...l, lessons: { ...l.lessons, [lessonId]: prev ? { ...prev, last: day } : { tries: 0, best: 0, done: null, last: day } } };
}

/**
 * One answer to one item, recorded the way the walk records sums: first try
 * only. A fact (add-7+5) goes to their fact record so the grown-ups grid sees
 * it, served with no stone so it never moves their plus/minus track. Anything
 * else still counts toward today's sums and their streak.
 */
export function recordItem(l: Learner, item: Item, correct: boolean, typed?: string, ms?: number, now = Date.now()): Learner {
  const track = trackOfFact(item.id);
  if (track) {
    const tag = correct || typed === undefined ? undefined
      : classifyTyped({ prompt: item.prompt, correctAnswer: item.answer } as Parameters<typeof classifyTyped>[0], typed);
    return applyAnswer(l, { track, stage: null, factId: item.id, correct, typed: correct ? undefined : typed, tag, ms }, now).learner;
  }
  const day = todayString(new Date(now));
  const today = l.days[day] ?? { answered: 0, right: 0, walks: 0 };
  return {
    ...l,
    days: { ...l.days, [day]: { ...today, answered: today.answered + 1, right: today.right + (correct ? 1 : 0) } },
    streak: bumpStreak(l.streak, day),
  };
}

/**
 * Warm-up: a few questions from lessons they have done, the ones done longest
 * ago or least well most likely -- so what they learned last month comes back.
 */
export function warmupItems(l: Learner, n = 3, rng: () => number = Math.random, today = todayString()): Item[] {
  const done = Object.entries(l.lessons)
    .filter(([id, r]) => r.done && LESSON_BY_ID.has(id))
    .map(([id, r]) => {
      const age = Math.max(1, daysBetween(r.last || r.done!, today));
      return { lesson: LESSON_BY_ID.get(id)!, weight: age * (1.5 - r.best) };
    });
  const items: Item[] = [];
  const pool = [...done];
  while (items.length < n && pool.length > 0) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = rng() * total;
    let i = 0;
    while (i < pool.length - 1 && (r -= pool[i].weight) > 0) i++;
    const { lesson } = pool.splice(i, 1)[0];
    items.push((lesson.review ?? lesson.check ?? lesson.practice)());
  }
  return items;
}

function daysBetween(a: string, b: string): number {
  const t = (d: string) => new Date(`${d}T12:00:00`).getTime();
  return Math.round((t(b) - t(a)) / 86_400_000);
}

export { daysAgoString };

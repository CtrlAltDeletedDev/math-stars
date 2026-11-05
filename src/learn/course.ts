import { Lesson, Unit } from './types';
import { UNITS } from './units';

// The whole course, flattened, and where each lesson lives.

export { UNITS };

export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

const UNIT_BY_LESSON = new Map<string, Unit>(UNITS.flatMap((u) => u.lessons.map((l) => [l.id, u] as const)));

export function unitOf(lessonId: string): Unit | undefined {
  return UNIT_BY_LESSON.get(lessonId);
}

/** Its place in its unit, from 1. */
export function lessonNumber(lessonId: string): number {
  const u = unitOf(lessonId);
  return u ? u.lessons.findIndex((l) => l.id === lessonId) + 1 : 0;
}

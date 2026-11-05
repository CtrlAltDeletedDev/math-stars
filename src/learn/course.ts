import { Lesson, Unit } from './types';
import { Grade } from '@/core/stages';
import { COURSE, UNITS } from './units';

// The whole course, flattened, and where each lesson lives.

export { COURSE, UNITS };

const GRADE_ORDER: Grade[] = ['K', '1', '2'];
const GRADE_OF_UNIT = new Map(COURSE.flatMap((g) => g.units.map((u) => [u.id, g.grade] as const)));

export function gradeOfUnit(unitId: string): Grade | undefined {
  return GRADE_OF_UNIT.get(unitId);
}

/** Is this grade at or above that one? */
export function gradeAtLeast(grade: Grade, from: Grade): boolean {
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(from);
}

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

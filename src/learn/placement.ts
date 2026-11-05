import { todayString } from '@/engine/dates';
import { Learner } from '@/core/learner';
import { COURSE, gradeAtLeast } from './course';
import { Item, Lesson, Unit } from './types';

// Finding the child's level: where in the course to start.
//
// Without this, every child starts at the first lesson and a child who
// already knows the early units wades through "+1" and counting to 10 before
// meeting anything new. Placement is a short run of questions, unit by unit:
//
//   1. Two questions from a unit's LAST lesson -- its hardest. Both right:
//      the whole unit is known, and it moves on to the next unit.
//   2. Otherwise it goes through that unit lesson by lesson, one question
//      each. The first one missed is where the child starts.
//
// "I'm not sure" counts as not yet known, so the child never has to guess.
// About two questions a unit: a child who knows all of first grade answers
// about 22; one who knows none of it, two or three.
//
// Lessons found known are recorded as done (`placed`), so the path fills in
// up to the starting lesson, and they come back in warm-ups like any other.

export const MAX_QUESTIONS = 30;
const UNIT_PROBE = 2;

export interface PlacementState {
  /** Units from the child's grade onward that have lessons. */
  units: Unit[];
  unit: number;
  /** 'unit': probing the unit's last lesson. 'lesson': going lesson by lesson. */
  phase: 'unit' | 'lesson';
  lesson: number;
  /** Answers so far in this unit's probe. */
  probeRight: number;
  probeAsked: number;
  asked: number;
  /** Lessons found known, in course order. */
  known: string[];
  /** Where the child starts; null until found (or when the whole course is known). */
  start: string | null;
  done: boolean;
}

export function startPlacement(l: Learner, course = COURSE): PlacementState {
  const units = course
    .filter((g) => gradeAtLeast(g.grade, l.profile.grade))
    .flatMap((g) => g.units)
    .filter((u) => u.lessons.length > 0);
  return {
    units, unit: 0, phase: 'unit', lesson: 0, probeRight: 0, probeAsked: 0, asked: 0,
    known: [], start: null, done: units.length === 0,
  };
}

/** The lesson the next question comes from. */
export function probeLesson(s: PlacementState): Lesson | null {
  if (s.done) return null;
  const u = s.units[s.unit];
  return s.phase === 'unit' ? u.lessons[u.lessons.length - 1] : u.lessons[s.lesson];
}

/** A question from that lesson's check: no pictures, the bare skill. */
export function placementItem(s: PlacementState): { item: Item; lesson: Lesson } | null {
  const lesson = probeLesson(s);
  if (!lesson) return null;
  return { item: (lesson.check ?? lesson.practice)(), lesson };
}

export function answerPlacement(s: PlacementState, correct: boolean): PlacementState {
  if (s.done) return s;
  const unit = s.units[s.unit];
  const asked = s.asked + 1;
  const capped = (next: PlacementState): PlacementState =>
    next.done || asked < MAX_QUESTIONS ? next : { ...next, done: true, start: next.start ?? probeLesson(next)?.id ?? null };

  if (s.phase === 'unit') {
    const probeAsked = s.probeAsked + 1;
    const probeRight = s.probeRight + (correct ? 1 : 0);
    if (!correct) {
      // Not the whole unit: find the gap lesson by lesson. A unit of one
      // lesson has nothing to go through, so that lesson is the start.
      if (unit.lessons.length === 1) return { ...s, asked, done: true, start: unit.lessons[0].id };
      return capped({ ...s, asked, phase: 'lesson', lesson: 0, probeAsked: 0, probeRight: 0 });
    }
    if (probeAsked < UNIT_PROBE) return capped({ ...s, asked, probeAsked, probeRight });
    // The whole unit is known.
    const known = [...s.known, ...unit.lessons.map((x) => x.id)];
    const nextUnit = s.unit + 1;
    if (nextUnit >= s.units.length) return { ...s, asked, known, done: true, start: null };
    return capped({ ...s, asked, known, unit: nextUnit, phase: 'unit', lesson: 0, probeAsked: 0, probeRight: 0 });
  }

  const lesson = unit.lessons[s.lesson];
  if (!correct) return { ...s, asked, done: true, start: lesson.id };
  const known = [...s.known, lesson.id];
  const next = s.lesson + 1;
  // The unit's last lesson already missed in the probe: that is the start.
  if (next >= unit.lessons.length - 1) {
    return { ...s, asked, known, done: true, start: unit.lessons[unit.lessons.length - 1].id };
  }
  return capped({ ...s, asked, known, lesson: next });
}

/**
 * Record what placement found. Lessons found known become done (marked
 * `placed`, so a grown-up can tell them from lessons passed by their check);
 * nothing already passed is changed, and it never un-does anything.
 */
export function applyPlacement(l: Learner, s: PlacementState, now = Date.now()): Learner {
  const day = todayString(new Date(now));
  const lessons = { ...l.lessons };
  for (const id of s.known) {
    const prev = lessons[id];
    if (prev?.done) continue;
    lessons[id] = { tries: prev?.tries ?? 0, best: Math.max(prev?.best ?? 0, 1), done: day, last: day, placed: true };
  }
  return { ...l, lessons, placedOn: day };
}

/** A rough "how far through" for a progress bar: questions asked against a typical run. */
export function placementProgress(s: PlacementState): number {
  if (s.done) return 1;
  const expected = Math.max(4, Math.min(MAX_QUESTIONS, s.units.length * UNIT_PROBE));
  return Math.min(0.95, s.asked / expected);
}

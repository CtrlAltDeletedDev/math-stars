import { Learner } from '@/core/learner';
import { COURSE } from '@/learn/course';
import { lessonDone, todaysLesson } from '@/learn/progress';
import type { GradeCourse } from '@/learn/units';
import { Lesson } from '@/learn/types';
import { friendFor } from '../ui/friends';

// What their path shows: the course, one road from the bottom of the screen up.
// Each unit starts with a sign in its colour, then its lessons as stones. The
// road runs on across grades. Pure, so the rules here can be tested; the
// screen only draws it.

/**
 * How a lesson stone looks.
 *   done    they passed its check (or their plus/minus path puts them past it)
 *   today   today's lesson: big, glowing, their character on it
 *   open    not done, but behind today's (a grade below theirs, or skipped by a pin)
 *   ahead   beyond today's, fading into the fog
 */
export type StoneState = 'done' | 'today' | 'open' | 'ahead';

export interface UnitSign {
  kind: 'unit';
  id: string;
  title: string;
  emoji: string;
  colour: string;
  /** "2nd grade" where a grade's road begins, else null. */
  grade: string | null;
  /** How far past their stone, in lesson stones, for the fade: 0 at or below. */
  ahead: number;
}

export interface LessonStone {
  kind: 'lesson';
  id: string;
  /** Parent words; for screen readers, never shown to them. */
  title: string;
  emoji: string;
  colour: string;
  state: StoneState;
  /** The friend sitting beside it, if it is a done stone that earns one. */
  friend: string | null;
  ahead: number;
}

/** Where they wait when the course has no lessons at all yet. */
export interface Trailhead {
  kind: 'start';
  ahead: 0;
}

export type PathNode = UnitSign | LessonStone | Trailhead;

export interface UnitProgress {
  emoji: string;
  colour: string;
  done: number;
  total: number;
}

export interface CourseView {
  /** Bottom to top. Never empty. */
  nodes: PathNode[];
  /** The node their character stands on. */
  current: number;
  /** Today's lesson, or null when there is none to do (Go then opens the sums walk). */
  today: Lesson | null;
  /** Lessons done in today's unit, beside their stone. */
  progress: UnitProgress | null;
}

/** Lesson stones drawn beyond theirs before the fog. */
export const AHEAD_SHOWN = 3;

export interface CourseInputs {
  course?: GradeCourse[];
  today?: Lesson | null;
  done?: (lesson: Lesson) => boolean;
}

/** Every 3rd stone of a unit, and its last, gets a friend once it is done. */
export function earnsFriend(position: number, unitSize: number): boolean {
  return (position + 1) % 3 === 0 || position === unitSize - 1;
}

export function courseView(l: Learner, inputs: CourseInputs = {}): CourseView {
  const course = inputs.course ?? COURSE;
  const today = inputs.today !== undefined ? inputs.today : todaysLesson(l);
  const isDone = inputs.done ?? ((lesson: Lesson) => lessonDone(l, lesson));

  // The course in order, skipping units with no lessons yet.
  const all: { grade: GradeCourse; unit: GradeCourse['units'][number]; firstOfGrade: boolean }[] = [];
  for (const g of course) {
    let first = true;
    for (const unit of g.units) {
      if (unit.lessons.length === 0) continue;
      all.push({ grade: g, unit, firstOfGrade: first });
      first = false;
    }
  }

  // Lesson index (in course order) of today's stone and the furthest done one.
  let index = 0;
  let todayAt = -1;
  let lastDone = -1;
  for (const { unit } of all) {
    for (const lesson of unit.lessons) {
      if (today && lesson.id === today.id) todayAt = index;
      if (isDone(lesson)) lastDone = index;
      index++;
    }
  }
  const total = index;
  if (total === 0) return { nodes: [{ kind: 'start', ahead: 0 }], current: 0, today: null, progress: null };

  // They stand on today's stone; with nothing to do today, at the end of the road so far.
  const herLesson = todayAt >= 0 ? todayAt : total - 1;
  const top = Math.min(total - 1, Math.max(herLesson, lastDone) + AHEAD_SHOWN);

  const nodes: PathNode[] = [];
  let current = 0;
  let progress: UnitProgress | null = null;
  index = 0;
  outer: for (const { grade, unit, firstOfGrade } of all) {
    if (index > top) break;
    nodes.push({
      kind: 'unit', id: unit.id, title: unit.title, emoji: unit.emoji, colour: unit.colour,
      grade: firstOfGrade ? grade.title : null,
      ahead: Math.max(0, index - herLesson),
    });
    for (let pos = 0; pos < unit.lessons.length; pos++, index++) {
      if (index > top) break outer;
      const lesson = unit.lessons[pos];
      const done = isDone(lesson);
      const state: StoneState = index === todayAt ? 'today' : done ? 'done' : index > herLesson ? 'ahead' : 'open';
      if (index === herLesson) {
        current = nodes.length;
        if (todayAt >= 0) {
          progress = { emoji: unit.emoji, colour: unit.colour, done: unit.lessons.filter(isDone).length, total: unit.lessons.length };
        }
      }
      nodes.push({
        kind: 'lesson', id: lesson.id, title: lesson.title, emoji: lesson.emoji, colour: unit.colour, state,
        friend: done && earnsFriend(pos, unit.lessons.length) ? friendFor(index) : null,
        ahead: Math.max(0, index - herLesson),
      });
    }
  }
  return { nodes, current, today: todayAt >= 0 ? today : null, progress };
}

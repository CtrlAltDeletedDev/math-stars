import { Unit } from '../types';
import { Grade } from '@/core/stages';
import { UNIT as numbers } from './numbers';
import { UNIT as add10 } from './add10';
import { UNIT as sub10 } from './sub10';
import { UNIT as stories } from './stories';
import { UNIT as tensOnes } from './tensOnes';
import { UNIT as within20 } from './within20';
import { UNIT as length } from './length';
import { UNIT as graphs } from './graphs';
import { UNIT as time } from './time';
import { UNIT as shapes } from './shapes';
import { UNIT as money } from './money';
import { UNIT as add100 } from './grade2/add100';
import { UNIT as sub100 } from './grade2/sub100';
import { UNIT as placeValue1000 } from './grade2/placeValue';
import { UNIT as groups } from './grade2/groups';
import { UNIT as measure2 } from './grade2/measure';
import { UNIT as time2 } from './grade2/time';
import { UNIT as money2 } from './grade2/money';
import { UNIT as fractions2 } from './grade2/fractions';

// The course, grade by grade, in teaching order. It is one road: when she
// finishes her grade's units, today's lesson carries straight on into the
// next grade's, so the app grows with her rather than ending.
//
// Kindergarten review lives in "Numbers to 20" for now; a grade's units can be
// added here (append, or insert -- nothing saved refers to a unit's position,
// only to lesson ids) and appear on her path as soon as they have lessons.

export interface GradeCourse {
  grade: Grade;
  /** Parent-facing. */
  title: string;
  units: Unit[];
}

export const COURSE: GradeCourse[] = [
  { grade: '1', title: '1st grade', units: [numbers, add10, sub10, stories, tensOnes, within20, length, graphs, time, shapes, money] },
  { grade: '2', title: '2nd grade', units: [add100, sub100, placeValue1000, groups, measure2, time2, money2, fractions2] },
];

export const UNITS: Unit[] = COURSE.flatMap((g) => g.units);

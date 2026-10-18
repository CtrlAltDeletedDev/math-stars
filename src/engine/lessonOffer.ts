import { ErrorTag, UserProgress } from '@/types';
import { Lesson, lessonForMistake, recommendedLesson } from '@/data/learn';
import { ceilingFor } from '@/data/grades';
import { LadderMove } from './skillLadder';
import { todayString } from './dates';

// When Play should stop and offer a lesson.
//
// A demotion used to happen in silence: the questions just got easier, and the
// lesson that teaches the thing she was stuck on sat on the topic screen, two
// taps away, where a child mid-round never goes. The same was true of making
// one mistake over and over. Lessons are where she is allowed to be wrong, so
// struggling is exactly when to put one in front of her — once, and only with
// a lesson that is actually about her trouble.

/** The same mistake this many times in one round is a pattern, not a slip. */
export const REPEATS_TO_OFFER = 2;

export interface Struggle {
  skillId: string;
  /** What the ladder did with this answer. */
  move: LadderMove;
  /** The rung she stands on after it. */
  rung: number;
  /** What the wrong option she picked meant, if it meant anything. */
  tag?: ErrorTag;
  /** How many times that tag has come up on this topic this round, this one included. */
  tagCountThisRound: number;
  /** Her commonest tagged mistake on this topic this round, for a demotion. */
  topTagThisRound?: ErrorTag;
}

export function lessonToOffer(
  progress: UserProgress,
  struggle: Struggle,
  /** Topics already offered a lesson this sitting. One offer each: never nag. */
  alreadyOffered: ReadonlySet<string>,
): Lesson | null {
  const { skillId, move, rung, tag, tagCountThisRound, topTagThisRound } = struggle;
  if (alreadyOffered.has(skillId)) return null;
  const ceiling = ceilingFor(skillId, progress.gradeLevel);
  const done = progress.lessonsDone ?? {};
  const meaningful = (t?: ErrorTag): t is ErrorTag => !!t && t !== 'unknown';
  // A lesson she has already watched today is not worth stopping her for again.
  const today = todayString();
  const notToday = (lesson: Lesson | null) => (lesson && done[lesson.id] !== today ? lesson : null);

  if (move === 'demoted') {
    // Moved down: the lesson for what she kept getting wrong if there is one,
    // else the one nearest the rung she has just landed on.
    const forMistake = meaningful(topTagThisRound) ? lessonForMistake(skillId, topTagThisRound, ceiling, rung) : null;
    return notToday(forMistake) ?? notToday(recommendedLesson(skillId, ceiling, rung, done));
  }

  // The same mistake again: only a lesson written for that mistake is worth
  // interrupting her for. A near lesson about something else is not.
  if (meaningful(tag) && tagCountThisRound >= REPEATS_TO_OFFER) {
    return notToday(lessonForMistake(skillId, tag, ceiling, rung));
  }
  return null;
}

// What Play remembers while she is away watching a lesson it offered. "Show
// me" leaves the Play screen, so without this the screen she comes back to
// would offer the very same lesson again at the next stumble, and would start
// a round on whatever topics it liked rather than the one she just learned
// about. Kept in memory only: a lesson is a move within the app, and none of
// this matters after a reload or a long break.
const SITTING_GAP_MS = 20 * 60 * 1000;
let away: { offered: string[]; skillId: string; at: number } | null = null;

/** Called as Play hands her to an offered lesson. */
export function leaveForLesson(offered: ReadonlySet<string>, skillId: string) {
  away = { offered: [...offered, skillId], skillId, at: Date.now() };
}

/**
 * What a Play screen opening now should carry on from: the topics already
 * offered a lesson, and the one to lead with. Reading it does not use it up,
 * so a render that React repeats sees the same answer; `forgetLessonVisit`
 * clears it once the screen is up.
 */
export function returnFromLesson(): { offered: Set<string>; lead: string | null } {
  if (!away || Date.now() - away.at > SITTING_GAP_MS) return { offered: new Set(), lead: null };
  return { offered: new Set(away.offered), lead: away.skillId };
}

export function forgetLessonVisit() {
  away = null;
}

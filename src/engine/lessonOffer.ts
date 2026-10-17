import { ErrorTag, UserProgress } from '@/types';
import { Lesson, lessonForMistake, recommendedLesson } from '@/data/learn';
import { ceilingFor } from '@/data/grades';
import { LadderMove } from './skillLadder';

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
  const meaningful = (t?: ErrorTag): t is ErrorTag => !!t && t !== 'unknown';

  if (move === 'demoted') {
    // Moved down: the lesson for what she kept getting wrong if there is one,
    // else the one nearest the rung she has just landed on.
    const forMistake = meaningful(topTagThisRound) ? lessonForMistake(skillId, topTagThisRound, ceiling, rung) : null;
    return forMistake ?? recommendedLesson(skillId, ceiling, rung, progress.lessonsDone ?? {});
  }

  // The same mistake again: only a lesson written for that mistake is worth
  // interrupting her for. A near lesson about something else is not.
  if (meaningful(tag) && tagCountThisRound >= REPEATS_TO_OFFER) {
    return lessonForMistake(skillId, tag, ceiling, rung);
  }
  return null;
}

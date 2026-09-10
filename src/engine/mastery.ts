import { UserProgress } from '@/types';
import { RANKS } from '@/data/skills';
import { GradeLevel, ceilingFor } from '@/data/grades';
import { LADDER } from './skillLadder';

// One number for "how is she doing on this topic", for the ring on a tile.
//
// The point of the ring is that it is never finished. A padlock chain says
// "you may not"; a full bar says "you are done here" — and a child who has
// finished a topic then has no reason to practise it again, which is exactly
// backwards for maths facts. So at the top of her grade the last segment
// refills every window instead of sticking at full: there is always a little
// more to earn, and the topic never closes.

export interface TopicMastery {
  skillId: string;
  /** Where she is standing. */
  rung: number;
  /** The highest rung her grade allows. */
  ceiling: number;
  /** 0..1 across the whole in-scope span, for drawing the arc. */
  fill: number;
  /** Index into RANKS — the glyph a child reads instead of a number. */
  stage: number;
  /** False before she has answered anything here, so the tile can look untouched. */
  everPlayed: boolean;
  /** At the top of her grade: the ring keeps cycling rather than completing. */
  atCeiling: boolean;
}

/**
 * How far through the current rung her sliding window has got.
 *
 * `LADDER.promoteAt` correct answers is what a promotion costs, so that is the
 * honest denominator — the segment fills at the rate she is actually earning it.
 */
function windowFraction(recent: readonly boolean[]): number {
  if (recent.length === 0) return 0;
  const hits = recent.filter(Boolean).length;
  return Math.min(1, hits / LADDER.promoteAt);
}

export function masteryFor(
  skillId: string,
  progress: UserProgress,
  grade: GradeLevel | null = progress.gradeLevel,
): TopicMastery {
  const state = progress.skills?.[skillId];
  const ceiling = ceilingFor(skillId, grade);
  const rung = Math.min(state?.rung ?? 0, ceiling);
  const partial = windowFraction(state?.recent ?? []);
  const atCeiling = rung >= ceiling;

  // `ceiling + 1` segments: one per rung, plus the one she is working through.
  // At the ceiling the arc shows only the current window, so it climbs, resets
  // and climbs again — visible progress with no terminal state.
  const fill = atCeiling
    ? Math.max((ceiling) / (ceiling + 1), Math.min(1, (rung + partial) / (ceiling + 1)))
    : Math.min(1, (rung + partial) / (ceiling + 1));

  return {
    skillId,
    rung,
    ceiling,
    fill,
    stage: Math.min(rung, RANKS.length - 1),
    everPlayed: (state?.attempts ?? 0) > 0,
    atCeiling,
  };
}

/** Has she outgrown the grade? Two blocked promotions is the parent's cue. */
export function hasOutgrown(skillId: string, progress: UserProgress): boolean {
  return (progress.skills?.[skillId]?.ceilingHits ?? 0) >= 2;
}

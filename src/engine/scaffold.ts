import { UserProgress } from '@/types';
import { ceilingFor } from '@/data/grades';

// When the counting picture is on the screen, and when it waits behind a tap.
//
// A picture she can count is how a new fact is learned and the reason an old
// one never becomes a fact: with the ten frame always drawn, "7 + 2" is
// answered by counting nine counters on the five-hundredth go just as on the
// first. Classes move from objects, to pictures, to the numbers alone, and
// the step that matters is taking the picture away once she no longer needs
// it -- not taking it away for good.
//
// So: on a rung she is new to, or one she is getting wrong, the picture is
// drawn. Once her recent answers at the rung are mostly right, it waits behind
// a "Show me" button she can tap any time, and it comes back by itself after a
// wrong tap. Nothing about the picture is scored either way: tapping it is
// allowed, and the ladder still decides everything from her answers.

export type AidMode = 'show' | 'tap';

/** Answers at a rung before the picture may step back. */
export const AID_SETTLE = 4;
/** Share of those answers that must be right. */
export const AID_STEADY = 0.75;

export function aidModeFor(
  progress: UserProgress,
  skillId: string | null,
  rung: number | null,
): AidMode {
  // A review says nothing about whether she is steady anywhere: it gets the
  // picture.
  if (!skillId || rung === null) return 'show';
  const state = progress.skills?.[skillId];
  if (!state) return 'show';
  const standing = Math.min(state.rung, ceilingFor(skillId, progress.gradeLevel));
  // A warm-up from a step she has already been promoted past waits behind the
  // tap; one from above her is new ground and gets the picture.
  if (rung < standing) return 'tap';
  if (rung > standing) return 'show';
  const recent = state.recent;
  if (recent.length < AID_SETTLE) return 'show';
  const right = recent.filter(Boolean).length / recent.length;
  return right >= AID_STEADY ? 'tap' : 'show';
}

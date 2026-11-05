import { Learner, standingOn } from '@/core/learner';
import { WalkItem } from '@/core/walk';

// When the ten-frame picture is on the screen, and when it waits behind
// "Show me".
//
// A picture they can count is how a new fact is learned and the reason an old
// one never becomes a fact. So, with picture help on Auto:
//   - on the stone they stand on, it is drawn until their recent answers there
//     are mostly right, then waits behind the button
//   - a look-back (a review, a warm-up) is ground they have covered: behind the button
//   - anything else (a grown-up's pick above them) is new ground: drawn
// A wrong first try always brings it back. A grown-up can set Always or Off.

export type PictureMode = 'show' | 'tap' | 'none';

export const SETTLE = 4;
export const STEADY = 0.75;

export function pictureMode(l: Learner, item: WalkItem): PictureMode {
  if (l.profile.pictures === 'off') return 'none';
  if (l.profile.pictures === 'always') return 'show';
  if (item.kind === 'review' || item.kind === 'warmup') return 'tap';
  const here = standingOn(l, item.track);
  if (item.stage === null || item.stage < here) return 'tap';
  if (item.stage > here) return 'show';
  const recent = l.tracks[item.track].recent;
  if (recent.length < SETTLE) return 'show';
  return recent.filter(Boolean).length / recent.length >= STEADY ? 'tap' : 'show';
}

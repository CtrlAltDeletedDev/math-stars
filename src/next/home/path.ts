import { Learner, passedStones, standingOn } from '@/core/learner';
import { STAGES, TRACKS, TrackId, ceilingFor } from '@/core/stages';
import { UP_AT } from '@/core/track';
import { friendFor } from '../ui/friends';

// What her path shows, worked out from the learner and nothing else. Pure, so
// the screen only draws it and the rules here can be tested.

/**
 * How one half of a stone looks.
 *   passed  that track has moved up from this stone: filled in its colour
 *   here    that track stands on it: filling, and glowing
 *   ahead   not reached yet: an outline in its colour
 *   none    this track has no such stone in her grade (2nd grade's top plus stone)
 */
export type HalfState = 'passed' | 'here' | 'ahead' | 'none';

export interface Half {
  state: HalfState;
  /** For a half she is on: how far it has filled, 0..1 (right answers in the window / UP_AT). */
  fill: number;
}

export interface StoneView {
  index: number;
  label: string;
  plus: Half;
  minus: Half;
  /** The friend who sits beside it once both halves are passed. */
  friend: string | null;
  /** Her stone: the character stands here. */
  hers: boolean;
  /** 0 for her stone and below, then 1, 2 for the stones fading into the fog. */
  ahead: number;
}

export interface PebbleRow {
  track: TrackId;
  /** Right answers in that track's current window, 0..UP_AT. */
  filled: number;
  slots: number;
}

export interface PathView {
  stones: StoneView[];
  /** Her stone's index. */
  hers: number;
  /** The last stone her grade has, on either track. */
  last: number;
  /** One row for each track standing on her stone: one, or two when they are level. */
  pebbles: PebbleRow[];
}

/** Stones drawn beyond hers before the fog. */
export const AHEAD_SHOWN = 2;

export function pathView(l: Learner): PathView {
  const grade = l.profile.grade;
  const ceiling = { plus: ceilingFor('plus', grade), minus: ceilingFor('minus', grade) };
  const last = Math.max(ceiling.plus, ceiling.minus);
  const on = { plus: standingOn(l, 'plus'), minus: standingOn(l, 'minus') };
  const hers = Math.min(on.plus, on.minus);
  const passed = passedStones(l);
  const top = Math.min(last, hers + AHEAD_SHOWN);

  const hits = (t: TrackId) => Math.min(UP_AT, l.tracks[t].recent.filter(Boolean).length);
  const half = (t: TrackId, i: number): Half => {
    if (i > ceiling[t]) return { state: 'none', fill: 0 };
    if (passed[t].has(i)) return { state: 'passed', fill: 1 };
    if (i === on[t]) return { state: 'here', fill: hits(t) / UP_AT };
    return { state: 'ahead', fill: 0 };
  };

  const stones: StoneView[] = [];
  for (let i = 0; i <= top; i++) {
    const plus = half('plus', i);
    const minus = half('minus', i);
    stones.push({
      index: i,
      label: STAGES.plus[i]?.stone ?? STAGES.minus[i]?.stone ?? String(i),
      plus,
      minus,
      friend: plus.state === 'passed' && minus.state === 'passed' ? friendFor(i) : null,
      hers: i === hers,
      ahead: Math.max(0, i - hers),
    });
  }

  const pebbles: PebbleRow[] = TRACKS.filter((t) => on[t] === hers).map((t) => ({
    track: t,
    filled: hits(t),
    slots: UP_AT,
  }));

  return { stones, hers, last, pebbles };
}

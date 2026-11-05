// Moving along a track: when they go up a stone, or back one.
//
// The same deliberately boring rule as the old ladder, because a parent has to
// be able to predict it. A window of their recent answers at the stone they are on:
//
//   up    6 of the last 8 right
//   back  3 or fewer of the last 8 right
//   fast  while the track has never moved them back, their first 4 at a stone
//         all right moves them up -- placement without a test
//
// The window clears on every move. Answers from any other stone (warm-ups,
// reviews, a grown-up's "this week" pick) count toward their totals and their fact
// records but never toward the window: they say nothing about *this* stone.

export const WINDOW = 8;
export const UP_AT = 6;
export const BACK_AT = 3;
export const FAST_LANE = 4;

export interface TrackState {
  stage: number;
  recent: boolean[];
  /**
   * Times this track has moved them back. Zero keeps the fast lane open.
   * Absent on a save that never counted, which keeps the ordinary rule: no
   * count is no evidence they were never moved back.
   */
  demotions?: number;
  /** Times they earned a move up that their grade's ceiling would not give. */
  ceilingHits: number;
  /** Stones they have moved up from, and the day they first did. */
  passed: Record<number, string>;
}

export function newTrack(): TrackState {
  return { stage: 0, recent: [], demotions: 0, ceilingHits: 0, passed: {} };
}

export type Move = 'up' | 'back' | null;

export interface StepInput {
  correct: boolean;
  /** The stone the question came from; null for a review. */
  served: number | null;
  ceiling: number;
  /** The track's last stone, so a blocked move only counts when the grade blocked it. */
  top: number;
  day: string;
}

/** The stone they are actually standing on: their saved one, held to their grade. */
export function standing(t: TrackState, ceiling: number): number {
  return Math.min(t.stage, ceiling);
}

export function stepTrack(prev: TrackState, a: StepInput): { state: TrackState; move: Move } {
  const here = standing(prev, a.ceiling);
  if (a.served !== here) return { state: prev, move: null };

  const recent = [...prev.recent, a.correct].slice(-WINDOW);
  const up = (state: TrackState) => ({
    state: {
      ...state,
      stage: here + 1,
      recent: [],
      passed: prev.passed[here] ? prev.passed : { ...prev.passed, [here]: a.day },
    },
    move: 'up' as const,
  });

  if (prev.demotions === 0 && here < a.ceiling && recent.length === FAST_LANE && recent.every(Boolean)) {
    return up({ ...prev, recent });
  }
  if (recent.length < WINDOW) return { state: { ...prev, recent }, move: null };

  const hits = recent.filter(Boolean).length;
  if (hits >= UP_AT && here < a.ceiling) return up({ ...prev, recent });
  if (hits >= UP_AT) {
    // At the top of their grade and acing it: keep going, and tell the grown-ups.
    const blocked = a.ceiling < a.top ? 1 : 0;
    return { state: { ...prev, recent: [], ceilingHits: prev.ceilingHits + blocked }, move: null };
  }
  if (hits <= BACK_AT && here > 0) {
    return {
      state: { ...prev, stage: here - 1, recent: [], demotions: (prev.demotions ?? 0) + 1 },
      move: 'back',
    };
  }
  return { state: { ...prev, recent }, move: null };
}

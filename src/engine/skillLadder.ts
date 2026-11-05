import { SkillState } from '@/types';
import { SKILLS_BY_ID } from '@/data/skills';

// When to move a child up or down a rung.
//
// The rule is deliberately boring and explainable, because an adaptive system a
// parent cannot predict is one they stop trusting. It looks at a sliding window
// of their most recent answers *at their current rung*:
//
//   promote  6 or more of the last 8 correct   → the rung is comfortable
//   demote   3 or fewer of the last 8 correct  → the rung is too hard
//
// The window is cleared on every move, so they get a fresh 8 answers to settle
// in before the next decision. That hysteresis is what stops it oscillating
// between two rungs on a run of luck.
//
// The fast lane is placement without a placement test. Every topic starts them
// on its first rung, so a first grader who can already add to 20 began on "+1"
// and needed 32 answers to climb to where they were. Until a topic has moved them
// *down* once, 4 right out of the first 4 at a rung moves them up. The first
// demotion means they have found their level, and the 6-of-8 rule takes over for
// good. Four right is rarely luck: guessing among four options gets there one
// time in 256, among three one in 81. Comparing's "which is more?" has two, so
// a guess gets there one time in 16; that costs them one rung too high, which
// their first wrong answers there undo, and the demotion closes the lane.

export const LADDER = {
  window: 8,
  promoteAt: 6,
  demoteAt: 3,
  fastLane: 4,
} as const;

/** Longer than this is a child who wandered off, not a slow answer. */
export const MAX_ANSWER_MS = 60_000;

function usableAnswerMs(ms: number | undefined): ms is number {
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 && ms <= MAX_ANSWER_MS;
}

export function newSkillState(skillId: string): SkillState {
  return { skillId, rung: 0, recent: [], attempts: 0, correct: 0, ceilingHits: 0, demotions: 0 };
}

/**
 * Is this topic still placing them? Only a state that has *counted* demotions
 * from the start can say none have happened: a save from before the count
 * existed says nothing either way, so it keeps the 6-of-8 rule it always had.
 */
export function inPlacement(state: SkillState): boolean {
  return state.demotions === 0;
}

/**
 * Could the next answers still move them up by the fast lane? For the ring,
 * which should fill at the rate a promotion is actually being earned.
 */
export function inFastLane(state: SkillState): boolean {
  return inPlacement(state) && state.recent.length < LADDER.fastLane && state.recent.every(Boolean);
}

export type LadderMove = 'promoted' | 'demoted' | null;

export interface LadderResult {
  state: SkillState;
  move: LadderMove;
  /** Rung before the move, for the "you levelled up" message. */
  fromRung: number;
}

/**
 * Fold one answer into a skill's state, moving them a rung if the window says so.
 * Pure: returns a new state rather than mutating.
 */
export function recordSkillAnswer(
  prev: SkillState,
  wasCorrect: boolean,
  /**
   * The highest rung they may reach — their grade's ceiling for this skill. Optional
   * so every existing caller and test keeps its old meaning: without it the limit
   * is simply the top of the ladder, exactly as before.
   */
  ceiling?: number,
  /**
   * The rung the question actually came from.
   *
   *   a number   fold it into the window only if it is the rung they are standing
   *              on — an answer from easier or harder ground says nothing about
   *              whether *this* rung is comfortable
   *   null       the caller knows it came from no rung on this ladder (an SRS
   *              review, or a mixed level's question routed to a second skill)
   *   undefined  the caller doesn't know; fold it, which is what every caller
   *              did before this argument existed
   */
  servedRung?: number | null,
  /**
   * How long they took, if the screen measured it. Kept under exactly the rules
   * the window uses, and only for a right answer -- see `SkillState.times`.
   */
  ms?: number,
): LadderResult {
  const skill = SKILLS_BY_ID.get(prev.skillId);
  const ladderTop = skill ? skill.rungs.length - 1 : 0;
  const topRung = Math.min(ceiling ?? ladderTop, ladderTop);

  // What they are actually being served. A saved rung above the ceiling — a child
  // whose grade was moved *down* — is served at the ceiling, so that is the rung
  // their answers are evidence about.
  const standingRung = Math.min(prev.rung, topRung);

  // Attempts and accuracy count no matter where the question came from; only
  // the promote/demote window is choosy. Keeping these separate is what lets a
  // replay still feed the parent's lifetime figures and the SRS without also
  // moving them up a ladder they never climbed.
  const counted: SkillState = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (wasCorrect ? 1 : 0),
  };

  if (servedRung !== undefined && servedRung !== standingRung) {
    return { state: counted, move: null, fromRung: prev.rung };
  }

  const recent = [...prev.recent, wasCorrect].slice(-LADDER.window);
  const state: SkillState = { ...counted, recent };
  if (wasCorrect && usableAnswerMs(ms)) {
    state.times = [...(prev.times ?? []), Math.round(ms)].slice(-LADDER.window);
  }

  // The fast lane: their first four at this rung, all right, while the topic is
  // still placing them. `recent` is cleared on every move, so a length of four
  // is exactly their first four here.
  if (
    inPlacement(prev) && standingRung < topRung &&
    recent.length === LADDER.fastLane && recent.every(Boolean)
  ) {
    return { state: { ...state, rung: standingRung + 1, recent: [], times: [] }, move: 'promoted', fromRung: standingRung };
  }

  if (recent.length < LADDER.window) return { state, move: null, fromRung: prev.rung };

  const hits = recent.filter(Boolean).length;

  // Moves are relative to `standingRung`, not the saved index. They are almost
  // always the same number. Where they differ -- a child whose grade was moved
  // down, so their saved rung 6 is served at a ceiling of 4 -- demoting from the
  // saved index took them 6 -> 5 -> 4 while they kept getting the same rung-4
  // questions, so three failed windows changed nothing they could see. They now
  // lands where the evidence actually puts them.
  if (hits >= LADDER.promoteAt && standingRung < topRung) {
    return { state: { ...state, rung: standingRung + 1, recent: [], times: [] }, move: 'promoted', fromRung: standingRung };
  }
  if (hits <= LADDER.demoteAt && standingRung > 0) {
    return {
      state: { ...state, rung: standingRung - 1, recent: [], times: [], demotions: (prev.demotions ?? 0) + 1 },
      move: 'demoted',
      fromRung: standingRung,
    };
  }
  // Sitting at the top and acing it: keep the window fresh so they aren't stuck
  // holding a full window that can only ever trigger a demotion.
  //
  // `ceilingHits` counts the times they earned a promotion the grade wouldn't
  // give them. Two of those is the Parent screen's cue to suggest moving them up a
  // year — the ceiling is soft, and this is how it tells on itself rather than
  // quietly capping their forever.
  if (hits >= LADDER.promoteAt && standingRung >= topRung) {
    const blockedByGrade = topRung < ladderTop;
    return {
      state: {
        ...state,
        recent: [],
        ceilingHits: (prev.ceilingHits ?? 0) + (blockedByGrade ? 1 : 0),
      },
      move: null,
      fromRung: prev.rung,
    };
  }

  return { state, move: null, fromRung: prev.rung };
}

/**
 * Their middle time for a right answer at the current rung, for the parent
 * dashboard. Null until there are a few to go on: one quick tap is not a habit.
 */
export function typicalAnswerMs(state: SkillState): number | null {
  const t = [...(state.times ?? [])].sort((a, b) => a - b);
  if (t.length < 3) return null;
  const mid = Math.floor(t.length / 2);
  return t.length % 2 ? t[mid] : Math.round((t[mid - 1] + t[mid]) / 2);
}

/** Accuracy at the current rung, for the parent dashboard. Null until there's evidence. */
export function rungAccuracy(state: SkillState): number | null {
  if (state.recent.length === 0) return null;
  return state.recent.filter(Boolean).length / state.recent.length;
}

export function isMaxed(state: SkillState): boolean {
  const skill = SKILLS_BY_ID.get(state.skillId);
  return !!skill && state.rung >= skill.rungs.length - 1;
}

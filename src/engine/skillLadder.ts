import { SkillState } from '@/types';
import { SKILLS_BY_ID } from '@/data/skills';

// When to move a child up or down a rung.
//
// The rule is deliberately boring and explainable, because an adaptive system a
// parent cannot predict is one they stop trusting. It looks at a sliding window
// of her most recent answers *at her current rung*:
//
//   promote  6 or more of the last 8 correct   → the rung is comfortable
//   demote   3 or fewer of the last 8 correct  → the rung is too hard
//
// The window is cleared on every move, so she gets a fresh 8 answers to settle
// in before the next decision. That hysteresis is what stops it oscillating
// between two rungs on a run of luck.

export const LADDER = {
  window: 8,
  promoteAt: 6,
  demoteAt: 3,
} as const;

export function newSkillState(skillId: string): SkillState {
  return { skillId, rung: 0, recent: [], attempts: 0, correct: 0, ceilingHits: 0 };
}

export type LadderMove = 'promoted' | 'demoted' | null;

export interface LadderResult {
  state: SkillState;
  move: LadderMove;
  /** Rung before the move, for the "you levelled up" message. */
  fromRung: number;
}

/**
 * Fold one answer into a skill's state, moving her a rung if the window says so.
 * Pure: returns a new state rather than mutating.
 */
export function recordSkillAnswer(
  prev: SkillState,
  wasCorrect: boolean,
  /**
   * The highest rung she may reach — her grade's ceiling for this skill. Optional
   * so every existing caller and test keeps its old meaning: without it the limit
   * is simply the top of the ladder, exactly as before.
   */
  ceiling?: number,
  /**
   * The rung the question actually came from.
   *
   *   a number   fold it into the window only if it is the rung she is standing
   *              on — an answer from easier or harder ground says nothing about
   *              whether *this* rung is comfortable
   *   null       the caller knows it came from no rung on this ladder (an SRS
   *              review, or a mixed level's question routed to a second skill)
   *   undefined  the caller doesn't know; fold it, which is what every caller
   *              did before this argument existed
   */
  servedRung?: number | null,
): LadderResult {
  const skill = SKILLS_BY_ID.get(prev.skillId);
  const ladderTop = skill ? skill.rungs.length - 1 : 0;
  const topRung = Math.min(ceiling ?? ladderTop, ladderTop);

  // What she is actually being served. A saved rung above the ceiling — a child
  // whose grade was moved *down* — is served at the ceiling, so that is the rung
  // her answers are evidence about.
  const standingRung = Math.min(prev.rung, topRung);

  // Attempts and accuracy count no matter where the question came from; only
  // the promote/demote window is choosy. Keeping these separate is what lets a
  // replay still feed the parent's lifetime figures and the SRS without also
  // moving her up a ladder she never climbed.
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

  if (recent.length < LADDER.window) return { state, move: null, fromRung: prev.rung };

  const hits = recent.filter(Boolean).length;

  // Moves are relative to `standingRung`, not the saved index. They are almost
  // always the same number. Where they differ -- a child whose grade was moved
  // down, so her saved rung 6 is served at a ceiling of 4 -- demoting from the
  // saved index took her 6 -> 5 -> 4 while she kept getting the same rung-4
  // questions, so three failed windows changed nothing she could see. She now
  // lands where the evidence actually puts her.
  if (hits >= LADDER.promoteAt && standingRung < topRung) {
    return { state: { ...state, rung: standingRung + 1, recent: [] }, move: 'promoted', fromRung: standingRung };
  }
  if (hits <= LADDER.demoteAt && standingRung > 0) {
    return { state: { ...state, rung: standingRung - 1, recent: [] }, move: 'demoted', fromRung: standingRung };
  }
  // Sitting at the top and acing it: keep the window fresh so she isn't stuck
  // holding a full window that can only ever trigger a demotion.
  //
  // `ceilingHits` counts the times she earned a promotion the grade wouldn't
  // give her. Two of those is the Parent screen's cue to suggest moving her up a
  // year — the ceiling is soft, and this is how it tells on itself rather than
  // quietly capping her forever.
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

/** Accuracy at the current rung, for the parent dashboard. Null until there's evidence. */
export function rungAccuracy(state: SkillState): number | null {
  if (state.recent.length === 0) return null;
  return state.recent.filter(Boolean).length / state.recent.length;
}

export function isMaxed(state: SkillState): boolean {
  const skill = SKILLS_BY_ID.get(state.skillId);
  return !!skill && state.rung >= skill.rungs.length - 1;
}

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
  return { skillId, rung: 0, recent: [], attempts: 0, correct: 0 };
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
export function recordSkillAnswer(prev: SkillState, wasCorrect: boolean): LadderResult {
  const skill = SKILLS_BY_ID.get(prev.skillId);
  const topRung = skill ? skill.rungs.length - 1 : 0;

  const recent = [...prev.recent, wasCorrect].slice(-LADDER.window);
  const state: SkillState = {
    ...prev,
    recent,
    attempts: prev.attempts + 1,
    correct: prev.correct + (wasCorrect ? 1 : 0),
  };

  if (recent.length < LADDER.window) return { state, move: null, fromRung: prev.rung };

  const hits = recent.filter(Boolean).length;

  if (hits >= LADDER.promoteAt && prev.rung < topRung) {
    return { state: { ...state, rung: prev.rung + 1, recent: [] }, move: 'promoted', fromRung: prev.rung };
  }
  if (hits <= LADDER.demoteAt && prev.rung > 0) {
    return { state: { ...state, rung: prev.rung - 1, recent: [] }, move: 'demoted', fromRung: prev.rung };
  }
  // Sitting at the top of the ladder and acing it: keep the window fresh so she
  // isn't stuck holding a full window that can only ever trigger a demotion.
  if (hits >= LADDER.promoteAt && prev.rung >= topRung) {
    return { state: { ...state, recent: [] }, move: null, fromRung: prev.rung };
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

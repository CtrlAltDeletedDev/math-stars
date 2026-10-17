import { ErrorTag, Question, SkillState, UserProgress } from '@/types';
import { GradeLevel, ceilingFor } from '@/data/grades';
import { RUNG_FOR_LEVEL, SKILL_FOR_LEVEL, skillForQuestion } from '@/data/topics';
import { newSkillState, recordSkillAnswer } from './skillLadder';

// How a finished session's answers reach the ladders.
//
// These lived inside the progress store, where nothing could test them, and
// that is how a whole topic went unheard: the Number Tricks levels' questions
// are written as addition and missing-number questions, routed by type to
// Adding and Mystery Number, and so never matched the level's own topic. The
// rule below then treated every one of them as a mixed level's second ladder —
// counted, never moved — and Doubles could be played for ever without Number
// Tricks noticing. Pure functions, so `foldAnswers.test.ts` can hold that shut.

/**
 * One answer as a finished session hands it over: what she was asked, whether
 * she knew it, what she tapped first, and how long that first tap took.
 */
export interface SessionAnswer {
  question: Question;
  correct: boolean;
  chosen?: string;
  ms?: number;
}

/** A rung she climbed during a session, for the screen to celebrate. */
export interface LevelUp {
  skillId: string;
  /** The rung she is standing on now. */
  rung: number;
}

type ErrorPatterns = UserProgress['errorPatterns'];

/**
 * Note what a wrong answer meant.
 *
 * The generators build distractors that are specific mistakes and tag them;
 * this is where that survives the tap. Counts per skill, never an event log:
 * see the note on `errorPatterns` in types/progress.ts.
 *
 * A right answer records nothing, and so does a wrong answer on a question
 * whose options carry no meaning -- the hand-written banks are not tagged yet.
 * Silence is honest; a bucket of 'unknown' would look like a finding.
 */
export function noteError(
  patterns: ErrorPatterns,
  skillId: string,
  question: Question,
  chosen: string | undefined,
): ErrorPatterns {
  if (!chosen) return patterns;
  const tag: ErrorTag | undefined = question.distractorMeaning?.[chosen];
  if (!tag) return patterns;
  const forSkill = patterns[skillId] ?? {};
  return {
    ...patterns,
    [skillId]: { ...forSkill, [tag]: (forSkill[tag] ?? 0) + 1 },
  };
}

/**
 * Fold one level's answers into the ladders.
 *
 * Ten level answers count exactly as ten practice answers -- but only as
 * evidence about the rung the level actually teaches.
 *
 * Every level is 8 or 10 questions, which is exactly one ladder window, so a
 * replay used to be one guaranteed promote-or-demote. The replay strip offers
 * every level in the grade regardless of where she is standing, so four replays
 * of "Adding 1 more" walked a child from rung 2 to rung 6, "Adding within 100",
 * on nothing harder than n + 1.
 */
export function foldLevelAnswers(
  skills: Record<string, SkillState>,
  patterns: ErrorPatterns,
  answers: SessionAnswer[],
  levelId: string,
  grade: GradeLevel | null,
): { skills: Record<string, SkillState>; errorPatterns: ErrorPatterns; levelUps: LevelUp[] } {
  const levelSkill = SKILL_FOR_LEVEL.get(levelId) ?? null;
  const levelRung = RUNG_FOR_LEVEL.get(levelId);

  const next = { ...skills };
  let errorPatterns = patterns;
  const levelUps: LevelUp[] = [];
  for (const { question, correct, chosen, ms } of answers) {
    const skillId = skillForQuestion(question, levelId);
    if (!skillId) continue;
    if (!correct) errorPatterns = noteError(errorPatterns, skillId, question, chosen);
    // A level teaches one rung of one topic. A question that a mixed level
    // routes to a *second* ladder sits at no known rung there, so it counts
    // toward her totals and her SRS but must not move her.
    const servedRung = skillId === levelSkill ? levelRung ?? null : null;
    const before = next[skillId] ?? newSkillState(skillId);
    const result = recordSkillAnswer(before, correct, ceilingFor(skillId, grade), servedRung, ms);
    next[skillId] = result.state;
    if (result.move === 'promoted') levelUps.push({ skillId, rung: result.state.rung });
  }
  return { skills: next, errorPatterns, levelUps };
}

/**
 * Fold a mixed session's answers into the ladders, as evidence about her
 * totals but not about where she is standing.
 *
 * The daily challenge, a Master Mode run and a review session all draw across
 * rungs on purpose, so no answer in them can say whether her *current* rung is
 * comfortable — that is what `servedRung: null` means. Before this, these
 * three modes wrote nothing the ladder could read at all, which is the same
 * "two worlds" split CLAUDE.md says the design exists to prevent, just moved
 * to different screens.
 *
 * `sourceId` is the topic of a Master run, or 'daily' / 'review'. It only
 * routes an answer whose question names no ladder of its own.
 */
export function foldMixedAnswers(
  skills: Record<string, SkillState>,
  patterns: ErrorPatterns,
  answers: SessionAnswer[],
  sourceId: string,
  grade: GradeLevel | null,
): { skills: Record<string, SkillState>; errorPatterns: ErrorPatterns } {
  const next = { ...skills };
  let errorPatterns = patterns;
  for (const { question, correct, chosen } of answers) {
    const skillId = skillForQuestion(question, sourceId);
    if (!skillId) continue;
    const before = next[skillId] ?? newSkillState(skillId);
    next[skillId] = recordSkillAnswer(before, correct, ceilingFor(skillId, grade), null).state;
    if (!correct) errorPatterns = noteError(errorPatterns, skillId, question, chosen);
  }
  return { skills: next, errorPatterns };
}

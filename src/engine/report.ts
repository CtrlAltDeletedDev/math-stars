import { UserProgress, ErrorTag, SkillState } from '@/types';
import { SKILLS, SKILLS_BY_ID } from '@/data/skills';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { ceilingFor } from '@/data/grades';
import { questionFromId } from './questionGenerator';
import { isServableCard } from './sessionBuilder';
import { GAME_CONFIG } from '@/constants/gameConfig';

// What to tell a grown-up who has thirty seconds.
//
// The Parent screen opens on a star count, a badge count and "6/51 levels" —
// none of which changes what anyone does tomorrow. Everything here is built to
// finish the sentence "so this week, do ___", and anything that cannot finish
// that sentence does not belong in this file.

/** How a mistake reads to someone who is not a maths teacher, and what to do. */
const TAG_COPY: Record<Exclude<ErrorTag, 'unknown'>, { label: string; suggestion: string }> = {
  'off-by-one': {
    label: 'counting one too far, or stopping one short',
    suggestion: 'Count together on fingers and say the last number out loud — the slip is almost always at the end.',
  },
  'wrong-operation': {
    label: 'adding when the sign says take away, or the other way round',
    suggestion: 'Before answering, ask her: "are we getting more, or fewer?" Reading the sign is the whole skill here.',
  },
  'answered-a-given-number': {
    label: 'answering with a number the question already showed her',
    suggestion: 'A sign she is guessing from what is on screen. Try the same sums with objects she can move.',
  },
  'answered-the-whole': {
    label: 'giving the whole amount when asked for a part',
    suggestion: 'Part-whole talk helps: "we have 10 altogether, 6 are red, so how many are blue?"',
  },
  'place-value': {
    label: 'losing track of a ten — 14 for 4, or 7 for 17',
    suggestion: 'Worth ten minutes with tens and ones written in two columns before more practice.',
  },
  'wrong-multiple': {
    label: 'landing on the wrong multiple when counting in groups',
    suggestion: 'Count the pattern out loud together — 5, 10, 15 — before she meets it written down.',
  },
  'counted-the-wrong-thing': {
    label: 'counting the objects instead of what they are worth',
    suggestion: 'Real coins on a table for a few minutes beats another worksheet here.',
  },
  reversed: {
    label: 'giving the leftover instead of the part asked for',
    suggestion: 'Have her say the question back in her own words before answering it.',
  },
};

/** Below this a "pattern" is one or two slips, which is just a child having a day. */
export const PATTERN_MIN_COUNT = 3;

export interface MistakePattern {
  tag: Exclude<ErrorTag, 'unknown'>;
  count: number;
  /** Of the mistakes on this skill that meant something. */
  share: number;
  label: string;
  suggestion: string;
}

/**
 * What she keeps getting wrong on one skill, commonest first.
 *
 * 'unknown' is excluded rather than ranked: it is a near miss with no story,
 * and putting it in a list headed "what to work on" would be inventing one.
 */
export function mistakesForSkill(progress: UserProgress, skillId: string): MistakePattern[] {
  const counts = progress.errorPatterns?.[skillId];
  if (!counts) return [];

  const meaningful = Object.entries(counts)
    .filter(([tag]) => tag !== 'unknown') as [Exclude<ErrorTag, 'unknown'>, number][];
  const total = meaningful.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return [];

  return meaningful
    .filter(([, n]) => n >= PATTERN_MIN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count, share: count / total, ...TAG_COPY[tag] }));
}

export interface SkillMistake extends MistakePattern {
  skillId: string;
  skillTitle: string;
}

/**
 * The one thing most worth saying, across every skill.
 *
 * Ranked by how many times it has happened rather than by share: a pattern seen
 * twenty times matters more than one that is 100% of three.
 */
export function topMistakes(progress: UserProgress, limit = 3): SkillMistake[] {
  const all: SkillMistake[] = [];
  for (const skill of SKILLS) {
    for (const pattern of mistakesForSkill(progress, skill.id)) {
      all.push({ ...pattern, skillId: skill.id, skillTitle: skill.title });
    }
  }
  return all.sort((a, b) => b.count - a.count).slice(0, limit);
}

export interface HardFact {
  questionId: string;
  prompt: string;
  answer: string;
}

/**
 * The individual facts she keeps missing.
 *
 * Free: SRS ids are already the fact (`add-8+7`), `easeFactor` already falls
 * every time she gets one wrong, and `questionFromId` already turns an id back
 * into a real question. Nothing new is recorded for this.
 *
 * Only cards below the starting ease appear, so a card she has simply not seen
 * often cannot look like a struggle.
 */
export function hardestFacts(progress: UserProgress, limit = 5): HardFact[] {
  return Object.values(progress.srsCards ?? {})
    .filter((c) => c.easeFactor < GAME_CONFIG.srsInitialEase && isServableCard(c.questionId))
    .sort((a, b) => a.easeFactor - b.easeFactor || b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map((c) => {
      const q = ALL_QUESTIONS_BY_ID.get(c.questionId) ?? questionFromId(c.questionId);
      return q ? { questionId: c.questionId, prompt: q.prompt, answer: q.correctAnswer } : null;
    })
    .filter((f): f is HardFact => f !== null);
}

export interface WorkingOn {
  skillId: string;
  title: string;
  emoji: string;
  /** The rung label, already written in words a parent can read. */
  rungLabel: string;
  accuracy: number | null;
  attempts: number;
}

/**
 * The single topic to name at the top of the screen.
 *
 * Her least accurate in-scope skill with enough evidence to be worth naming —
 * which is the one a parent can actually help with this week. Lifetime accuracy,
 * not `recent`: the sliding window is cleared on every promotion and demotion,
 * so right after anything interesting happens it reads 0% of 1.
 */
export function workingOn(progress: UserProgress): WorkingOn | null {
  const MIN_ATTEMPTS = 10;
  let worst: { skill: typeof SKILLS[number]; state: SkillState; accuracy: number } | null = null;

  for (const skill of SKILLS) {
    const state = progress.skills?.[skill.id];
    if (!state || state.attempts < MIN_ATTEMPTS) continue;
    // Out of scope for her grade is not hers to work on.
    if (ceilingFor(skill.id, progress.gradeLevel) === 0 && !progress.skills?.[skill.id]) continue;
    const accuracy = state.correct / state.attempts;
    if (!worst || accuracy < worst.accuracy) worst = { skill, state, accuracy };
  }

  if (!worst) return null;
  const def = SKILLS_BY_ID.get(worst.skill.id)!;
  const rung = def.rungs[Math.min(worst.state.rung, def.rungs.length - 1)];
  return {
    skillId: worst.skill.id,
    title: worst.skill.title,
    emoji: worst.skill.emoji,
    rungLabel: rung.label,
    accuracy: worst.accuracy,
    attempts: worst.state.attempts,
  };
}

/** Days played in the last `n` calendar days, from the history she already has. */
export function daysPlayedIn(progress: UserProgress, days: number, from = new Date()): number {
  const history = new Set(progress.playHistory ?? []);
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (history.has(key)) count++;
  }
  return count;
}

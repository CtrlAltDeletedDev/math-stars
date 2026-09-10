import { SKILLS_BY_ID } from './skills';

// What's in scope, and how far up.
//
// The ladder in skillLadder.ts decides how *hard* a question is from her answers.
// It has never had an opinion about what she should be meeting at all — which is
// why a five-year-old could be served the seven times table in her first session.
// A grade is the missing bound: the parent says which year she is in, and that
// picks both the set of topics and the highest rung of each one.
//
// Deliberately NOT a difficulty setting. Within the band she still moves on
// evidence, exactly as before. The grade only draws the edges of the box.
//
// The ceiling is soft: hitting it doesn't stop her playing, it just stops the
// rung going up (see recordSkillAnswer) and tells the parent she's ready to move
// on. A child is never blocked, only bounded.

export type GradeLevel = 'K' | '1' | '2';

export interface GradeBand {
  id: GradeLevel;
  /** Parent-facing only — the child never sees a grade anywhere. */
  label: string;
  emoji: string;
  /**
   * skillId -> highest rung index in scope.
   * A skill absent from this map is out of scope for the grade entirely.
   */
  ceilings: Record<string, number>;
}

export const DEFAULT_GRADE: GradeLevel = '1';

// Bands are cumulative: K ⊆ 1 ⊆ 2, in both membership and per-skill ceiling.
// grades.test.ts asserts it, so a later edit can't quietly make a topic vanish
// when a child is moved *up* a year.

const K_CEILINGS: Record<string, number> = {
  counting: 2, // counting to 20, ordering numbers
  comparing: 0, // comparing to 10
  adding: 3, // within 10
  'taking-away': 3, // within 10
  'number-bonds': 0, // bonds to 5 and 10
  strategies: 0, // doubles to 10
  shapes: 1,
  measuring: 0,
};

const GRADE_1_CEILINGS: Record<string, number> = {
  ...K_CEILINGS,
  comparing: 1, // to 20
  adding: 4, // within 20
  'taking-away': 4, // within 20
  'number-bonds': 1, // bonds to 20
  strategies: 4, // doubles, make ten, count on, make twenty
  shapes: 2,
  measuring: 1,
  // New in first grade
  'mystery-number': 2, // missing number both ways to 20
  'fact-families': 0, // families to 10
  'place-value': 1, // building numbers from tens and ones
  clocks: 1, // o'clock and half past
  'counting-up': 2, // skip counting by 2s, 5s, 10s — no tables yet
  stories: 2,
  fractions: 1, // halves and fourths
  money: 0, // naming coins
};

const GRADE_2_CEILINGS: Record<string, number> = {
  ...GRADE_1_CEILINGS,
  adding: 7, // within 200
  'taking-away': 6, // within 100
  'mystery-number': 3,
  'fact-families': 1,
  'place-value': 2,
  clocks: 2, // quarter past and quarter to
  'counting-up': 4, // ×2, ×5, ×10 tables
  fractions: 2, // thirds
  money: 4, // change from a dollar
  // New in second grade
  'even-odd': 1,
};

export const GRADES: GradeBand[] = [
  { id: 'K', label: 'Kindergarten', emoji: '🌱', ceilings: K_CEILINGS },
  { id: '1', label: '1st grade', emoji: '🌳', ceilings: GRADE_1_CEILINGS },
  { id: '2', label: '2nd grade', emoji: '🌟', ceilings: GRADE_2_CEILINGS },
];

export const GRADES_BY_ID = new Map(GRADES.map((g) => [g.id, g]));

/** Every rung a skill actually has, regardless of grade. */
function topRungOf(skillId: string): number {
  const skill = SKILLS_BY_ID.get(skillId);
  return skill ? skill.rungs.length - 1 : 0;
}

/**
 * The highest rung this grade allows for a skill.
 *
 * With no grade set yet (a save from before grades existed, or a child who
 * hasn't been through the grade screen) this is the skill's own top rung, so
 * every caller keeps working unchanged and nothing is accidentally narrowed.
 */
export function ceilingFor(skillId: string, grade: GradeLevel | null): number {
  if (!grade) return topRungOf(skillId);
  const band = GRADES_BY_ID.get(grade);
  const ceiling = band?.ceilings[skillId];
  if (ceiling === undefined) return topRungOf(skillId);
  // Never exceed what the ladder actually has, even if the table drifts.
  return Math.min(ceiling, topRungOf(skillId));
}

/** Is this skill taught at all in this grade? */
export function isInGrade(skillId: string, grade: GradeLevel | null): boolean {
  if (!grade) return true;
  return GRADES_BY_ID.get(grade)?.ceilings[skillId] !== undefined;
}

/** The skills this grade covers, in SKILLS order. */
export function skillIdsForGrade(grade: GradeLevel | null): string[] {
  return [...SKILLS_BY_ID.keys()].filter((id) => isInGrade(id, grade));
}

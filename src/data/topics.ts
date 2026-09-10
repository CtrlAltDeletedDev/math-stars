import { Level, Question } from '@/types';
import { CATEGORIES, getLevelById } from './categories';
import { SKILLS, SKILLS_BY_ID } from './skills';
import { GradeLevel, ceilingFor, isInGrade } from './grades';

// The bridge between the two halves of the app.
//
// A "topic" is a skill wearing the clothes of a category. Until now those were
// separate worlds: `categories[].levels[]` (numbered, locked, starred) and
// `skills[]` (adaptive rungs) modelled the same maths with the same generator
// params and never shared a byte. A child could three-star every level in
// One Step at a Time and still be served rung 0 the moment she opened Practice,
// because passing a level wrote nothing the ladder could read.
//
// One topic per skill, and every level belongs to exactly one topic (asserted in
// grades.test.ts). The child now sees a single meter per topic and it moves
// whatever she plays.

export interface TopicLevelRef {
  levelId: string;
  /**
   * The rung this level is teaching. Earns its keep three times over: seeding
   * the ladder from level history during the v5 migration, scoping the replay
   * strip to the grade, and picking the lesson nearest her current rung.
   */
  rung: number;
}

export interface Topic {
  /** Identical to the skill id — the skill *is* the topic. */
  id: string;
  title: string;
  emoji: string;
  bgColor: string;
  darkColor: string;
  /** In teaching order. Empty is legal: fractions is practice-only. */
  levels: TopicLevelRef[];
  /** For the existing STORIES lookup, which is still keyed by category. */
  storyCategoryId?: string;
}

// Colours are inherited from the categories these levels came from, so the app
// keeps looking like itself.
export const TOPICS: Topic[] = [
  {
    id: 'adding',
    title: 'Adding',
    emoji: '➕',
    bgColor: '#FF6B6B',
    darkColor: '#D94F4F',
    storyCategoryId: 'addition',
    levels: [
      { levelId: 'steps-add-1', rung: 0 },
      { levelId: 'steps-add-2', rung: 1 },
      { levelId: 'steps-mix-1', rung: 1 },
      { levelId: 'steps-mix-2', rung: 1 },
      { levelId: 'addition-1', rung: 2 },
      { levelId: 'addition-2', rung: 3 },
      { levelId: 'addition-3', rung: 4 },
      { levelId: 'mixed-1', rung: 4 },
    ],
  },
  {
    id: 'taking-away',
    title: 'Taking Away',
    emoji: '➖',
    bgColor: '#EF5350',
    darkColor: '#C62828',
    levels: [
      { levelId: 'steps-sub-1', rung: 0 },
      { levelId: 'steps-sub-2', rung: 1 },
      { levelId: 'subtraction-1', rung: 2 },
      { levelId: 'subtraction-2', rung: 3 },
    ],
  },
  {
    id: 'strategies',
    title: 'Number Tricks',
    emoji: '💡',
    bgColor: '#FFA726',
    darkColor: '#EF6C00',
    levels: [
      { levelId: 'strategy-doubles', rung: 1 },
      { levelId: 'strategy-make-ten', rung: 2 },
      { levelId: 'strategy-count-on', rung: 3 },
    ],
  },
  {
    id: 'stories',
    title: 'Story Problems',
    emoji: '📖',
    bgColor: '#8D6E63',
    darkColor: '#4E342E',
    levels: [{ levelId: 'word-problems', rung: 2 }],
  },
  {
    id: 'counting',
    title: 'Counting',
    emoji: '🔟',
    bgColor: '#5DD97A',
    darkColor: '#3DB85A',
    storyCategoryId: 'counting',
    levels: [
      { levelId: 'count-1', rung: 0 },
      { levelId: 'count-2', rung: 1 },
      { levelId: 'count-3', rung: 2 },
    ],
  },
  {
    id: 'comparing',
    title: 'Comparing',
    emoji: '⚖️',
    bgColor: '#26A69A',
    darkColor: '#00695C',
    levels: [
      { levelId: 'count-4', rung: 0 },
      { levelId: 'cmp-to10', rung: 0 },
      { levelId: 'cmp-to20', rung: 1 },
    ],
  },
  {
    id: 'number-bonds',
    title: 'Number Bonds',
    emoji: '🔗',
    bgColor: '#FF8F00',
    darkColor: '#E65100',
    levels: [
      { levelId: 'nb-bonds-5', rung: 0 },
      { levelId: 'nb-bonds-10', rung: 0 },
      { levelId: 'nb-bonds-20', rung: 1 },
    ],
  },
  {
    id: 'mystery-number',
    title: 'Mystery Number',
    emoji: '🧩',
    bgColor: '#66BB6A',
    darkColor: '#2E7D32',
    levels: [
      { levelId: 'miss-add-10', rung: 0 },
      { levelId: 'miss-add-20', rung: 1 },
      { levelId: 'miss-mixed-20', rung: 2 },
    ],
  },
  {
    id: 'fact-families',
    title: 'Fact Families',
    emoji: '👨‍👩‍👧',
    bgColor: '#F06292',
    darkColor: '#C2185B',
    levels: [
      { levelId: 'ff-to10', rung: 0 },
      { levelId: 'ff-to20', rung: 1 },
    ],
  },
  {
    id: 'place-value',
    title: 'Tens & Ones',
    emoji: '🏗️',
    bgColor: '#00ACC1',
    darkColor: '#007C91',
    levels: [
      { levelId: 'pv-ones-tens', rung: 0 },
      { levelId: 'pv-building', rung: 1 },
      { levelId: 'pv-comparing', rung: 2 },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes & Patterns',
    emoji: '🔷',
    bgColor: '#C77DFF',
    darkColor: '#9B50E0',
    storyCategoryId: 'shapes',
    levels: [
      { levelId: 'shapes-1', rung: 0 },
      { levelId: 'shapes-2', rung: 1 },
      { levelId: 'patterns-1', rung: 1 },
      { levelId: 'patterns-2', rung: 2 },
    ],
  },
  {
    id: 'clocks',
    title: 'Clocks',
    emoji: '🕐',
    bgColor: '#F9CA24',
    darkColor: '#E55039',
    storyCategoryId: 'time',
    levels: [
      { levelId: 'time-oclock', rung: 0 },
      { levelId: 'time-halfpast', rung: 1 },
      { levelId: 'time-quarter', rung: 2 },
      { levelId: 'time-mixed', rung: 2 },
    ],
  },
  {
    id: 'counting-up',
    title: 'Skip Counting',
    emoji: '🚀',
    bgColor: '#4FC3F7',
    darkColor: '#0288D1',
    storyCategoryId: 'multiplication',
    levels: [
      { levelId: 'skip-2', rung: 0 },
      { levelId: 'skip-5', rung: 1 },
      { levelId: 'skip-10', rung: 2 },
      { levelId: 'times-2', rung: 4 },
      { levelId: 'times-5', rung: 4 },
      { levelId: 'times-10', rung: 4 },
    ],
  },
  {
    id: 'even-odd',
    title: 'Even & Odd',
    emoji: '🟰',
    bgColor: '#7986CB',
    darkColor: '#3949AB',
    levels: [
      { levelId: 'eo-id', rung: 0 },
      { levelId: 'eo-find', rung: 1 },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    emoji: '🪙',
    bgColor: '#FFB300',
    darkColor: '#FF6F00',
    levels: [{ levelId: 'measure-coins', rung: 0 }],
  },
  {
    id: 'measuring',
    title: 'Measuring',
    emoji: '📏',
    bgColor: '#FF7043',
    darkColor: '#BF360C',
    levels: [{ levelId: 'measure-length', rung: 0 }],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    emoji: '🍕',
    bgColor: '#AB47BC',
    darkColor: '#6A1B9A',
    levels: [], // no hand-built levels — practice only
  },
];

export const TOPICS_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

/** Derived, so there is no second table to drift out of step. */
export const SKILL_FOR_LEVEL = new Map<string, string>(
  TOPICS.flatMap((t) => t.levels.map((l) => [l.levelId, t.id] as [string, string])),
);

/** The rung a given level teaches, for seeding and lesson lookup. */
export const RUNG_FOR_LEVEL = new Map<string, number>(
  TOPICS.flatMap((t) => t.levels.map((l) => [l.levelId, l.rung] as [string, number])),
);

/**
 * Which ladder one answer belongs to.
 *
 * Routed on question type first, so a level that deliberately mixes two
 * operations — the two `steps-mix-*` levels and `mixed-1` — credits adding and
 * taking away separately instead of dumping ten subtraction answers into the
 * adding ladder. Falls back to the level's own topic for everything else.
 */
export function skillForQuestion(q: Question, levelId: string): string | null {
  switch (q.type) {
    case 'addition':
      return 'adding';
    case 'subtraction':
      return 'taking-away';
    case 'missing_number':
      return 'mystery-number';
    case 'word_problem':
      return 'stories';
    case 'multiplication':
    case 'skip_count':
      return 'counting-up';
    case 'fraction':
      return 'fractions';
    case 'money':
      return 'money';
    case 'measurement':
      return 'measuring';
    case 'tell_time':
      return 'clocks';
    case 'number_bond':
      return 'number-bonds';
    case 'fact_family':
      return 'fact-families';
    case 'even_odd':
      return 'even-odd';
    case 'place_value':
      return 'place-value';
    case 'number_compare':
      return 'comparing';
    case 'shape_identify':
    case 'pattern_complete':
      return 'shapes';
    case 'counting':
    case 'number_order':
      return 'counting';
    default:
      return SKILL_FOR_LEVEL.get(levelId) ?? null;
  }
}

/** Topics this grade covers, in TOPICS order. Order is fixed on purpose: a child who cannot read navigates by position. */
export function topicsForGrade(grade: GradeLevel | null): Topic[] {
  return TOPICS.filter((t) => isInGrade(t.id, grade));
}

/** The levels of a topic that sit at or below the grade's ceiling. */
export function topicLevelsInScope(topic: Topic, grade: GradeLevel | null): Level[] {
  const ceiling = ceilingFor(topic.id, grade);
  return topic.levels
    .filter((ref) => ref.rung <= ceiling)
    .map((ref) => getLevelById(ref.levelId))
    .filter((l): l is Level => l !== null);
}

/** Every level in the catalogue, for the invariant tests. */
export function allCatalogueLevelIds(): string[] {
  return CATEGORIES.flatMap((c) => c.levels.map((l) => l.id));
}

/** Topics that exist as skills — used to assert the two lists stay in step. */
export function allSkillIds(): string[] {
  return SKILLS.map((s) => s.id);
}

export function topicFor(skillId: string): Topic | undefined {
  return TOPICS_BY_ID.get(skillId);
}

export function skillTitle(skillId: string): string {
  return SKILLS_BY_ID.get(skillId)?.title ?? skillId;
}

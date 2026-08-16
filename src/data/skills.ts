import { Question } from '@/types';
import { generateFromParams } from '@/engine/questionGenerator';
import { generateFractionQuestion } from './fractions';
import { generateMoneyQuestion, MoneyMode } from './moneyGen';
import { ALL_QUESTIONS_BY_ID } from './categories';

// The growth ladder.
//
// Categories teach a topic and finish. Skills never finish: each one is a
// sequence of rungs, and the practice mode asks questions at whatever rung the
// child is currently standing on. She advances on evidence rather than on a
// grade the parent picked, and she can be high on adding while still low on
// telling time — which is how children actually are.
//
// Two kinds of rung:
//   generated — infinite questions from a generator, parameters per rung.
//   bank      — drawn from the hand-written banks, filtered by the authored
//               `difficulty`. Finite, but the SRS keeps them from going stale.

export type RungSource =
  | { kind: 'generated'; params: Record<string, number | string> }
  | { kind: 'fraction'; dens: number[]; mode: 'recognise' | 'ofSet' | 'compare' }
  | { kind: 'money'; mode: MoneyMode }
  | { kind: 'bank'; types: string[]; difficulty: number[] };

export interface Rung {
  /** Shown to a parent, not to the child. */
  label: string;
  source: RungSource;
}

export interface Skill {
  id: string;
  title: string;
  emoji: string;
  /** Kid-facing rank names, one per rung reached. */
  rungs: Rung[];
}

export const SKILLS: Skill[] = [
  {
    id: 'adding',
    title: 'Adding',
    emoji: '➕',
    rungs: [
      { label: 'Adding within 5', source: { kind: 'generated', params: { operation: 'addition', maxSum: 5 } } },
      { label: 'Adding within 10', source: { kind: 'generated', params: { operation: 'addition', maxSum: 10 } } },
      { label: 'Adding within 20', source: { kind: 'generated', params: { operation: 'addition', maxSum: 20 } } },
      { label: 'Adding within 50', source: { kind: 'generated', params: { operation: 'addition', maxSum: 50 } } },
      { label: 'Adding within 100', source: { kind: 'generated', params: { operation: 'addition', maxSum: 100 } } },
      { label: 'Adding within 200', source: { kind: 'generated', params: { operation: 'addition', maxSum: 200 } } },
    ],
  },
  {
    id: 'taking-away',
    title: 'Taking Away',
    emoji: '➖',
    rungs: [
      { label: 'Subtracting within 5', source: { kind: 'generated', params: { operation: 'subtraction', maxMinuend: 5 } } },
      { label: 'Subtracting within 10', source: { kind: 'generated', params: { operation: 'subtraction', maxMinuend: 10 } } },
      { label: 'Subtracting within 20', source: { kind: 'generated', params: { operation: 'subtraction', maxMinuend: 20 } } },
      { label: 'Subtracting within 50', source: { kind: 'generated', params: { operation: 'subtraction', maxMinuend: 50 } } },
      { label: 'Subtracting within 100', source: { kind: 'generated', params: { operation: 'subtraction', maxMinuend: 100 } } },
    ],
  },
  {
    id: 'mystery-number',
    title: 'Mystery Number',
    emoji: '🧩',
    rungs: [
      { label: 'Missing addend to 10', source: { kind: 'generated', params: { operation: 'missing', maxSum: 10, kind: 'addition' } } },
      { label: 'Missing addend to 20', source: { kind: 'generated', params: { operation: 'missing', maxSum: 20, kind: 'addition' } } },
      { label: 'Missing number, both ways, to 20', source: { kind: 'generated', params: { operation: 'missing', maxSum: 20, kind: 'both' } } },
      { label: 'Missing number, both ways, to 50', source: { kind: 'generated', params: { operation: 'missing', maxSum: 50, kind: 'both' } } },
    ],
  },
  {
    id: 'counting-up',
    title: 'Counting Up',
    emoji: '🚀',
    rungs: [
      { label: 'Skip counting by 2s', source: { kind: 'generated', params: { operation: 'skip_count', by: 2, maxStart: 20 } } },
      { label: 'Skip counting by 5s', source: { kind: 'generated', params: { operation: 'skip_count', by: 5, maxStart: 50 } } },
      { label: 'Skip counting by 10s', source: { kind: 'generated', params: { operation: 'skip_count', by: 10, maxStart: 100 } } },
      { label: 'Skip counting by 3s', source: { kind: 'generated', params: { operation: 'skip_count', by: 3, maxStart: 30 } } },
      { label: '×2, ×5 and ×10 tables', source: { kind: 'generated', params: { operation: 'multiplication', tables: '2,5,10' } } },
      { label: '×3, ×4 and ×6 tables', source: { kind: 'generated', params: { operation: 'multiplication', tables: '3,4,6' } } },
      { label: 'All tables to ×9', source: { kind: 'generated', params: { operation: 'multiplication', tables: '2,3,4,5,6,7,8,9' } } },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    emoji: '🪙',
    rungs: [
      { label: 'Naming coins', source: { kind: 'money', mode: 'name' } },
      { label: 'Counting one kind of coin', source: { kind: 'money', mode: 'like' } },
      { label: 'Counting mixed coins', source: { kind: 'money', mode: 'mixed' } },
      { label: 'Change from 25¢', source: { kind: 'money', mode: 'change25' } },
      { label: 'Change from a dollar', source: { kind: 'money', mode: 'change100' } },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    emoji: '🍕',
    rungs: [
      { label: 'Halves', source: { kind: 'fraction', dens: [2], mode: 'recognise' } },
      { label: 'Halves and fourths', source: { kind: 'fraction', dens: [2, 4], mode: 'recognise' } },
      { label: 'Halves, thirds and fourths', source: { kind: 'fraction', dens: [2, 3, 4], mode: 'recognise' } },
      { label: 'Sixths and eighths too', source: { kind: 'fraction', dens: [2, 3, 4, 6, 8], mode: 'recognise' } },
      { label: 'Fractions of a group', source: { kind: 'fraction', dens: [2, 3, 4], mode: 'ofSet' } },
      { label: 'Comparing fractions', source: { kind: 'fraction', dens: [2, 3, 4, 6, 8], mode: 'compare' } },
    ],
  },
  {
    id: 'strategies',
    title: 'Number Tricks',
    emoji: '💡',
    rungs: [
      { label: 'Doubles to 10', source: { kind: 'generated', params: { operation: 'doubles', maxAddend: 5 } } },
      { label: 'Doubles to 20', source: { kind: 'generated', params: { operation: 'doubles', maxAddend: 10 } } },
      { label: 'Making ten', source: { kind: 'generated', params: { operation: 'make_ten', target: 10 } } },
      { label: 'Counting on within 20', source: { kind: 'generated', params: { operation: 'count_on', maxStart: 18 } } },
      { label: 'Making twenty', source: { kind: 'generated', params: { operation: 'make_ten', target: 20 } } },
    ],
  },
  {
    id: 'stories',
    title: 'Story Problems',
    emoji: '📖',
    rungs: [
      { label: 'Adding stories', source: { kind: 'generated', params: { operation: 'word_problem', wordType: 'addition' } } },
      { label: 'Taking away stories', source: { kind: 'generated', params: { operation: 'word_problem', wordType: 'subtraction' } } },
      { label: 'Mixed stories', source: { kind: 'generated', params: { operation: 'word_problem', wordType: 'mixed' } } },
    ],
  },
  {
    id: 'comparing',
    title: 'Comparing',
    emoji: '⚖️',
    rungs: [
      { label: 'Comparing to 10', source: { kind: 'bank', types: ['number_compare'], difficulty: [1] } },
      { label: 'Comparing to 20', source: { kind: 'bank', types: ['number_compare'], difficulty: [1, 2] } },
    ],
  },
  {
    id: 'place-value',
    title: 'Tens & Ones',
    emoji: '🔢',
    rungs: [
      { label: 'Finding ones and tens', source: { kind: 'bank', types: ['place_value'], difficulty: [1] } },
      { label: 'Building numbers', source: { kind: 'bank', types: ['place_value'], difficulty: [1, 2] } },
      { label: 'Comparing two-digit numbers', source: { kind: 'bank', types: ['place_value'], difficulty: [2, 3] } },
    ],
  },
  {
    id: 'clocks',
    title: 'Clocks',
    emoji: '🕐',
    rungs: [
      { label: "O'clock", source: { kind: 'bank', types: ['tell_time'], difficulty: [1] } },
      { label: 'Half past too', source: { kind: 'bank', types: ['tell_time'], difficulty: [1, 2] } },
      { label: 'Quarter past and quarter to', source: { kind: 'bank', types: ['tell_time'], difficulty: [2, 3] } },
    ],
  },
  {
    id: 'number-bonds',
    title: 'Number Bonds',
    emoji: '🔗',
    rungs: [
      { label: 'Bonds to 5 and 10', source: { kind: 'bank', types: ['number_bond'], difficulty: [1] } },
      { label: 'Bonds to 20', source: { kind: 'bank', types: ['number_bond'], difficulty: [1, 2] } },
    ],
  },
  {
    id: 'fact-families',
    title: 'Fact Families',
    emoji: '👨‍👩‍👧',
    rungs: [
      { label: 'Families to 10', source: { kind: 'bank', types: ['fact_family'], difficulty: [2] } },
      { label: 'Families to 20', source: { kind: 'bank', types: ['fact_family'], difficulty: [2, 3] } },
    ],
  },
  {
    id: 'even-odd',
    title: 'Even & Odd',
    emoji: '🟰',
    rungs: [
      { label: 'Even or odd to 10', source: { kind: 'bank', types: ['even_odd'], difficulty: [1] } },
      { label: 'Even or odd to 20', source: { kind: 'bank', types: ['even_odd'], difficulty: [1, 2] } },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes & Patterns',
    emoji: '🔷',
    rungs: [
      { label: 'Basic shapes and patterns', source: { kind: 'bank', types: ['shape_identify', 'pattern_complete'], difficulty: [1] } },
      { label: 'More shapes and patterns', source: { kind: 'bank', types: ['shape_identify', 'pattern_complete'], difficulty: [1, 2] } },
      { label: 'Harder patterns', source: { kind: 'bank', types: ['shape_identify', 'pattern_complete'], difficulty: [2, 3] } },
    ],
  },
  {
    id: 'counting',
    title: 'Counting',
    emoji: '🔟',
    rungs: [
      { label: 'Counting to 10', source: { kind: 'bank', types: ['counting', 'number_order'], difficulty: [1] } },
      { label: 'Counting to 20', source: { kind: 'bank', types: ['counting', 'number_order'], difficulty: [1, 2] } },
      { label: 'Ordering numbers', source: { kind: 'bank', types: ['counting', 'number_order'], difficulty: [2, 3] } },
    ],
  },
];

export const SKILLS_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

/** Kid-facing rank for a rung index. Growth she can see without reading much. */
export const RANKS = ['🌱', '🌿', '🌳', '⭐', '🌟', '👑', '🏆'] as const;

export function rankFor(rung: number): string {
  return RANKS[Math.min(rung, RANKS.length - 1)];
}

let bankByType: Map<string, Question[]> | null = null;

function bankIndex(): Map<string, Question[]> {
  if (!bankByType) {
    bankByType = new Map();
    for (const q of ALL_QUESTIONS_BY_ID.values()) {
      if (!bankByType.has(q.type)) bankByType.set(q.type, []);
      bankByType.get(q.type)!.push(q);
    }
  }
  return bankByType;
}

/** Every bank question a rung can draw from. */
export function bankPoolFor(source: Extract<RungSource, { kind: 'bank' }>): Question[] {
  const idx = bankIndex();
  const out: Question[] = [];
  for (const t of source.types) {
    for (const q of idx.get(t) ?? []) {
      if (source.difficulty.includes(q.difficulty)) out.push(q);
    }
  }
  return out;
}

/** One question at the given rung of the given skill. */
export function questionForRung(skill: Skill, rung: number): Question | null {
  const r = skill.rungs[Math.min(rung, skill.rungs.length - 1)];
  if (!r) return null;

  switch (r.source.kind) {
    case 'generated':
      return generateFromParams(r.source.params);
    case 'fraction':
      return generateFractionQuestion(r.source.dens, r.source.mode);
    case 'money':
      return generateMoneyQuestion(r.source.mode);
    case 'bank': {
      const pool = bankPoolFor(r.source);
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
}

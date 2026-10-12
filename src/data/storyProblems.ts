import { ErrorTag, Question } from '@/types';
import { buildTaggedChoices, randomInt, shuffle } from '@/engine/choices';

// Story problems within 20, in every shape a first-grade classroom uses.
//
// The older word problems (wordProblems.ts) only ever asked "she had some, then
// got more / gave some away — how many now?", with numbers under ten. That is
// the easiest kind of story there is, and it is not what comes home in the
// backpack. A first-grade unit on adding and subtracting within 20 asks:
//
//   result    Molly has 9 stickers and gets 6 more.          9 + 6 = ?
//   part      Rhett has 14 balls. 6 are soccer balls and
//             the rest are basketballs. How many basketballs? 6 + ? = 14
//   compare   11 gold coins and 7 silver. How many more gold?  7 + ? = 11
//   fewer     Talan has 7 fewer gems than Gordan, who has 19.  19 − 7 = ?
//   change    Nick needs 10 eggs. He has 6. How many more?     6 + ? = 10
//
// Every one of those except "result" is a subtraction in disguise, and the
// mistake they are built to catch is adding the two numbers in the story
// because they are the two numbers in the story. That is the first distractor
// on every one of them, tagged 'wrong-operation', so the parent screen can say
// so in plain words.
//
// Nothing here uses a pronoun for the people in the story. The name is simply
// repeated, which is also easier for a new reader to follow.

const NAMES = [
  'Molly', 'Hudson', 'Talan', 'Gordan', 'Sally', 'Harry', 'Madison', 'Rhett',
  'Kenna', 'Nick', 'Ava', 'Leo', 'Mia', 'Omar', 'Zoe', 'Eli', 'Priya', 'Sam',
  'Lucy', 'Max', 'Ruby', 'Theo', 'Nora', 'Jack',
] as const;

/** Things one person can have a pile of. */
const THINGS = [
  { noun: 'stickers', emoji: '⭐' },
  { noun: 'gems', emoji: '💎' },
  { noun: 'shells', emoji: '🐚' },
  { noun: 'marbles', emoji: '🔵' },
  { noun: 'cards', emoji: '🃏' },
  { noun: 'toy cars', emoji: '🚗' },
  { noun: 'books', emoji: '📚' },
  { noun: 'crayons', emoji: '🖍️' },
  { noun: 'cookies', emoji: '🍪' },
  { noun: 'balloons', emoji: '🎈' },
] as const;

/** A whole made of two kinds, for "some are X and the rest are Y". */
const SPLITS = [
  { whole: 'balls', a: 'soccer balls', b: 'basketballs', emoji: '⚽🏀' },
  { whole: 'stuffed animals', a: 'bears', b: 'bunnies', emoji: '🧸🐰' },
  { whole: 'erasers', a: 'animal erasers', b: 'food erasers', emoji: '🐶🍕' },
  { whole: 'flowers', a: 'red flowers', b: 'yellow flowers', emoji: '🌹🌼' },
  { whole: 'fish', a: 'orange fish', b: 'blue fish', emoji: '🐠🐟' },
  { whole: 'coins', a: 'gold coins', b: 'silver coins', emoji: '🪙' },
  { whole: 'apples', a: 'red apples', b: 'green apples', emoji: '🍎🍏' },
  { whole: 'pets', a: 'dogs', b: 'cats', emoji: '🐶🐱' },
] as const;

/** Things you set out to collect a certain number of. */
const NEEDS = [
  { noun: 'eggs', verb: 'gets', where: ' from the fridge', emoji: '🥚' },
  { noun: 'cups', verb: 'puts out', where: ' on the table', emoji: '🥤' },
  { noun: 'party hats', verb: 'has', where: '', emoji: '🥳' },
  { noun: 'blocks', verb: 'has', where: ' for the tower', emoji: '🧱' },
  { noun: 'stamps', verb: 'has', where: ' in the book', emoji: '📮' },
  { noun: 'seeds', verb: 'plants', where: ' in the garden', emoji: '🌱' },
] as const;

/**
 * Deterministic picks from the operands, so a question rebuilds to exactly the
 * same words from its id — the review session depends on that.
 */
function pick<T>(list: readonly T[], seed: number): T {
  return list[((seed % list.length) + list.length) % list.length];
}

function names(a: number, b: number, v: number): [string, string] {
  const i = a * 7 + b * 3 + v * 5;
  return [pick(NAMES, i), pick(NAMES, i + 11)]; // 11 is coprime with 24: never the same name twice
}

// ---------------------------------------------------------------------------
// Story kinds
// ---------------------------------------------------------------------------

/** The two numbers that appear in the story, and which way the maths goes. */
interface Story {
  id: string;
  /** The story, without the question. */
  story: string;
  /** The question line asked about the number answer. */
  ask: string;
  /** The same question as a clause: "Which number sentence shows {clause}?" */
  clause: string;
  emoji: string;
  /** The bigger and smaller numbers of the story's part–whole. */
  big: number;
  small: number;
  /** Is the answer big + small or big − small? */
  op: 'add' | 'sub';
  hint: string;
  /** The equation a teacher would write for this story. */
  natural: string;
}

type Kind = 'join' | 'sep' | 'part' | 'total' | 'diff' | 'fewer' | 'more' | 'change';

// Variant `v` selects wording; operands are always (x, y) in the order the id
// stores them, and each builder documents what x and y are.

const BUILDERS: Record<Kind, (x: number, y: number, v: number) => Story> = {
  // x + y, x first. "Molly has 9 stickers and gets 6 more."
  join: (x, y, v) => {
    const [n] = names(x, y, v);
    const t = pick(THINGS, x + y + v);
    const story = v % 2 === 0
      ? `${n} has ${x} ${t.noun}. ${n} gets ${y} more.`
      : `There are ${x} ${t.noun} on the table. ${n} brings ${y} more.`;
    return {
      id: `st-join-${v}-${x}-${y}`,
      story,
      ask: v % 2 === 0 ? `How many ${t.noun} does ${n} have now?` : `How many ${t.noun} are there now?`,
      clause: v % 2 === 0 ? `how many ${t.noun} ${n} has now` : `how many ${t.noun} there are now`,
      emoji: t.emoji,
      big: Math.max(x, y), small: Math.min(x, y), op: 'add',
      hint: `Start at ${x} and hop forward ${y}.`,
      natural: `${x} + ${y} = ?`,
    };
  },

  // x − y. "Zoe has 15 cookies. Zoe gives 6 away."
  sep: (x, y, v) => {
    const [n] = names(x, y, v);
    const t = pick(THINGS, x + y + v);
    const story = v % 2 === 0
      ? `${n} has ${x} ${t.noun}. ${n} gives ${y} to a friend.`
      : `${n} had ${x} ${t.noun}. ${n} lost ${y} of them.`;
    return {
      id: `st-sep-${v}-${x}-${y}`,
      story,
      ask: `How many ${t.noun} does ${n} have left?`,
      clause: `how many ${t.noun} ${n} has left`,
      emoji: t.emoji,
      big: x, small: y, op: 'sub',
      hint: `Start at ${x} and hop back ${y}.`,
      natural: `${x} − ${y} = ?`,
    };
  },

  // whole x, known part y, asks for the rest. The one she added on her sheet.
  part: (x, y, v) => {
    const [n] = names(x, y, v);
    const s = pick(SPLITS, x * 3 + y + v);
    const story = v % 2 === 0
      ? `${n} has ${x} ${s.whole}. ${y} are ${s.a} and the rest are ${s.b}.`
      : `${n} has ${x} ${s.whole}. ${n} has ${y} ${s.a} and some ${s.b}.`;
    return {
      id: `st-part-${v}-${x}-${y}`,
      story,
      ask: `How many ${s.b} does ${n} have?`,
      clause: `how many ${s.b} ${n} has`,
      emoji: s.emoji,
      big: x, small: y, op: 'sub',
      hint: `All the ${s.whole} together make ${x}. Take away the ${y} ${s.a} — hop back ${y} from ${x}.`,
      natural: `${y} + ? = ${x}`,
    };
  },

  // part x + part y, asks for the whole. Mixed in with `part` so that "some and
  // the rest" never quietly means "always subtract".
  total: (x, y, v) => {
    const [n] = names(x, y, v);
    const s = pick(SPLITS, x * 3 + y + v);
    return {
      id: `st-total-${v}-${x}-${y}`,
      story: `${n} has ${x} ${s.a} and ${y} ${s.b}.`,
      ask: `How many ${s.whole} does ${n} have in all?`,
      clause: `how many ${s.whole} ${n} has in all`,
      emoji: s.emoji,
      big: Math.max(x, y), small: Math.min(x, y), op: 'add',
      hint: `Put them together: start at ${x} and hop forward ${y}.`,
      natural: `${x} + ${y} = ?`,
    };
  },

  // x has more than y; how many more? "11 gold coins and 7 silver."
  diff: (x, y, v) => {
    const [n1, n2] = names(x, y, v);
    if (v % 3 === 2) {
      const s = pick(SPLITS, x + y);
      return {
        id: `st-diff-${v}-${x}-${y}`,
        story: `${n1} has ${x} ${s.a} and ${y} ${s.b}.`,
        ask: `How many more ${s.a} than ${s.b} does ${n1} have?`,
        clause: `how many more ${s.a} than ${s.b} ${n1} has`,
        emoji: s.emoji,
        big: x, small: y, op: 'sub',
        hint: `Line them up. Start at ${y} and count up to ${x}.`,
        natural: `${y} + ? = ${x}`,
      };
    }
    const t = pick(THINGS, x * 2 + y + v);
    return {
      id: `st-diff-${v}-${x}-${y}`,
      story: `${n1} has ${x} ${t.noun}. ${n2} has ${y} ${t.noun}.`,
      ask: v % 3 === 0
        ? `How many more ${t.noun} does ${n1} have than ${n2}?`
        : `How many fewer ${t.noun} does ${n2} have than ${n1}?`,
      clause: v % 3 === 0
        ? `how many more ${t.noun} ${n1} has than ${n2}`
        : `how many fewer ${t.noun} ${n2} has than ${n1}`,
      emoji: t.emoji,
      big: x, small: y, op: 'sub',
      hint: `Line them up. Start at ${y} and count up to ${x}.`,
      natural: `${y} + ? = ${x}`,
    };
  },

  // n1 has y fewer than n2, who has x. "Talan has 7 fewer gems than Gordan."
  fewer: (x, y, v) => {
    const [n1, n2] = names(x, y, v);
    const t = pick(THINGS, x + y * 2 + v);
    return {
      id: `st-fewer-${v}-${x}-${y}`,
      story: `${n1} has ${y} fewer ${t.noun} than ${n2}. ${n2} has ${x} ${t.noun}.`,
      ask: `How many ${t.noun} does ${n1} have?`,
      clause: `how many ${t.noun} ${n1} has`,
      emoji: t.emoji,
      big: x, small: y, op: 'sub',
      hint: `Fewer means ${n1} has less than ${n2}. Start at ${x} and hop back ${y}.`,
      natural: `${x} − ${y} = ?`,
    };
  },

  // n1 has y more than n2, who has x.
  more: (x, y, v) => {
    const [n1, n2] = names(x, y, v);
    const t = pick(THINGS, x + y * 2 + v);
    return {
      id: `st-more-${v}-${x}-${y}`,
      story: `${n1} has ${y} more ${t.noun} than ${n2}. ${n2} has ${x} ${t.noun}.`,
      ask: `How many ${t.noun} does ${n1} have?`,
      clause: `how many ${t.noun} ${n1} has`,
      emoji: t.emoji,
      big: Math.max(x, y), small: Math.min(x, y), op: 'add',
      hint: `More means ${n1} has extra. Start at ${x} and hop forward ${y}.`,
      natural: `${x} + ${y} = ?`,
    };
  },

  // needs x, has y; how many more? "Nick needs 10 eggs. He gets 6 from the fridge."
  change: (x, y, v) => {
    const [n] = names(x, y, v);
    const t = pick(NEEDS, x + y + v);
    if (v % 2 === 1) {
      return {
        id: `st-change-${v}-${x}-${y}`,
        story: `${n} had ${y} ${t.noun}. Then ${n} got some more. Now ${n} has ${x}.`,
        ask: `How many ${t.noun} did ${n} get?`,
        clause: `how many ${t.noun} ${n} got`,
        emoji: t.emoji,
        big: x, small: y, op: 'sub',
        hint: `Start at ${y} and count up until you reach ${x}.`,
        natural: `${y} + ? = ${x}`,
      };
    }
    return {
      id: `st-change-${v}-${x}-${y}`,
      story: `${n} needs ${x} ${t.noun}. ${n} ${t.verb} ${y}${t.where}.`,
      ask: `How many more ${t.noun} does ${n} still need?`,
      clause: `how many more ${t.noun} ${n} still needs`,
      emoji: t.emoji,
      big: x, small: y, op: 'sub',
      hint: `Start at ${y} and count up until you reach ${x}.`,
      natural: `${y} + ? = ${x}`,
    };
  },
};

/** How many wording variants each kind has (the `v` in its id). */
const VARIANTS: Record<Kind, number> = {
  join: 2, sep: 2, part: 2, total: 1, diff: 3, fewer: 1, more: 1, change: 2,
};

/**
 * Fresh operands for each kind, all staying within 20. Neither number in the
 * story is ever 1: "1 are soccer balls" and "had 1 cups" read wrong, and a
 * story about one thing is not much of a story.
 */
function operandsFor(kind: Kind): [number, number] {
  switch (kind) {
    case 'join':
    case 'total':
    case 'more': {
      const sum = randomInt(6, 20);
      const x = randomInt(2, sum - 2);
      return [x, sum - x];
    }
    default: {
      // x is the whole (or the bigger amount); y a part strictly inside it, so
      // the answer is never 0 and never the whole.
      const x = randomInt(5, 20);
      return [x, randomInt(2, x - 1)];
    }
  }
}

function answerOf(s: Story): number {
  return s.op === 'add' ? s.big + s.small : s.big - s.small;
}

// ---------------------------------------------------------------------------
// Number-answer questions
// ---------------------------------------------------------------------------

function numberQuestion(kind: Kind, x: number, y: number, v: number): Question {
  const s = BUILDERS[kind](x, y, v);
  const correct = answerOf(s);
  const shown = [x, y];
  const candidates: [number, ErrorTag][] = s.op === 'sub'
    ? [
        [s.big + s.small, 'added-story-numbers'], // added the two numbers in the story
        [correct - 1, 'off-by-one'], // counted the start number as a hop
        [correct + 1, 'off-by-one'],
        [s.big, 'answered-the-whole'],
        [s.small, 'answered-a-given-number'],
      ]
    : [
        [s.big - s.small, 'wrong-operation'],
        [correct - 1, 'off-by-one'],
        [correct + 1, 'off-by-one'],
        ...shown.map((n): [number, ErrorTag] => [n, 'answered-a-given-number']),
      ];

  return {
    id: s.id,
    type: 'word_problem',
    prompt: `${s.story}\n${s.ask}`,
    promptEmoji: s.emoji,
    correctAnswer: String(correct),
    ...buildTaggedChoices(correct, candidates, {
      step: 1,
      isValid: (n) => n >= 0 && n <= 40,
      prefer: [s.op === 'sub' ? s.big + s.small : s.big - s.small],
    }),
    difficulty: kind === 'join' || kind === 'sep' ? 2 : 3,
    hint: s.hint,
    speakText: `${s.story} ${s.ask}`,
    visual: { kind: 'numberLine', max: 20 },
  };
}

// ---------------------------------------------------------------------------
// "Which number sentence matches the story?"
// ---------------------------------------------------------------------------

// For a story about B and S (bigger and smaller), every sentence a child might
// write with those two numbers solves to either B − S or B + S. The right one
// solves to the story's answer; every wrong one offered solves to the other, so
// there is exactly one correct button (storyProblems.test.ts solves them all).

/** The wrong sentences, most telling first. */
function wrongForms(st: Story, correct: string): [string, ErrorTag][] {
  const { big: b, small: s } = st;
  if (st.op === 'sub') {
    // Correct is a subtraction or a missing addend. The worst mistake is adding
    // the two numbers; the subtler one is putting the whole in the wrong place.
    const pool: [string, ErrorTag][] = [
      [`${b} + ${s} = ?`, 'added-story-numbers'],
      [`${s} + ${b} = ?`, 'added-story-numbers'],
      [`${b} + ? = ${s}`, 'reversed'], // the whole written where the part goes
      [`? − ${s} = ${b}`, 'reversed'],
    ];
    // Keep one sentence with a minus among the wrong ones whenever the right one
    // has a minus, so "the only one with a minus" never gives it away.
    const needsMinus = correct.includes('−');
    const [first, ...rest] = pool;
    const picked = [first, ...shuffle(rest).slice(0, 2)];
    if (needsMinus && !picked.some(([f]) => f.includes('−'))) picked[2] = pool[3];
    return picked;
  }
  // Correct is an addition: every wrong one treats the bigger number as the
  // whole and goes looking for a part, which is subtracting.
  return shuffle<[string, ErrorTag]>([
    [`${b} − ${s} = ?`, 'wrong-operation'],
    [`${s} + ? = ${b}`, 'wrong-operation'],
    [`${b} − ? = ${s}`, 'wrong-operation'],
    [`? + ${s} = ${b}`, 'wrong-operation'],
  ]).slice(0, 3);
}

function equationQuestion(kind: Kind, x: number, y: number, v: number, addOnly: boolean): Question {
  const s = BUILDERS[kind](x, y, v);
  // "Which adding problem shows…" is how the unit test words the missing-addend
  // idea; only offered for stories whose answer is a subtraction.
  const asksForAdding = addOnly && s.op === 'sub';
  const correct = asksForAdding ? `${s.small} + ? = ${s.big}` : s.natural;

  let wrong = wrongForms(s, correct);
  if (asksForAdding) {
    // Every option must be an adding sentence, or the question answers itself.
    wrong = shuffle<[string, ErrorTag]>([
      [`${s.big} + ${s.small} = ?`, 'added-story-numbers'],
      [`${s.small} + ${s.big} = ?`, 'added-story-numbers'],
      [`${s.big} + ? = ${s.small}`, 'reversed'],
    ]);
  }

  const distractorMeaning: Record<string, ErrorTag> = {};
  for (const [f, tag] of wrong) distractorMeaning[f] = tag;

  // One question, not the story's own question followed by a second one —
  // the way the unit test words it: "Which addition problem shows how many
  // eggs he still needs?"
  const question = asksForAdding
    ? `Which adding problem shows ${s.clause}?`
    : `Which number sentence shows ${s.clause}?`;

  return {
    id: `${s.id}${asksForAdding ? '-eqa' : '-eq'}`,
    type: 'word_problem',
    prompt: `${s.story}\n${question}`,
    promptEmoji: s.emoji,
    correctAnswer: correct,
    choices: shuffle([correct, ...wrong.map(([f]) => f)]),
    distractorMeaning,
    difficulty: 4,
    hint: s.op === 'sub'
      ? `Do you need to put the two numbers together, or find the missing part? The whole is ${s.big}.`
      : `Are the two groups being put together? Then the answer is the whole.`,
    speakText: `${s.story} ${question}`,
  };
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export type StoryType =
  | 'result' // join and separate, result unknown
  | 'part' // some and the rest (with a few "in all" so it can't be done blind)
  | 'compare' // how many more / how many fewer
  | 'compareQty' // n has 7 fewer than m, who has 19
  | 'change' // needs 10, has 6
  | 'equation' // which number sentence matches
  | 'mixed';

const KINDS_FOR: Record<Exclude<StoryType, 'equation' | 'mixed'>, Kind[]> = {
  result: ['join', 'sep'],
  // Three "the rest" to one "in all".
  part: ['part', 'part', 'part', 'total'],
  compare: ['diff'],
  compareQty: ['fewer', 'fewer', 'more'],
  change: ['change'],
};

const ALL_KINDS: Kind[] = ['join', 'sep', 'part', 'total', 'diff', 'fewer', 'more', 'change'];

function randomStory(kinds: Kind[]): [Kind, number, number, number] {
  const kind = kinds[randomInt(0, kinds.length - 1)];
  const [x, y] = operandsFor(kind);
  return [kind, x, y, randomInt(0, VARIANTS[kind] - 1)];
}

export function generateStoryProblem(type: StoryType): Question {
  if (type === 'equation') {
    const [kind, x, y, v] = randomStory(ALL_KINDS);
    return equationQuestion(kind, x, y, v, Math.random() < 0.3);
  }
  if (type === 'mixed') {
    const [kind, x, y, v] = randomStory(ALL_KINDS);
    // One in five asks for the number sentence instead of the number.
    return Math.random() < 0.2 ? equationQuestion(kind, x, y, v, false) : numberQuestion(kind, x, y, v);
  }
  const [kind, x, y, v] = randomStory(KINDS_FOR[type]);
  return numberQuestion(kind, x, y, v);
}

/** Rebuild from id, for spaced repetition. Returns null for anything it didn't mint. */
export function storyProblemFromId(id: string): Question | null {
  const m = id.match(/^st-([a-z]+)-(\d+)-(\d+)-(\d+)(-eqa?)?$/);
  if (!m) return null;
  const kind = m[1] as Kind;
  if (!(kind in BUILDERS)) return null;
  const v = Number(m[2]), x = Number(m[3]), y = Number(m[4]);
  if (v >= VARIANTS[kind]) return null;
  if (x < 2 || y < 2 || x > 20 || y > 20) return null;
  const isSub = !['join', 'total', 'more'].includes(kind);
  if (isSub && y >= x) return null;
  if (!isSub && x + y > 20) return null;
  if (m[5] === '-eqa' && !isSub) return null;
  return m[5] ? equationQuestion(kind, x, y, v, m[5] === '-eqa') : numberQuestion(kind, x, y, v);
}

export const STORY_ID_PATTERN = /^st-(join|sep|part|total|diff|fewer|more|change)-\d+-\d+-\d+(-eqa?)?$/;

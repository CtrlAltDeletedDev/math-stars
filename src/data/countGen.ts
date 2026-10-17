import { ErrorTag, Question } from '@/types';
import { buildTaggedChoices, Candidate, randomInt, shuffle, TaggedChoices } from '@/engine/choices';

// Counting and number order, generated rather than hand-listed, so the
// Counting ladder never runs dry. The hand-written bank in `counting.ts` has
// about 16 questions a rung, and a child at the top of her grade saw the same
// handful every day. These are what the practice ladder draws on; the bank and
// the levels built from it stay as they are.
//
// Three rungs, chosen by params:
//   { max: 10 }                 how many objects (to 10), plus easy "what comes next"
//   { max: 20 }                 how many objects (11 to 20), plus next / before / missing to 20
//   { max: 100, mode: 'order' } next / before / missing / count on, up to 100
//
// Ids, so an SRS card can be rebuilt exactly:
//   gcount-<obj>-<n>                 n of one object
//   gcount-<obj>-<n>-<other>-<m>     n of one object mixed in with m of another
//   gorder-(next|before|missing)-<answer>
//   gorder-on-<start>-<steps>

interface CountObject { key: string; emoji: string; plural: string }

// One code point each, and each glyph is ONE thing: no 🍇 (a bunch of grapes),
// 🍒 (two cherries) or 🧦 (a pair of socks), which make "how many?" a matter of
// opinion.
const OBJECTS: CountObject[] = [
  { key: 'apple', emoji: '🍎', plural: 'apples' },
  { key: 'banana', emoji: '🍌', plural: 'bananas' },
  { key: 'star', emoji: '⭐', plural: 'stars' },
  { key: 'moon', emoji: '🌙', plural: 'moons' },
  { key: 'dog', emoji: '🐶', plural: 'dogs' },
  { key: 'cat', emoji: '🐱', plural: 'cats' },
  { key: 'frog', emoji: '🐸', plural: 'frogs' },
  { key: 'ladybug', emoji: '🐞', plural: 'ladybugs' },
  { key: 'fish', emoji: '🐟', plural: 'fish' },
  { key: 'crab', emoji: '🦀', plural: 'crabs' },
  { key: 'flower', emoji: '🌸', plural: 'flowers' },
  { key: 'bee', emoji: '🐝', plural: 'bees' },
  { key: 'chick', emoji: '🐥', plural: 'chicks' },
  { key: 'turtle', emoji: '🐢', plural: 'turtles' },
  { key: 'strawberry', emoji: '🍓', plural: 'strawberries' },
  { key: 'lemon', emoji: '🍋', plural: 'lemons' },
  { key: 'balloon', emoji: '🎈', plural: 'balloons' },
  { key: 'ball', emoji: '⚽', plural: 'balls' },
  { key: 'car', emoji: '🚗', plural: 'cars' },
  { key: 'rocket', emoji: '🚀', plural: 'rockets' },
  { key: 'bear', emoji: '🐻', plural: 'bears' },
  { key: 'penguin', emoji: '🐧', plural: 'penguins' },
  { key: 'butterfly', emoji: '🦋', plural: 'butterflies' },
  { key: 'owl', emoji: '🦉', plural: 'owls' },
  { key: 'fox', emoji: '🦊', plural: 'foxes' },
  { key: 'cupcake', emoji: '🧁', plural: 'cupcakes' },
  { key: 'carrot', emoji: '🥕', plural: 'carrots' },
  { key: 'duck', emoji: '🦆', plural: 'ducks' },
];

const OBJECT_BY_KEY = new Map(OBJECTS.map((o) => [o.key, o]));

// Two kinds that cannot be mistaken for each other at a glance — different
// colour and different shape — so "count only the apples" is about attention,
// not eyesight. Either one can be the kind she is asked about.
const PAIRS: readonly [string, string][] = [
  ['apple', 'banana'], ['star', 'moon'], ['frog', 'ladybug'], ['fish', 'crab'],
  ['flower', 'bee'], ['chick', 'turtle'], ['strawberry', 'lemon'], ['balloon', 'ball'],
  ['car', 'rocket'], ['bear', 'penguin'], ['butterfly', 'flower'], ['owl', 'fox'],
  ['cupcake', 'carrot'], ['dog', 'duck'],
];

const isPair = (a: string, b: string) => PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const pick = <T>(xs: readonly T[]): T => xs[randomInt(0, xs.length - 1)];

// ---------------------------------------------------------------------------
// Laying out the objects
// ---------------------------------------------------------------------------

const GROUP = 5;

/**
 * Groups of five with a space between them.
 *
 * The card does not keep line breaks in `promptEmoji`, so the space does the
 * work: on a phone a group of five fills a line and the groups stack into
 * rows; on a tablet two sit side by side. Either way 17 objects read as "five,
 * five, five and two" instead of one long run she loses her place in.
 */
function lineUp(items: readonly string[]): string {
  const groups: string[] = [];
  for (let i = 0; i < items.length; i += GROUP) groups.push(items.slice(i, i + GROUP).join(''));
  return groups.join(' ');
}

/** `b` of `other` spread evenly through `a` of `target` — the same picture every time for one id. */
function mixIn(target: string, a: number, other: string, b: number): string[] {
  const total = a + b;
  return Array.from({ length: total }, (_, i) =>
    Math.floor(((i + 1) * b) / total) - Math.floor((i * b) / total) === 1 ? other : target,
  );
}

// ---------------------------------------------------------------------------
// The mistakes, and the options built from them
// ---------------------------------------------------------------------------

/** 41 for 14: she writes the digit she hears first. Only where the swap is a different number. */
function swapped(n: number): number | null {
  if (n < 12 || n > 99) return null;
  const tens = Math.floor(n / 10), ones = n % 10;
  if (ones === 0 || ones === tens) return null;
  return ones * 10 + tens;
}

/**
 * Losing track of a ten — errors a first grader makes with a number she can
 * say perfectly well out loud:
 *   - 41 for 14, the swap above;
 *   - a ten short: 7 for 17 ("seven-teen" names the seven first), 37 for 47,
 *     and on a crossing, 30 after 39 — the ones rolled over, the ten did not;
 *   - a ten too many: 57 for 47 (one more and ten more mixed up), and when
 *     the numbers on screen sit just above a ten (`crossingBack`: "?, 10, 11"),
 *     19 for 9 — the ones rolled back, the ten stayed.
 * Counting objects only ever loses the teen's ten (`teensOnly`): nobody counts
 * twelve apples and answers 22. When both a ten short and a ten too many
 * apply, `honestChoices` offers only one of them.
 */
function tenSlips(n: number, { teensOnly = false, crossingBack = false } = {}): Candidate[] {
  const out: Candidate[] = [];
  const s = swapped(n);
  if (s !== null) out.push([s, 'place-value']);
  if (teensOnly ? n >= 13 && n <= 19 : n >= 13) out.push([n - 10, 'place-value']);
  const tenUp = n >= 21 || (crossingBack && n % 10 === 9);
  if (!teensOnly && tenUp && n + 10 <= 100) out.push([n + 10, 'place-value']);
  return out;
}

const valueOf = (c: Candidate) => (typeof c === 'number' ? c : c[0]);

// Options may run a little past the top of the rung — 101 is an honest slip
// after 99 — but never into numbers she has not met.
const OPTION_CEILING = 110;

/** Far enough from the answer that four options containing it cannot be four in a row. */
const FAR = 4;

/**
 * Four options when the mistakes allow it, three when they don't.
 *
 * Four options are only safe when there is an honest mistake well away from
 * the answer on BOTH sides. `buildTaggedChoices` picks at random how many
 * options sit below the answer; if it picks "all three below" and every
 * mistake below is a near miss, the options are four numbers in a row with
 * the answer on top — and for "count the 4 apples", "what comes before 10?"
 * or "how many is 20?" every honest mistake IS a near miss. Padding those out
 * to four would mean either a giveaway run or a number no child picks.
 *
 * So those get three options instead: real mistakes only, preferring the ones
 * that mean something, with the answer's rank still chosen at random.
 *
 * `offScreen` are numbers the question shows that must not be offered — see
 * `oneOnScreen`.
 */
function honestChoices(
  correct: number,
  all: readonly Candidate[],
  lo: number,
  offScreen: readonly number[] = [],
): TaggedChoices {
  const valid = (v: number) =>
    Number.isInteger(v) && v >= lo && v <= OPTION_CEILING && !offScreen.includes(v);

  // A ten short OR a ten too many, never both: 41, 51, 61 on one screen makes
  // the answer "the middle one of the three that end in 1". Keep the one that
  // gives a side with no far-off mistake one, so four options stay possible.
  let candidates = all;
  const tenOff = [correct - 10, correct + 10];
  if (tenOff.every((t) => valid(t) && all.some((c) => valueOf(c) === t))) {
    const farOn = (below: boolean) => all.some((c) => {
      const v = valueOf(c);
      return !tenOff.includes(v) && valid(v) && (below ? v <= correct - FAR : v >= correct + FAR);
    });
    const [hasBelow, hasAbove] = [farOn(true), farOn(false)];
    const drop = hasBelow === hasAbove ? pick(tenOff) : hasBelow ? tenOff[0] : tenOff[1];
    candidates = all.filter((c) => valueOf(c) !== drop);
  }

  // First meaning wins, as in buildTaggedChoices.
  const meaning = new Map<number, ErrorTag>();
  for (const c of candidates) {
    const [v, tag] = typeof c === 'number' ? [c, 'unknown' as const] : c;
    if (v !== correct && valid(v) && !meaning.has(v)) meaning.set(v, tag);
  }
  const values = [...meaning.keys()];
  const farBelow = values.some((v) => v <= correct - FAR);
  const farAbove = values.some((v) => v >= correct + FAR);
  if (farBelow && farAbove) {
    // buildTaggedChoices can only put all three wrong options below the answer
    // if three exist there. Where hiding the numbers on screen leaves fewer,
    // top up with near misses further out — otherwise the answer is almost
    // never the biggest option.
    const extra: Candidate[] = [];
    for (const below of [true, false]) {
      const near = [1, 2, 3].map((d) => (below ? correct - d : correct + d));
      const onSide = new Set([...values, ...near].filter((v) => valid(v) && (below ? v < correct : v > correct)));
      for (let d = FAR; onSide.size < 3 && d < 20; d++) {
        const v = below ? correct - d : correct + d;
        if (valid(v) && !onSide.has(v)) { onSide.add(v); extra.push(v); }
      }
    }
    return buildTaggedChoices(correct, [...candidates, ...extra], { isValid: valid });
  }

  const side = (below: boolean): [number, ErrorTag][] => {
    const mine = [...meaning.entries()].filter(([v]) => (below ? v < correct : v > correct));
    const near = (a: [number, ErrorTag], b: [number, ErrorTag]) => Math.abs(a[0] - correct) - Math.abs(b[0] - correct);
    // The mistakes that mean something first, then real slips no tag names
    // (counting the other kind), and only then a near miss with no story.
    const topUp = [1, 2, 3, 4, 5].map((d) => (below ? correct - d : correct + d))
      .filter((v) => valid(v) && !meaning.has(v))
      .slice(0, 2)
      .map((v): [number, ErrorTag] => [v, 'unknown']);
    return [
      ...shuffle(mine.filter(([, t]) => t !== 'unknown')),
      ...mine.filter(([, t]) => t === 'unknown').sort(near),
      ...topUp,
    ];
  };
  const lower = side(true), upper = side(false);
  const splits = [0, 1, 2].filter((k) => k <= lower.length && 2 - k <= upper.length);
  const k = pick(splits);
  const wrong = [...lower.slice(0, k), ...upper.slice(0, 2 - k)];
  return {
    choices: shuffle([correct, ...wrong.map(([v]) => v)]).map(String),
    distractorMeaning: Object.fromEntries(wrong.map(([v, tag]) => [String(v), tag])),
  };
}

const rangeDifficulty = (top: number) => (top <= 10 ? 1 : top <= 20 ? 2 : 3);

// ---------------------------------------------------------------------------
// How many?
// ---------------------------------------------------------------------------

const COUNT_MIN = 3;
const COUNT_MAX = 20;

function countQuestion(obj: CountObject, n: number): Question {
  return {
    id: `gcount-${obj.key}-${n}`,
    type: 'counting',
    prompt: `How many ${obj.emoji} are there?`,
    promptEmoji: lineUp(Array(n).fill(obj.emoji)),
    correctAnswer: String(n),
    ...honestChoices(n, [
      [n - 1, 'off-by-one'], // missed one
      [n + 1, 'off-by-one'], // counted one twice
      ...tenSlips(n, { teensOnly: true }),
    ], 1),
    difficulty: rangeDifficulty(n),
    hint: n <= GROUP
      ? 'Touch each one as you count it.'
      : 'The first group has five. Count on from there, touching each one.',
    speakText: `How many ${obj.plural} are there?`,
  };
}

/**
 * Two kinds mixed together; count only one. Sorting and counting by kind is a
 * kindergarten standard, and it is the one counting question that can tell us
 * something a plain count cannot: counting everything she sees is "gave the
 * whole when asked for a part".
 */
function countOneKindQuestion(obj: CountObject, a: number, other: CountObject, b: number): Question {
  const total = a + b;
  return {
    id: `gcount-${obj.key}-${a}-${other.key}-${b}`,
    type: 'counting',
    prompt: `How many ${obj.emoji} are there?`,
    promptEmoji: lineUp(mixIn(obj.emoji, a, other.emoji, b)),
    correctAnswer: String(a),
    ...honestChoices(a, [
      [a - 1, 'off-by-one'],
      [a + 1, 'off-by-one'],
      [total, 'answered-the-whole'], // counted every object
      b, // counted the other kind: a real slip, but no tag says it
      ...tenSlips(a, { teensOnly: true }),
    ], 1),
    difficulty: rangeDifficulty(total),
    hint: `Only count the ${obj.emoji}. Touch each one as you go.`,
    speakText: `Count only the ${obj.plural}. How many ${obj.plural} are there?`,
  };
}

/**
 * The (a, b) a rung asks for. At least three of each so the other kind is
 * really there, and never the same number of each, so counting the wrong kind
 * cannot land on the right answer by luck.
 */
function oneKindInRange(a: number, b: number): boolean {
  if (a === b || b < 3) return false;
  const total = a + b;
  if (total <= 10) return a >= 3; // counting to 10: a handful of each
  return a >= 5 && b <= 6 && total <= 20; // counting to 20: a lot of one, a few of the other
}

function randomOneKind(maxTotal: number): Question {
  const [x, y] = pick(PAIRS);
  const [target, other] = Math.random() < 0.5 ? [x, y] : [y, x];
  let a: number, b: number;
  do {
    if (maxTotal <= 10) {
      a = randomInt(3, 7);
      b = randomInt(3, 10 - a);
    } else {
      b = randomInt(3, 6);
      a = randomInt(11, 20) - b;
    }
  } while (!oneKindInRange(a, b));
  return countOneKindQuestion(OBJECT_BY_KEY.get(target)!, a, OBJECT_BY_KEY.get(other)!, b);
}

// ---------------------------------------------------------------------------
// Number order
// ---------------------------------------------------------------------------

type OrderShape = 'next' | 'before' | 'missing';

/** What each shape shows around its answer. */
function shown(shape: OrderShape, ans: number): number[] {
  if (shape === 'next') return [ans - 3, ans - 2, ans - 1];
  if (shape === 'before') return [ans + 1, ans + 2];
  return [ans - 1, ans + 1];
}

/**
 * Offer ONE of the numbers on screen, and hide the rest.
 *
 * Answering with a number she can already see is worth catching. But offer
 * every number on screen and the answer becomes "the one that isn't up
 * there" — and on "5, ?, 7" also the one sandwiched between the other two. One
 * is enough to catch the slip. `usual` is the one most worth offering (the
 * last number, which she repeats), chosen `share` of the time.
 */
function oneOnScreen(nums: readonly number[], usual?: number, share = 0.7) {
  const offered = usual !== undefined && Math.random() < share ? usual : pick(nums);
  return {
    offer: [[offered, 'answered-a-given-number']] as Candidate[],
    hide: nums.filter((n) => n !== offered),
  };
}

function orderQuestion(shape: OrderShape, ans: number): Question {
  const nums = shown(shape, ans);
  const base = {
    id: `gorder-${shape}-${ans}`,
    type: 'number_order' as const,
    correctAnswer: String(ans),
    difficulty: rangeDifficulty(Math.max(ans, ...nums)),
  };

  if (shape === 'next') {
    const last = nums[2];
    // The last number half the time, not always: offered together with "skipped
    // one" every time, the answer would always sit in the middle of three.
    const seen = oneOnScreen(nums, last, 0.5);
    return {
      ...base,
      prompt: 'What number comes next?',
      promptEmoji: `${nums.join(', ')}, ?`,
      ...honestChoices(ans, [
        ...seen.offer, // repeated the last number, often
        [ans + 1, 'off-by-one'], // skipped one
        [nums[0] - 1, 'unknown'], // went the wrong way: what comes before the first
        ...tenSlips(ans),
      ], 0, seen.hide),
      hint: last % 10 === 9
        ? `After 9 ones comes a new ten. What do you say after ${last}?`
        : `Say the numbers out loud. What do you say after ${last}?`,
      speakText: `What number comes next? ${nums.join(', ')}, and then?`,
    };
  }

  if (shape === 'before') {
    const [first, second] = nums;
    const seen = oneOnScreen(nums);
    return {
      ...base,
      prompt: 'What number comes before?',
      promptEmoji: `?, ${first}, ${second}`,
      ...honestChoices(ans, [
        ...seen.offer,
        [ans - 1, 'off-by-one'], // counted back one too far
        [second + 1, 'unknown'], // kept counting forward: gave what comes after
        ...tenSlips(ans, { crossingBack: true }),
      ], 0, seen.hide),
      hint: `Count backwards: ${second}, ${first}, then what?`,
      speakText: `What number comes just before ${first}?`,
    };
  }

  const [lo, hi] = nums;
  const seen = oneOnScreen(nums);
  return {
    ...base,
    prompt: 'What number is missing?',
    promptEmoji: `${lo}, ?, ${hi}`,
    ...honestChoices(ans, [
      ...seen.offer,
      ...tenSlips(ans, { crossingBack: true }),
    ], 0, seen.hide),
    hint: `Start at ${lo} and count. What do you say next?`,
    speakText: `What number goes between ${lo} and ${hi}?`,
  };
}

const COUNT_ON_STEPS = [2, 3, 4];
const COUNT_ON_MIN_START = 20;

function countOnQuestion(start: number, steps: number): Question {
  const ans = start + steps;
  const seen = oneOnScreen([start, steps], start, 0.75); // not counting on at all, usually
  return {
    id: `gorder-on-${start}-${steps}`,
    type: 'number_order',
    prompt: `Start at ${start} and count on ${steps}.\nWhere do you land?`,
    correctAnswer: String(ans),
    ...honestChoices(ans, [
      [ans - 1, 'off-by-one'], // counted the starting number as one — the classic
      [ans + 1, 'off-by-one'],
      ...seen.offer,
      [start - steps, 'wrong-operation'], // counted back instead of on
      ...tenSlips(ans),
    ], 0, seen.hide),
    difficulty: rangeDifficulty(ans),
    hint: `Say ${start}, then count ${steps} more on your fingers.`,
    speakText: `Start at ${start} and count on ${steps} more. What number do you land on?`,
  };
}

// The answers each shape may have: the union of every rung, which is also
// exactly what `countFromId` accepts.
const ORDER_RANGE: Record<OrderShape, [number, number]> = {
  next: [4, 100], // 1, 2, 3 → 4, up to 97, 98, 99 → 100
  before: [9, 98], // ?, 10, 11 up to ?, 99, 100
  missing: [10, 99], // 9, ?, 11 up to 98, ?, 100
};

/** Uniform in [lo, hi], but `bias` of the time one ending in `endings`: the crossings are where she slips. */
function biased(lo: number, hi: number, endings: readonly number[], bias = 0.4): number {
  const special = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((n) => endings.includes(n % 10));
  return special.length && Math.random() < bias ? pick(special) : randomInt(lo, hi);
}

/** Number order within 20, alongside counting objects on the "to 20" rung. */
function orderToTwenty(): Question {
  const r = Math.random();
  if (r < 0.45) return orderQuestion('next', randomInt(11, 20));
  if (r < 0.75) return orderQuestion('before', randomInt(9, 18));
  return orderQuestion('missing', randomInt(10, 19));
}

/** Number order past 20, up to `top`. */
function orderPastTwenty(top: number): Question {
  const r = Math.random();
  if (r < 0.3) return orderQuestion('next', biased(21, top, [0]));
  if (r < 0.55) return orderQuestion('before', biased(19, top - 2, [9]));
  const fits = COUNT_ON_STEPS.filter((s) => COUNT_ON_MIN_START + s <= top);
  if (r < 0.8 || !fits.length) return orderQuestion('missing', biased(20, top - 1, [0, 9]));
  const steps = pick(fits);
  // Half of them cross a ten: start at 47 and count on 4.
  const starts = Array.from({ length: top - steps - COUNT_ON_MIN_START + 1 }, (_, i) => COUNT_ON_MIN_START + i);
  const crossing = starts.filter((s) => (s % 10) + steps >= 10);
  return countOnQuestion(crossing.length && Math.random() < 0.5 ? pick(crossing) : pick(starts), steps);
}

// ---------------------------------------------------------------------------
// The rungs
// ---------------------------------------------------------------------------

/**
 * One question for a Counting rung.
 *
 *   { operation: 'count', max: 10 }                 how many (3–10) and what comes next
 *   { operation: 'count', max: 20 }                 how many (11–20) and next / before / missing to 20
 *   { operation: 'count', max: 100, mode: 'order' } next / before / missing / count on, past 20 up to 100
 *
 * Each rung asks about the numbers the rung below it does not — the smaller
 * ones live there — so `difficulty` (1, 2, 3) is the rung.
 */
export function generateCountQuestion(params: Record<string, number | string>): Question {
  const max = Number(params.max) || 10;

  if (params.mode === 'order') {
    return max <= 20 ? orderToTwenty() : orderPastTwenty(Math.min(100, Math.floor(max)));
  }

  const r = Math.random();
  if (max <= 10) {
    if (r < 0.5) return countQuestion(pick(OBJECTS), randomInt(COUNT_MIN, 10));
    if (r < 0.7) return randomOneKind(10);
    return orderQuestion('next', randomInt(4, 10));
  }
  if (r < 0.45) return countQuestion(pick(OBJECTS), randomInt(11, COUNT_MAX));
  if (r < 0.65) return randomOneKind(20);
  return orderToTwenty();
}

/** Exactly the ids this file emits and `countFromId` accepts (ranges are checked there). */
export const COUNT_ID_PATTERN =
  /^(?:gcount-[a-z]+-[1-9]\d*(?:-[a-z]+-[1-9]\d*)?|gorder-(?:next|before|missing)-[1-9]\d*|gorder-on-[1-9]\d*-[1-9]\d*)$/;

/**
 * Rebuild a counting or number-order question from its SRS card id: the same
 * prompt, picture, answer and difficulty. The options are drawn fresh, which
 * is the point of a review.
 *
 * Null for anything no rung could have asked — an object not on the list, two
 * kinds that are not a pair, a number out of range — rather than inventing a
 * question the card never stood for.
 */
export function countFromId(id: string): Question | null {
  if (!COUNT_ID_PATTERN.test(id)) return null;
  const q = rebuild(id);
  // Only the canonical spelling: an id that rebuilt to a different id would
  // make two SRS cards for one question.
  return q && q.id === id ? q : null;
}

function rebuild(id: string): Question | null {
  let m = id.match(/^gcount-([a-z]+)-(\d+)$/);
  if (m) {
    const obj = OBJECT_BY_KEY.get(m[1]);
    const n = +m[2];
    return obj && n >= COUNT_MIN && n <= COUNT_MAX ? countQuestion(obj, n) : null;
  }
  m = id.match(/^gcount-([a-z]+)-(\d+)-([a-z]+)-(\d+)$/);
  if (m) {
    const obj = OBJECT_BY_KEY.get(m[1]), other = OBJECT_BY_KEY.get(m[3]);
    const a = +m[2], b = +m[4];
    if (!obj || !other || !isPair(obj.key, other.key) || !oneKindInRange(a, b)) return null;
    return countOneKindQuestion(obj, a, other, b);
  }
  m = id.match(/^gorder-(next|before|missing)-(\d+)$/);
  if (m) {
    const shape = m[1] as OrderShape;
    const ans = +m[2];
    const [lo, hi] = ORDER_RANGE[shape];
    return ans >= lo && ans <= hi ? orderQuestion(shape, ans) : null;
  }
  m = id.match(/^gorder-on-(\d+)-(\d+)$/);
  if (m) {
    const start = +m[1], steps = +m[2];
    if (!COUNT_ON_STEPS.includes(steps) || start < COUNT_ON_MIN_START || start + steps > 100) return null;
    return countOnQuestion(start, steps);
  }
  return null;
}

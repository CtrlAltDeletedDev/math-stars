import { Question } from '@/types';
import { buildTaggedChoices, Candidate, randomInt, shuffle } from '@/engine/choices';

// Even and odd, generated rather than hand-listed, so a child at the top of her
// grade is not shown the same sixteen questions forever. The hand-written bank
// in evenOdd.ts and the levels that use it stay exactly as they are; these are
// what the practice ladder draws on.
//
// Three shapes, all of which the bank already asks:
//
//   - "Is 7 even or odd?" with the number written as keycaps, like the bank.
//   - The same question over a picture of that many things already standing in
//     pairs. This is where "even" stops being a word to memorise and becomes
//     "everyone has a partner": she looks at the end of the row, not the count.
//     Pictures stop at 10 — twenty emoji in pairs is four lines on a phone, and
//     past ten the skill is reading the last digit, not looking.
//   - "Which number is even?" with exactly one number of the asked kind: three
//     numbers to choose from on the first rung, four on the second (see
//     `wrongCount` for why not four on both).
//
// The binary question offers two options and only two: padding it with
// 'Neither' and 'Both' turns it into a coin flip with decoration (see the note
// at the top of evenOdd.ts).
//
// No distractor here carries a tag. Picking 7 for "which is even?" is not
// counting one too far, and picking 14 for "which is odd?" is not losing a ten;
// the honest reading of every wrong answer in this topic is "does not yet know
// which numbers are even", which is what 'unknown' is for. They are still the
// mistakes worth offering — the numbers either side of the answer, odd numbers
// that look big, and teen numbers whose 1 makes them look odd.

type Want = 'even' | 'odd';
type Range = 10 | 20;

interface Thing { key: string; emoji: string; one: string; many: string }

// Single-code-point emoji only, so every one of them is one object on screen
// and one character to count in a test. Shoes first: they come in pairs in
// real life, which is the whole idea. Not socks: 🧦 is drawn as a pair, so
// three of them on screen is six socks.
const THINGS: readonly Thing[] = [
  { key: 'shoe', emoji: '👟', one: 'shoe', many: 'shoes' },
  { key: 'apple', emoji: '🍎', one: 'apple', many: 'apples' },
  { key: 'duck', emoji: '🦆', one: 'duck', many: 'ducks' },
  { key: 'fish', emoji: '🐟', one: 'fish', many: 'fish' },
  { key: 'cookie', emoji: '🍪', one: 'cookie', many: 'cookies' },
  { key: 'strawberry', emoji: '🍓', one: 'strawberry', many: 'strawberries' },
  { key: 'frog', emoji: '🐸', one: 'frog', many: 'frogs' },
  { key: 'balloon', emoji: '🎈', one: 'balloon', many: 'balloons' },
  { key: 'ladybug', emoji: '🐞', one: 'ladybug', many: 'ladybugs' },
  { key: 'cupcake', emoji: '🧁', one: 'cupcake', many: 'cupcakes' },
  { key: 'penguin', emoji: '🐧', one: 'penguin', many: 'penguins' },
];

/**
 * Between two pairs. An en space rather than a plain one: the prompt emoji is
 * set with `letter-spacing: 4px`, so a plain space between pairs is barely wider
 * than the gap inside one, and the pairs stop reading as pairs. It is still a
 * break opportunity, so a long row wraps between pairs, never through one.
 */
export const PAIR_GAP = String.fromCharCode(0x2002); // EN SPACE

const EVEN = 'Even';
const ODD = 'Odd';

const isEven = (n: number) => n % 2 === 0;

/** What turns a digit into its keycap emoji: VARIATION SELECTOR-16, COMBINING ENCLOSING KEYCAP. */
const KEYCAP = String.fromCharCode(0xfe0f, 0x20e3);

/** 7 → 7️⃣, 10 → 🔟, 14 → 1️⃣4️⃣ — the bank's own way of writing a number. */
function keycap(n: number): string {
  if (n === 10) return '🔟';
  return [...String(n)].map((d) => d + KEYCAP).join('');
}

/** "🧦🧦 🧦🧦 🧦" — the pairs made for her, so the question is the lonely one at the end. */
function inPairs(emoji: string, n: number): string {
  const groups: string[] = [];
  for (let left = n; left > 0; left -= 2) groups.push(emoji.repeat(Math.min(2, left)));
  return groups.join(PAIR_GAP);
}

// Hints say how to look and never which word is right, so none of them uses
// the words "even" or "odd" at all.
function pairsHint(n: number): string {
  if (n <= 10) return `Put ${n} things in pairs. Does every one get a partner?`;
  if (n === 20) return '20 is two tens. Put 10 things in pairs. Does every one get a partner?';
  const ones = n % 10;
  return `Only the last digit matters: ${ones}. Put ${ones} things in pairs. Does every one get a partner?`;
}

function isItEven(n: number): Question {
  const correct = isEven(n) ? EVEN : ODD;
  const wrong = isEven(n) ? ODD : EVEN;
  return {
    id: `geo-is-${n}`,
    type: 'even_odd',
    prompt: `Is ${n} even or odd?`,
    promptEmoji: keycap(n),
    correctAnswer: correct,
    choices: shuffle([EVEN, ODD]),
    distractorMeaning: { [wrong]: 'unknown' },
    difficulty: n <= 10 ? 1 : 2,
    hint: pairsHint(n),
    speakText: `Is ${n} even or odd?`,
  };
}

function pairsPicture(n: number, thing: Thing): Question {
  const correct = isEven(n) ? EVEN : ODD;
  const wrong = isEven(n) ? ODD : EVEN;
  const noun = n === 1 ? thing.one : thing.many;
  return {
    id: `geo-pairs-${n}-${thing.key}`,
    type: 'even_odd',
    prompt: `Is ${n} even or odd?`,
    promptEmoji: inPairs(thing.emoji, n),
    correctAnswer: correct,
    choices: shuffle([EVEN, ODD]),
    distractorMeaning: { [wrong]: 'unknown' },
    difficulty: 1,
    hint: `Look at the pairs. Does every ${thing.one} have a partner?`,
    speakText: n === 1
      ? `Here is 1 ${noun}. Is 1 even or odd?`
      : `Here are ${n} ${noun}, in pairs. Is ${n} even or odd?`,
  };
}

/**
 * The lowest number "which is odd?" may offer. Zero is even, and "zero is
 * nothing, so it can't be even" is a real first-grade belief, so it is a fair
 * wrong option once she is working to 20. To 10 it stays out, as in the bank.
 */
const floorOf = (range: Range) => (range === 20 ? 0 : 1);

/**
 * Wrong answers worth offering ahead of the rest. "Look big" means odd numbers
 * near the top of the range for "which is even?", and for "which is odd?" the
 * teens and tens whose leading 1 makes them look odd.
 */
function tempting(want: Want, range: Range): number[] {
  if (want === 'even') return range === 20 ? [15, 17, 19] : [7, 9];
  return range === 20 ? [10, 12, 14, 16, 18] : [10];
}

/** Which neighbour of the answer may be offered: neither, the one below, or the one above. */
type Neighbour = 0 | -1 | 1;

/**
 * The wrong numbers a question may draw on.
 *
 * The numbers either side of the answer are the commonest wrong pick, but
 * never both at once. With every wrong option one kind and the answer the other,
 * any run of three in a row is centred on the answer — "pick the middle of the run"
 * would score perfectly without knowing a thing. And only a third of the time,
 * because any two options that touch always include the answer, and "pick one
 * of the two touching numbers" should not halve the field on most questions.
 */
function wrongPool(want: Want, range: Range, n: number, neighbour: Neighbour): number[] {
  const out: number[] = [];
  for (let v = floorOf(range); v <= range; v++) {
    if (isEven(v) === (want === 'even')) continue;
    if (Math.abs(v - n) === 1 && v - n !== neighbour) continue;
    out.push(v);
  }
  return out;
}

const randomNeighbour = (): Neighbour => (Math.random() < 1 / 3 ? (Math.random() < 0.5 ? -1 : 1) : 0);

/**
 * How many wrong options "which is even?" offers: two to 10, three to 20.
 *
 * Every wrong option is the same kind, so two of them can be two apart and the
 * answer never can. 3, 5 and 7 beside 4 is a run of counting in twos with one
 * number left out, and "pick the one that doesn't fit" answers "which is even?"
 * and "which is odd?" alike without reading either word. To 20 there are ten
 * numbers of each kind and three wrong options can usually be spread out (see
 * `SPREAD_SHARE`). To 10 there are five, and any three of 1, 3, 5, 7, 9 but
 * 1, 5, 9 hold a pair two apart: with four options that rule scored two in
 * three on the first rung. With three options it is close to a guess.
 */
const wrongCount = (range: Range) => (range === 20 ? 3 : 2);

/** Can `n` sit at sorted position `rank` with `k` wrong options from `pool`? */
function fits(n: number, rank: number, k: number, pool: readonly number[]): boolean {
  return pool.filter((v) => v < n).length >= rank && pool.filter((v) => v > n).length >= k - rank;
}

function combinations<T>(xs: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  xs.forEach((x, i) => {
    for (const rest of combinations(xs.slice(i + 1), k - 1)) out.push([x, ...rest]);
  });
  return out;
}

/** How many pairs in `xs` are exactly two apart: 3 and 5, 14 and 16. */
const twoApart = (xs: readonly number[]) =>
  combinations(xs, 2).filter(([a, b]) => Math.abs(a - b) === 2).length;

/**
 * Every way to choose the wrong options for answer `n` at sorted position
 * `rank`: `rank` of them from below, the rest from above, and the neighbour
 * always among them when it was allowed and its side has room.
 */
function wrongSets(want: Want, range: Range, n: number, rank: number, neighbour: Neighbour): number[][] {
  const k = wrongCount(range);
  const pool = wrongPool(want, range, n, neighbour);
  const side = (vs: number[], take: number) => {
    const fixed = take > 0 && neighbour !== 0 && vs.includes(n + neighbour) ? [n + neighbour] : [];
    return combinations(vs.filter((v) => !fixed.includes(v)), take - fixed.length).map((c) => [...fixed, ...c]);
  };
  const below = side(pool.filter((v) => v < n), rank);
  const above = side(pool.filter((v) => v > n), k - rank);
  return below.flatMap((lo) => above.map((hi) => [...lo, ...hi]));
}

/**
 * How often the wrong options are kept apart: no two of them two apart.
 *
 * Not always, because that is a tell of its own. Two of the same kind are an
 * even distance apart and the answer is an odd distance from each, so once the
 * wrong options never sit two apart, the two closest numbers on the buttons
 * always include the answer. "Counting in twos" is the pattern a six-year-old
 * actually spots, so it is held down most of the time and allowed the rest,
 * which leaves neither rule — "skip the twos", "pick from the closest two" —
 * far above a guess on either rung.
 */
const SPREAD_SHARE = 0.85;

/** Whether the answer can sit at `rank` with no two wrong options two apart. */
const canBeClean = (want: Want, range: Range, n: number, rank: number, neighbour: Neighbour) =>
  wrongSets(want, range, n, rank, neighbour).some((s) => twoApart(s) === 0);

/**
 * The wrong options for one question. When `spread`, no two of them are two
 * apart wherever the rank allows it (see `wrongCount` and `SPREAD_SHARE`); the
 * tempting numbers are favoured either way.
 */
function pickWrong(want: Want, range: Range, n: number, rank: number, neighbour: Neighbour, spread: boolean): number[] {
  const sets = wrongSets(want, range, n, rank, neighbour);
  const clean = sets.filter((s) => twoApart(s) === 0);
  const from = spread && clean.length > 0 ? clean : sets;
  const tempt = tempting(want, range);
  const weight = (s: number[]) => 1 + 0.6 * s.filter((v) => tempt.includes(v)).length;
  let r = Math.random() * from.reduce((sum, s) => sum + weight(s), 0);
  for (const s of from) {
    r -= weight(s);
    if (r < 0) return s;
  }
  return from[from.length - 1];
}

/**
 * Where the answer sits once the options are sorted is chosen first, and
 * uniformly, then the answer and the wrong options are fitted to it.
 *
 * Leaving it to the spread of the numbers does not work here. To 10, "which is
 * even?" has answers 2–10 and wrong options 1–9, so the answer is the biggest
 * option far more often than not — 10 always is — and the mirror image holds
 * for "which is odd?". On the second rung the answers are mostly teens and the
 * wrong options span 0–20, which pushes the answer to the top again.
 */
function whichIs(want: Want, range: Range, n: number, rank: number, neighbour: Neighbour, spread: boolean): Question {
  const wantEven = want === 'even';
  const wrong = pickWrong(want, range, n, rank, neighbour, spread);

  // Exactly these: buildTaggedChoices then only shuffles them and writes down
  // what each one means, which is nothing more specific than 'unknown'.
  const candidates: Candidate[] = wrong.map((v) => [v, 'unknown'] as const);
  const { choices, distractorMeaning } = buildTaggedChoices(n, candidates, {
    step: 1,
    isValid: (v) => wrong.includes(v),
  });

  const spoken = [...choices].sort((a, b) => Number(a) - Number(b));
  const look = range === 20
    ? 'Only the last digit matters. Picture that many in pairs: '
    : 'Picture each number as things in pairs: ';
  return {
    id: `geo-which-${want}-${range}-${n}`,
    type: 'even_odd',
    prompt: `Which number is ${want}?`,
    promptEmoji: wantEven ? '🟢' : '🔴',
    correctAnswer: String(n),
    choices,
    distractorMeaning,
    difficulty: range === 20 ? 2 : 1,
    hint: `${look}${wantEven ? 'which one has a partner for everyone?' : 'which one has one left over?'}`,
    speakText: `Which number is ${want}: ${spoken.slice(0, -1).join(', ')}, or ${spoken[spoken.length - 1]}?`,
  };
}

const pick = <T>(xs: readonly T[]): T => xs[randomInt(0, xs.length - 1)];

/** On the second rung, how often the number is a teen; 1–10 is review there, not the work. */
const TEEN_SHARE = 0.7;

function pickNumber(range: Range): number {
  return range === 20 && Math.random() < TEEN_SHARE ? randomInt(11, 20) : randomInt(1, 10);
}

/**
 * A "which is even?" answer that can sit at `rank`, teens preferred on the
 * second rung, and answers that can be offered without two wrong options two
 * apart preferred over those that cannot.
 */
function pickWhich(want: Want, range: Range): Question {
  const k = wrongCount(range);
  const spread = Math.random() < SPREAD_SHARE;
  for (;;) {
    const rank = randomInt(0, k);
    const neighbour = randomNeighbour();
    const fitting = span(1, range, (n) => isEven(n) === (want === 'even'))
      .filter((n) => fits(n, rank, k, wrongPool(want, range, n, neighbour)));
    if (fitting.length === 0) continue; // this rank and neighbour cannot be built; draw again
    const clean = spread ? fitting.filter((n) => canBeClean(want, range, n, rank, neighbour)) : [];
    const answers = clean.length > 0 ? clean : fitting;
    const teens = answers.filter((n) => n > 10);
    const n = range === 20 && teens.length > 0 && Math.random() < TEEN_SHARE ? pick(teens) : pick(answers);
    return whichIs(want, range, n, rank, neighbour, spread);
  }
}

/** Rebuilding knows the answer but not where it sat, so it picks a rank that fits. */
function rebuildWhich(want: Want, range: Range, n: number): Question {
  // Every pool has at least three numbers, so some rank always fits.
  const k = wrongCount(range);
  const neighbour = randomNeighbour();
  const pool = wrongPool(want, range, n, neighbour);
  const spread = Math.random() < SPREAD_SHARE;
  const ranks = span(0, k, (r) => fits(n, r, k, pool));
  const clean = spread ? ranks.filter((r) => canBeClean(want, range, n, r, neighbour)) : [];
  return whichIs(want, range, n, pick(clean.length > 0 ? clean : ranks), neighbour, spread);
}

/**
 * One even-and-odd question.
 *
 * Params: `{ operation: 'even_odd', max: 10 }` (rung 0, numbers 1–10) or
 * `{ operation: 'even_odd', max: 20 }` (rung 1, mostly 11–20 with some 1–10
 * review). Any `max` of 20 or more is treated as 20, anything less as 10.
 */
export function generateEvenOddQuestion(params: Record<string, number | string>): Question {
  const range: Range = Number(params.max) >= 20 ? 20 : 10;
  if (Math.random() < 0.45) return pickWhich(Math.random() < 0.5 ? 'even' : 'odd', range);
  const n = pickNumber(range);
  if (n <= 10 && Math.random() < 0.5) return pairsPicture(n, THINGS[randomInt(0, THINGS.length - 1)]);
  return isItEven(n);
}

// --- Rebuilding from an id ----------------------------------------------

const alt = (xs: readonly (string | number)[]) => `(?:${xs.join('|')})`;
const span = (lo: number, hi: number, keep: (n: number) => boolean = () => true) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(keep);

/**
 * Every id this file emits, and nothing else: numbers are written without
 * leading zeros, the picture stops at 10, and "which is even?" only ever names
 * an even answer within its own range.
 */
export const EVEN_ODD_ID_PATTERN = new RegExp(
  '^geo-' + alt([
    `is-${alt(span(1, 20))}`,
    `pairs-${alt(span(1, 10))}-${alt(THINGS.map((t) => t.key))}`,
    `which-even-10-${alt(span(1, 10, isEven))}`,
    `which-even-20-${alt(span(1, 20, isEven))}`,
    `which-odd-10-${alt(span(1, 10, (n) => !isEven(n)))}`,
    `which-odd-20-${alt(span(1, 20, (n) => !isEven(n)))}`,
  ]) + '$',
);

/**
 * Rebuild an even-and-odd question from its SRS card id: the same prompt,
 * answer and picture. "Which number is even?" gets fresh wrong options, which
 * is fine — the id names the question, not the distractors.
 */
export function evenOddFromId(id: string): Question | null {
  if (!EVEN_ODD_ID_PATTERN.test(id)) return null;
  let m = id.match(/^geo-is-(\d+)$/);
  if (m) return isItEven(+m[1]);
  m = id.match(/^geo-pairs-(\d+)-([a-z]+)$/);
  if (m) {
    const thing = THINGS.find((t) => t.key === m![2]);
    return thing ? pairsPicture(+m[1], thing) : null;
  }
  m = id.match(/^geo-which-(even|odd)-(10|20)-(\d+)$/);
  if (m) return rebuildWhich(m[1] as Want, +m[2] as Range, +m[3]);
  return null;
}

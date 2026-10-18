import { ErrorTag, Question } from '@/types';
import { buildTaggedChoices, Candidate, randomInt, shuffle } from '@/engine/choices';

// Number bonds, generated rather than hand-listed, so the ladder can deal an
// unlimited supply. The hand-written bank in numberBonds.ts and the levels that
// use it stay exactly as they are; these are what the practice ladder draws on.
//
// Three shapes:
//
//   - "3 + ? = 10"           the bank's own shape
//   - "? + 3 = 10"           the same bond with the gap first
//   - "Which two numbers make 10?" with four sums to choose from, exactly one
//                            of which makes the whole
//
// This is not Number Tricks' make-ten generator (`mk10-*` in
// questionGenerator.ts), and must not become it: that one is a strategy step
// inside Number Tricks and is written as a missing number; these are number
// bonds, type 'number_bond', and answer to the Number Bonds ladder. Nothing here
// calls it or shares its ids.

/** The wholes a bond is made to. Nothing else is accepted from params or ids. */
const WHOLES = [5, 10, 20] as const;
type Whole = (typeof WHOLES)[number];

/**
 * How often each whole comes up when a rung offers it. "Bonds to 5 and 10" is
 * mostly 10, and "Bonds to 20" is mostly 20, with 5 and 10 kept as review.
 */
const WEIGHT: Record<Whole, number> = { 5: 2, 10: 3, 20: 10 };

/** The bank's own pictures: a hand of five, a ten, a twenty. */
const EMOJI: Record<Whole, string> = { 5: '🖐️', 10: '🔟', 20: '2️⃣0️⃣' };

const isWhole = (n: number): n is Whole => (WHOLES as readonly number[]).includes(n);

const pick = <T>(xs: readonly T[]): T => xs[randomInt(0, xs.length - 1)];

// --- "3 + ? = 10" and "? + 3 = 10" ------------------------------------------

type Gap = 'second' | 'first';

/** The mistakes worth offering, in the order a value's meaning is settled when two coincide. */
function mistakes(whole: Whole, part: number): [number, ErrorTag][] {
  const correct = whole - part;
  const out: [number, ErrorTag][] = [
    [whole, 'answered-the-whole'],
    [part, 'answered-a-given-number'],
    [part + whole, 'wrong-operation'], // added the two numbers she can see
  ];
  // Bonds to 20 are bonds to 10 with a ten on: "3 + ? = 20" answered 7 is a
  // bond to 10 with the ten dropped, and "13 + ? = 20" answered 17 kept the ten
  // from 13. Only ever across the ten and within 20: 26 for 16 is not a slip
  // anyone makes, and neither is 0 for 10 or 10 for 0, which are not a ten
  // dropped from a number but the number gone.
  if (whole === 20 && correct > 0 && correct < 20 && correct !== 10) {
    out.push([correct > 10 ? correct - 10 : correct + 10, 'place-value']);
  }
  out.push([correct - 1, 'off-by-one'], [correct + 1, 'off-by-one']);

  const seen = new Set<number>([correct]);
  return out.filter(([v]) => {
    if (v < 0 || seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

/**
 * Three wrong options with exactly `rank` of them below the answer, or null if
 * that cannot be done without four options in a row.
 *
 * Where the answer sits once the options are sorted is decided by the caller
 * (see `rankTable`), because bonds to 5 and 10 cannot balance it any other way:
 * every mistake worth offering lands between 0 and a little past the whole, so
 * left to itself the answer of "2 + ? = 5" sits second of 0–7 nearly half the
 * time, is never the biggest, and four in a row (2, 3, 4, 5) turns up a quarter
 * of the time. The real mistakes go first; a near miss with no story
 * ('unknown') is used only where a side has run out of them.
 */
function wrongAround(whole: Whole, part: number, rank: number): [number, ErrorTag][] | null {
  const correct = whole - part;
  const real = mistakes(whole, part);
  const isReal = (v: number) => real.some(([r]) => r === v);
  const top = whole + part;
  const fillers = [2, 3, 4].flatMap((d) => [correct - d, correct + d])
    .filter((v) => v >= 0 && v <= top && !isReal(v));
  const tagOf = (v: number): ErrorTag => real.find(([r]) => r === v)?.[1] ?? 'unknown';

  const side = (keep: (v: number) => boolean) => [
    ...shuffle(real.map(([v]) => v).filter(keep)),
    ...shuffle(fillers.filter(keep)),
  ];
  const below = side((v) => v < correct);
  const above = side((v) => v > correct);
  if (below.length < rank || above.length < 3 - rank) return null;

  let best: number[] | null = null;
  let bestCost = Infinity;
  for (const lo of combinations(below, rank)) {
    for (const hi of combinations(above, 3 - rank)) {
      const wrong = [...lo, ...hi];
      const nums = [...wrong, correct].sort((a, b) => a - b);
      if (nums[3] - nums[0] === 3) continue; // four in a row
      // Fewest fillers first, then not both of the numbers either side of the
      // answer: 6, 7, 8 on the buttons says "pick the middle" to a child who
      // has not added anything. Among equals, the earliest in the shuffled
      // lists, so which real mistakes appear varies from question to question.
      const sandwich = wrong.includes(correct - 1) && wrong.includes(correct + 1);
      const cost = wrong.filter((v) => !isReal(v)).length * 100 + (sandwich ? 60 : 0)
        + lo.reduce((s, v) => s + below.indexOf(v), 0) + hi.reduce((s, v) => s + above.indexOf(v), 0);
      if (cost < bestCost) { best = wrong; bestCost = cost; }
    }
  }
  return best && best.map((v) => [v, tagOf(v)]);
}

function combinations<T>(xs: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  xs.forEach((x, i) => {
    for (const rest of combinations(xs.slice(i + 1), k - 1)) out.push([x, ...rest]);
  });
  return out;
}

/**
 * A hint says how to find the missing part and never says it. Fingers to 10,
 * and to 20 the ten you already know: "13 is 10 and 3, so what goes with 3?".
 */
function missingHint(whole: Whole, part: number): string {
  const missing = whole - part;
  if (part === 0) return 'Adding 0 changes nothing.';
  if (missing === 0) return `You already have ${whole}. How many more do you need?`;
  if (whole <= 10) return `Hold up ${part} finger${part === 1 ? '' : 's'}. How many more make ${whole}?`;
  if (part === 10) return 'Count up from 10 to 20. How many did you count?';
  if (part > 10 && part - 10 !== missing) {
    return `${part} is 10 and ${part - 10}. What goes with ${part - 10} to make 10?`;
  }
  if (part < 10) return `First, what goes with ${part} to make 10? Then one more ten.`;
  return `Count up from ${part} to 20. How many did you count?`;
}

function missingPart(whole: Whole, part: number, gap: Gap, wrong: [number, ErrorTag][]): Question {
  const correct = whole - part;
  // Exactly these three: buildTaggedChoices only shuffles them and writes down
  // what each one means.
  const candidates: Candidate[] = wrong;
  return {
    id: gap === 'second' ? `gbond-${whole}-${part}+x` : `gbond-${whole}-x+${part}`,
    type: 'number_bond',
    prompt: gap === 'second' ? `${part} + ? = ${whole}` : `? + ${part} = ${whole}`,
    promptEmoji: EMOJI[whole],
    correctAnswer: String(correct),
    ...buildTaggedChoices(correct, candidates, {
      step: 1,
      isValid: (n) => wrong.some(([v]) => v === n),
    }),
    difficulty: whole === 20 || part === 0 || correct === 0 ? 2 : 1,
    hint: missingHint(whole, part),
    speakText: gap === 'second' ? `${part} plus what makes ${whole}?` : `What plus ${part} makes ${whole}?`,
  };
}

// --- "Which two numbers make 10?" ------------------------------------------

type Pair = readonly [number, number];
const show = ([x, y]: Pair) => `${x} + ${y}`;

/**
 * The sum each wrong pair makes, and what picking it would mean.
 *
 * One either side of the whole is a slip in adding the pair ('off-by-one'),
 * and every question has one. Two either side is a near miss with no story
 * ('unknown'), and on the second rung so is a pair that makes 10, a bond to 10
 * with the ten lost ('place-value'); every question has one of those too.
 *
 * Only sums one either side would be the better mistakes, but they are both
 * odd, and a pair making an odd sum is always one odd number and one even
 * number. The answer was then the only option whose two numbers were both odd
 * or both even — every single time, to 10 — which is a rule for finding it that
 * never adds anything up.
 */
function wrongSums(whole: Whole): [number, ErrorTag][] {
  const near: [number, ErrorTag][] = [[whole - 1, 'off-by-one'], [whole + 1, 'off-by-one']];
  const far: [number, ErrorTag][] = [[whole - 2, 'unknown'], [whole + 2, 'unknown']];
  if (whole === 20) far.push([10, 'place-value']);
  return shuffle([pick(near), pick(far), pick([...near, ...far])]);
}

/** A pair making `sum`, both numbers at least 1 and below the whole she was asked for. */
function pairMaking(sum: number, whole: Whole): Pair {
  const x = randomInt(Math.max(1, sum - (whole - 1)), Math.min(whole - 1, sum - 1));
  return [x, sum - x];
}

const sameBond = (p: Pair, q: Pair) => (p[0] === q[0] && p[1] === q[1]) || (p[0] === q[1] && p[1] === q[0]);
const shareANumber = (p: Pair, q: Pair) => p.some((v) => q.includes(v));

/**
 * No option can be told apart by which numbers it shares with the others.
 *
 * Build the wrong pairs by nudging the answer ("3 + 7" → "4 + 7", "3 + 6") and
 * the answer becomes the one option that shares a number with all the others.
 * Subtler, and true of random pairs too: two different pairs making 9 never
 * share a number, nor do two making 11, but the answer shares with about half
 * of each — so the answer was the best-connected option three times as often
 * as any wrong one. Requiring every option to share with the same number of
 * others (none, or exactly one partner each, ...) leaves nothing to spot.
 */
function fair(options: readonly Pair[]): boolean {
  const degree = options.map((p, i) => options.filter((q, j) => j !== i && shareANumber(p, q)).length);
  return degree.every((d) => d === degree[0]);
}

function wrongPairs(whole: Whole, answer: Pair): [Pair, ErrorTag][] {
  for (let attempt = 0; attempt < 800; attempt++) {
    const out: [Pair, ErrorTag][] = [];
    for (const [sum, tag] of wrongSums(whole)) {
      const p = pairMaking(sum, whole);
      if (sameBond(p, answer) || out.some(([q]) => sameBond(p, q))) break;
      out.push([p, tag]);
    }
    if (out.length === 3 && fair([answer, ...out.map(([p]) => p)])) return out;
  }
  // Not reachable for any bond this file accepts (the tests walk all of them),
  // but a question with an unfair layout beats no question at all.
  for (;;) {
    const out: [Pair, ErrorTag][] = [];
    for (const [sum, tag] of wrongSums(whole)) {
      const p = pairMaking(sum, whole);
      if (!sameBond(p, answer) && !out.some(([q]) => sameBond(p, q))) out.push([p, tag]);
    }
    if (out.length === 3) return out;
  }
}

function whichPair(whole: Whole, a: number, b: number): Question {
  const answer: Pair = [a, b];
  const wrong = wrongPairs(whole, answer);
  const distractorMeaning: Record<string, ErrorTag> = {};
  for (const [p, tag] of wrong) distractorMeaning[show(p)] = tag;
  const choices = shuffle([show(answer), ...wrong.map(([p]) => show(p))]);
  const spoken = [...choices]
    .sort((x, y) => parseInt(x, 10) - parseInt(y, 10))
    .map((c) => c.replace(' + ', ' plus '));
  return {
    id: `gbond-${whole}-pair-${a}+${b}`,
    type: 'number_bond',
    prompt: `Which two numbers make ${whole}?`,
    promptEmoji: EMOJI[whole],
    correctAnswer: show(answer),
    choices,
    distractorMeaning,
    difficulty: whole === 20 ? 2 : 1,
    hint: whole === 20
      ? 'Start at the bigger number in each pair and count on. Which pair makes exactly 20?'
      : `Add each pair on your fingers. Which one makes exactly ${whole}?`,
    speakText: `Which two numbers make ${whole}? ${spoken.slice(0, -1).join(', ')}, or ${spoken[spoken.length - 1]}?`,
  };
}

// --- Choosing a question ----------------------------------------------------

function parseTargets(raw: number | string | undefined): Whole[] {
  const wholes = String(raw ?? '').split(',').map((s) => Number(s.trim())).filter(isWhole);
  return wholes.length > 0 ? [...new Set(wholes)] : [5, 10];
}

function pickWhole(wholes: readonly Whole[]): Whole {
  let r = Math.random() * wholes.reduce((sum, w) => sum + WEIGHT[w], 0);
  for (const w of wholes) {
    r -= WEIGHT[w];
    if (r < 0) return w;
  }
  return wholes[wholes.length - 1];
}

/** How often a missing-part question on the second rung is a bond with 0 in it. */
const ZERO_SHARE = 0.06;

const RANKS = [0, 1, 2, 3] as const;

/**
 * For each part 1 to whole − 1 of a bond, how often to put its answer at each
 * sorted position: every bond equally often, and every position as near
 * equally often as the bonds allow.
 *
 * Choosing the position first and then any bond that fits it, as this used to,
 * gets the positions even but not the bonds. On bonds to 5 only 4 can be the
 * biggest option without four in a row (0, 1, 3, 4; for 3 it would be
 * 0, 1, 2, 3), so "1 + ? = 5" was two questions in five and 4 was right
 * nearly two times in three whenever it was offered.
 *
 * Which positions a bond can take is fixed by its numbers (see `wrongAround`),
 * so the table is worked out once per whole, by scaling the rows to the bonds'
 * share and the columns to a quarter in turn until they agree (Sinkhorn).
 */
const rankTables = new Map<Whole, number[][]>();

function rankTable(whole: Whole): number[][] {
  const cached = rankTables.get(whole);
  if (cached) return cached;
  const parts = whole - 1;
  const table: number[][] = Array.from({ length: parts }, (_, i) =>
    RANKS.map((r) => (wrongAround(whole, i + 1, r) ? 1 : 0)));
  for (let round = 0; round < 500; round++) {
    for (const r of RANKS) {
      const column = table.reduce((sum, row) => sum + row[r], 0);
      if (column > 0) for (const row of table) row[r] /= column * RANKS.length;
    }
    for (const row of table) {
      const total = row.reduce((x, y) => x + y, 0);
      for (const r of RANKS) row[r] /= total * parts;
    }
  }
  rankTables.set(whole, table);
  return table;
}

function pickWeighted(weights: readonly number[]): number {
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Where the answer to whole = part + ? sits once the options are sorted: from
 * the table for bonds without 0, and any position it can take for the two
 * that have one.
 */
function pickRank(whole: Whole, part: number): number {
  if (part > 0 && part < whole) return pickWeighted(rankTable(whole)[part - 1]);
  return pick(RANKS.filter((r) => wrongAround(whole, part, r) !== null));
}

function askMissing(whole: Whole, part: number, gap: Gap): Question {
  const wrong = wrongAround(whole, part, pickRank(whole, part));
  // Not reachable: pickRank only returns a position the bond can take.
  if (!wrong) throw new Error(`no options for ${whole} = ${part} + ?`);
  return missingPart(whole, part, gap, wrong);
}

/**
 * One number-bond question.
 *
 * Params: `{ operation: 'bond', targets: '5,10' }` (rung 0, bonds to 5 and 10)
 * or `{ operation: 'bond', targets: '5,10,20' }` (rung 1, mostly bonds to 20).
 * `targets` lists the wholes, any of 5, 10 and 20; anything else is ignored.
 *
 * The bonds with 0 in them (0 + 10, 20 + 0) are real bonds, but the bank marks
 * most of them harder than the rest, so here they only appear once 20 is in
 * play, and then rarely.
 */
export function generateBondQuestion(params: Record<string, number | string>): Question {
  const wholes = parseTargets(params.targets);
  const whole = pickWhole(wholes);

  // Bonds to 5 have only two pairs to offer as "which two?", so they are
  // asked as missing parts only.
  if (whole !== 5 && Math.random() < 0.2) {
    const a = randomInt(1, whole - 1);
    return whichPair(whole, a, whole - a);
  }

  const part = wholes.includes(20) && Math.random() < ZERO_SHARE
    ? pick([0, whole])
    : randomInt(1, whole - 1);
  return askMissing(whole, part, Math.random() < 0.5 ? 'second' : 'first');
}

// --- Rebuilding from an id --------------------------------------------------

/** 0 to `hi`, written the way String(n) writes it: no leading zeros. */
const upTo = (hi: number) => `(?:${Array.from({ length: hi + 1 }, (_, i) => i).join('|')})`;
/** Every "a+b" with a, b >= 1 and a + b = whole. */
const pairsOf = (whole: number) =>
  `(?:${Array.from({ length: whole - 1 }, (_, i) => `${i + 1}\\+${whole - i - 1}`).join('|')})`;

/**
 * Every id this file emits, and nothing else: the part is never more than the
 * whole, a "which two?" pair always makes its whole, and there is no "which
 * two?" for 5.
 */
export const BOND_ID_PATTERN = new RegExp(
  '^gbond-(?:' +
    WHOLES.map((w) => `${w}-(?:${upTo(w)}\\+x|x\\+${upTo(w)}${w === 5 ? '' : `|pair-${pairsOf(w)}`})`).join('|') +
    ')$',
);

/**
 * Rebuild a number-bond question from its SRS card id: the same prompt, answer
 * and picture. Wrong options are drawn fresh; the id names the bond, not them.
 */
export function bondFromId(id: string): Question | null {
  if (!BOND_ID_PATTERN.test(id)) return null;
  const m = id.match(/^gbond-(\d+)-(?:(\d+)\+x|x\+(\d+)|pair-(\d+)\+(\d+))$/);
  if (!m) return null;
  const whole = Number(m[1]);
  if (!isWhole(whole)) return null;
  if (m[4] !== undefined) return whichPair(whole, Number(m[4]), Number(m[5]));
  const gap: Gap = m[2] !== undefined ? 'second' : 'first';
  // The id does not say where the answer sat, so it is drawn again the same way.
  return askMissing(whole, Number(m[2] ?? m[3]), gap);
}

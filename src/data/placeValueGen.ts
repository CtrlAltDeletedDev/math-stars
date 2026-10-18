import { ErrorTag, Question } from '@/types';
import { buildTaggedChoices, randomInt, shuffle } from '@/engine/choices';

// Tens and ones, generated rather than hand-listed, so each rung of the
// practice ladder has more than a couple of dozen questions to deal from:
//
//   digits    What is the tens digit of 47? / the ones digit / How many tens are in 47?
//   build     4 tens and 7 ones = ?   7 ones and 4 tens = ?   40 + 7 = ?   7 + 40 = ?
//             (and the digits questions, so the rung below stays in practice)
//   compare   Which is greater: 45 or 54?   Which is less: 38 or 52?
//
// The hand-written bank in placeValue.ts and the levels built on it stay as
// they are; these are what the ladder draws on.
//
// The mistake every shape here is built to catch is the same one: treating the
// two digits as interchangeable. 74 for 47, the ones digit when asked for the
// tens, "45 is bigger than 54 because 5 is bigger than 4". Those are tagged
// 'place-value'. Anything without an honest story is left 'unknown'.

const tensOf = (n: number) => Math.floor(n / 10);
const onesOf = (n: number) => n % 10;
const swapOf = (n: number) => onesOf(n) * 10 + tensOf(n);

const isTwoDigit = (n: number) => Number.isInteger(n) && n >= 10 && n <= 99;
const isRepdigit = (n: number) => tensOf(n) === onesOf(n);

const tensWord = (t: number) => (t === 1 ? 'ten' : 'tens');
const onesWord = (o: number) => (o === 1 ? 'one' : 'ones');

/** The number drawn as keycaps, digit by digit, as the hand-written bank does. */
const keycaps = (n: number) => [...String(n)].map((d) => `${d}️⃣`).join('');

export const TEN_EMOJI = '🔟';
export const ONE_DOT = '●';

/**
 * Past five tens the picture runs off a phone screen and stops being
 * something she can count at a glance, so bigger numbers go without one.
 */
const PICTURE_MAX_TENS = 5;

/** Ones in fives, so seven reads as "five and two" rather than a row to count. */
const dots = (o: number) =>
  Array.from({ length: Math.ceil(o / 5) }, (_, i) => ONE_DOT.repeat(Math.min(5, o - i * 5))).join(' ');

/**
 * Tens as 🔟 and ones as dots, in the same order the words say them. Drawing
 * "3 ones and 5 tens" tens-first would let the picture quietly fix the order
 * the question is testing.
 */
function blocksPicture(t: number, o: number, onesFirst: boolean): string | undefined {
  if (t > PICTURE_MAX_TENS) return undefined;
  const parts = onesFirst ? [dots(o), TEN_EMOJI.repeat(t)] : [TEN_EMOJI.repeat(t), dots(o)];
  return parts.filter(Boolean).join(' ➕ ');
}

// --- Rung 0: which digit is which -----------------------------------------

export type DigitAsk = 'tensdigit' | 'onesdigit' | 'howmanytens';

/**
 * A repeated digit (44) is never asked about: both readings give 4, so it
 * cannot tell us whether she knows which place is which.
 */
const canAskDigit = (n: number) => isTwoDigit(n) && !isRepdigit(n);

/**
 * Three options: the two digits and the number itself. The answer is a single
 * digit, and the mistakes worth offering are the other digit (the one this
 * rung exists to catch) and tapping the number she was shown.
 *
 * Not four. The only way to reach four is a digit next to the answer, which no
 * child gives for "the tens digit of 47", or 40 — and 40 is a real mistake but
 * it gives the game away: "4, 7 or 40?" tells her the 4 is the one in the tens
 * place, which is the whole question. Nor would four options pass the rank
 * rule: a single-digit answer can never be one of the two biggest.
 */
function digitQuestion(ask: DigitAsk, n: number): Question {
  const t = tensOf(n), o = onesOf(n);
  const correct = ask === 'onesdigit' ? o : t;
  const other = ask === 'onesdigit' ? t : o;

  const prompt = ask === 'tensdigit'
    ? `What is the tens digit of ${n}?`
    : ask === 'onesdigit'
      ? `What is the ones digit of ${n}?`
      : `How many tens are in ${n}?`;

  return {
    id: `gpv-${ask}-${n}`,
    type: 'place_value',
    prompt,
    promptEmoji: keycaps(n),
    correctAnswer: String(correct),
    choices: shuffle([correct, other, n]).map(String),
    distractorMeaning: { [String(other)]: 'place-value', [String(n)]: 'answered-a-given-number' },
    difficulty: 1,
    hint: ask === 'tensdigit'
      ? 'The tens digit is the first one, on the left.'
      : ask === 'onesdigit'
        ? 'The ones digit is the last one, on the right.'
        : 'Look at the first digit. It tells you how many tens.',
    speakText: prompt,
  };
}

/**
 * A number for a digits question, with the tens digit bigger than the ones
 * digit exactly half the time. Uniform two-digit numbers have the bigger digit
 * in front 56% of the time, which would make "pick the bigger digit" a small
 * but real winning strategy for "what is the tens digit?".
 */
function digitNumber(): number {
  const tensBigger = Math.random() < 0.5;
  for (;;) {
    const t = randomInt(1, 9), o = randomInt(0, 9);
    if (o !== t && t > o === tensBigger) return 10 * t + o;
  }
}

// --- Rung 1: building a number from tens and ones -------------------------

export type BuildForm = 'build' | 'buildrev' | 'expand' | 'expandrev';

/**
 * build      4 tens and 7 ones = ?   (any two-digit number; "4 tens and 0 ones" is taught)
 * buildrev   7 ones and 4 tens = ?   (ones said first, so writing the digits in the
 *                                    order heard gives 74: she has to read the words)
 * expand     40 + 7 = ?              (no "40 + 0")
 * expandrev  7 + 40 = ?
 *
 * The two reversed forms need two different, non-zero digits, or there is no
 * order to get wrong.
 */
function canBuild(form: BuildForm, n: number): boolean {
  if (!isTwoDigit(n)) return false;
  const o = onesOf(n);
  if (form === 'build') return true;
  if (form === 'expand') return o >= 1;
  return o >= 1 && !isRepdigit(n);
}

const FOUR_IN_A_ROW_RETRIES = 6;
const fourInARow = (choices: string[]) => {
  const nums = choices.map(Number).sort((a, b) => a - b);
  return nums.length === 4 && nums[3] - nums[0] === 3;
};

function buildQuestion(form: BuildForm, n: number): Question {
  const t = tensOf(n), o = onesOf(n), tens = 10 * t;
  const words = form === 'build' || form === 'buildrev';
  const onesFirst = form === 'buildrev' || form === 'expandrev';

  // In priority order: when two mistakes land on the same value, the first
  // reading wins (for "4 tens and 0 ones", 4 is counting the tens as ones).
  const candidates: [number, ErrorTag][] = [];
  if (o >= 1 && o !== t) candidates.push([swapOf(n), 'place-value']); // 74 for 47
  candidates.push([t + o, 'place-value']); // counted the tens as ones: 4 + 7 = 11
  if (words) {
    candidates.push([o, 'answered-a-given-number'], [t, 'answered-a-given-number']);
    // Built the tens and forgot the ones. Nothing showed her 40, so this is a
    // real slip with no tag that honestly describes it.
    if (o >= 1) candidates.push([tens, 'unknown']);
    // Counting the tens one too far or one short: 10, 20, 30, 40, 50 → 57.
    candidates.push([n - 10, 'place-value'], [n + 10, 'place-value']);
  } else {
    candidates.push([tens, 'answered-a-given-number'], [o, 'answered-a-given-number']);
  }
  // Counting on the ones from the tens and stopping one early or late.
  candidates.push([n - 1, 'off-by-one'], [n + 1, 'off-by-one']);

  // The first reading of a value wins inside buildTaggedChoices too, and its
  // top-up (two or three away) is tagged 'unknown', which is honest here.
  const deal = () => buildTaggedChoices(n, candidates, {
    isValid: (v) => v >= 1 && v <= 99,
    prefer: [swapOf(n), t + o],
  });
  // The ones side runs thin for the "40 + 7" forms (only 48 and maybe 74 sit
  // above 47), so now and then the top-up hands back 47, 48, 49, 50. A run of
  // neighbours puts the answer at a guessable rank; deal again.
  let built = deal();
  for (let i = 0; i < FOUR_IN_A_ROW_RETRIES && fourInARow(built.choices); i++) built = deal();

  const tensPhrase = `${t} ${tensWord(t)}`, onesPhrase = `${o} ${onesWord(o)}`;
  const prompt = form === 'build'
    ? `${tensPhrase} and ${onesPhrase} = ?`
    : form === 'buildrev'
      ? `${onesPhrase} and ${tensPhrase} = ?`
      : form === 'expand'
        ? `${tens} + ${o} = ?`
        : `${o} + ${tens} = ?`;

  return {
    id: `gpv-${form}-${n}`,
    type: 'place_value',
    prompt,
    promptEmoji: words ? blocksPicture(t, o, onesFirst) : undefined,
    correctAnswer: String(n),
    ...built,
    difficulty: 2,
    hint: form === 'build'
      ? 'Count the tens by tens, then count on the ones.'
      : form === 'buildrev'
        ? 'Find the tens first. The tens digit is written first, then the ones.'
        : `Start at ${tens} and count on ${o} more.`,
    speakText: form === 'build'
      ? `${tensPhrase} and ${onesPhrase}. What number is that?`
      : form === 'buildrev'
        ? `${onesPhrase} and ${tensPhrase}. What number is that?`
        : form === 'expand'
          ? `What is ${tens} plus ${o}?`
          : `What is ${o} plus ${tens}?`,
  };
}

function buildNumber(form: BuildForm): number {
  for (;;) {
    const n = randomInt(10, 99);
    if (canBuild(form, n)) return n;
  }
}

// --- Rung 2: comparing two-digit numbers ----------------------------------

export type CompareAsk = 'greater' | 'less';

const canCompare = (a: number, b: number) => isTwoDigit(a) && isTwoDigit(b) && a !== b;

/**
 * The ones digits point the other way from the tens (38 vs 52, 45 vs 54), so
 * comparing the ones picks the wrong number. Picking it is the place-value
 * mistake; on any other pair a wrong pick has no story we can name.
 */
function isOnesTrap(a: number, b: number): boolean {
  const dt = tensOf(a) - tensOf(b), dO = onesOf(a) - onesOf(b);
  return dt !== 0 && dO !== 0 && Math.sign(dt) !== Math.sign(dO);
}

function compareQuestion(ask: CompareAsk, a: number, b: number): Question {
  const correct = ask === 'greater' ? Math.max(a, b) : Math.min(a, b);
  const wrong = correct === a ? b : a;
  const sameTens = tensOf(a) === tensOf(b);
  const t = tensOf(a);
  return {
    id: `gpv-${ask}-${a}-${b}`,
    type: 'place_value',
    prompt: `Which is ${ask}: ${a} or ${b}?`,
    promptEmoji: '⚖️',
    correctAnswer: String(correct),
    choices: shuffle([String(a), String(b)]),
    distractorMeaning: { [String(wrong)]: isOnesTrap(a, b) ? 'place-value' : 'unknown' },
    difficulty: 3,
    hint: sameTens
      ? `Both numbers have ${t} ${tensWord(t)}, so look at the ones.`
      : ask === 'greater'
        ? 'Look at the tens first. More tens makes a number greater.'
        : 'Look at the tens first. Fewer tens makes a number less.',
    speakText: `Which is ${ask}, ${a} or ${b}?`,
  };
}

/**
 * Four kinds of pair, evenly:
 *
 *   swapped digits   45 / 54
 *   ones disagree    38 / 52   (the ones say 38, the tens say 52)
 *   same tens        43 / 47   (now the ones do decide)
 *   ones agree       32 / 58, or tie 35 / 65
 *
 * Half are traps for "look at the ones" and half are not, so that strategy
 * scores a coin toss. Only reading the tens first wins.
 */
function comparePair(): [number, number] {
  const kind = randomInt(0, 3);
  const twoDistinct = (lo: number, hi: number): [number, number] => {
    const x = randomInt(lo, hi);
    let y = randomInt(lo, hi - 1);
    if (y >= x) y++;
    return [Math.min(x, y), Math.max(x, y)];
  };
  let pair: [number, number];
  if (kind === 0) {
    const [x, y] = twoDistinct(1, 9);
    pair = [10 * x + y, 10 * y + x];
  } else if (kind === 1) {
    const [t1, t2] = twoDistinct(1, 9);
    const [o2, o1] = twoDistinct(0, 9);
    pair = [10 * t1 + o1, 10 * t2 + o2];
  } else if (kind === 2) {
    const t = randomInt(1, 9);
    const [o1, o2] = twoDistinct(0, 9);
    pair = [10 * t + o1, 10 * t + o2];
  } else {
    const [t1, t2] = twoDistinct(1, 9);
    const o1 = randomInt(0, 9), o2 = randomInt(o1, 9);
    pair = [10 * t1 + o1, 10 * t2 + o2];
  }
  return Math.random() < 0.5 ? pair : [pair[1], pair[0]];
}

// --- Entry points -----------------------------------------------------------

export type PlaceValueMode = 'digits' | 'build' | 'compare';

const DIGIT_ASKS: DigitAsk[] = ['tensdigit', 'onesdigit', 'howmanytens'];

function randomDigitQuestion(): Question {
  return digitQuestion(DIGIT_ASKS[randomInt(0, DIGIT_ASKS.length - 1)], digitNumber());
}

/**
 * params: { operation: 'place_value', mode: 'digits' | 'build' | 'compare' }.
 * An unknown mode falls back to the bottom rung rather than throwing.
 */
export function generatePlaceValueQuestion(params: Record<string, number | string>): Question {
  const mode = String(params.mode ?? 'digits') as PlaceValueMode;
  if (mode === 'compare') {
    const [a, b] = comparePair();
    return compareQuestion(Math.random() < 0.5 ? 'greater' : 'less', a, b);
  }
  if (mode === 'build') {
    // Three in ten are the rung below, so finding the digits stays in practice.
    // The rest are as often ones-first as tens-first, so "write the digits in
    // the order you hear them" scores a coin toss: 4 tens and 7 ones and
    // 40 + 7 (20% and 15%) against 7 ones and 4 tens and 7 + 40 (20% and 15%).
    const r = randomInt(0, 19);
    if (r <= 5) return randomDigitQuestion();
    const form: BuildForm = r <= 9 ? 'build' : r <= 13 ? 'buildrev' : r <= 16 ? 'expand' : 'expandrev';
    return buildQuestion(form, buildNumber(form));
  }
  return randomDigitQuestion();
}

/**
 * Exactly the ids this file emits and accepts:
 *
 *   gpv-tensdigit-47  gpv-onesdigit-47  gpv-howmanytens-47   (10–99, no repeated digit)
 *   gpv-build-47                                              (10–99)
 *   gpv-expand-47                                             (ones digit 1–9)
 *   gpv-buildrev-47   gpv-expandrev-47                        (ones 1–9, digits differ)
 *   gpv-greater-45-54 gpv-less-45-54                          (two different 10–99)
 */
export const PLACE_VALUE_ID_PATTERN =
  /^gpv-(?:(?:tensdigit|onesdigit|howmanytens)-(?!(\d)\1)[1-9]\d|build-[1-9]\d|expand-[1-9][1-9]|(?:buildrev|expandrev)-(?!(\d)\2)[1-9][1-9]|(?:greater|less)-([1-9]\d)-(?!\3$)[1-9]\d)$/;

/** Rebuild a question from its id: same prompt, answer and picture; options dealt afresh. */
export function placeValueFromId(id: string): Question | null {
  let m = id.match(/^gpv-(tensdigit|onesdigit|howmanytens)-(\d+)$/);
  if (m) {
    const n = Number(m[2]);
    return String(n) === m[2] && canAskDigit(n) ? digitQuestion(m[1] as DigitAsk, n) : null;
  }
  m = id.match(/^gpv-(build|buildrev|expand|expandrev)-(\d+)$/);
  if (m) {
    const n = Number(m[2]);
    return String(n) === m[2] && canBuild(m[1] as BuildForm, n) ? buildQuestion(m[1] as BuildForm, n) : null;
  }
  m = id.match(/^gpv-(greater|less)-(\d+)-(\d+)$/);
  if (m) {
    const a = Number(m[2]), b = Number(m[3]);
    if (String(a) !== m[2] || String(b) !== m[3] || !canCompare(a, b)) return null;
    return compareQuestion(m[1] as CompareAsk, a, b);
  }
  return null;
}

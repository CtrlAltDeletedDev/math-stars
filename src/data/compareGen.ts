import { ErrorTag, Question } from '@/types';
import { randomInt, shuffle } from '@/engine/choices';

// Comparing numbers, generated rather than hand-listed, so the Comparing
// ladder never runs dry. The hand-written bank in `comparing.ts` stays as it
// is for the levels that use it; these are what the practice ladder draws on.
//
// Two shapes:
//   "12 ☐ 9"         which sign goes in the box: <, > or =
//   "Which is more?"  12 or 9 — exactly the two numbers as options, and
//                     "Which is less?" just as often, so "tap the bigger one"
//                     is not a strategy.
//
// Ids: gcmp-sign-<a>-<b>, gcmp-more-<a>-<b>, gcmp-less-<a>-<b>, numbers in the
// order she sees them.

type Sign = '<' | '>' | '=';

// The three signs that can go in the box, and only those: the bank once
// offered '≠', which is true of every unequal pair and was never marked right.
const SIGNS: readonly Sign[] = ['<', '>', '='];

const signOf = (a: number, b: number): Sign => (a > b ? '>' : a < b ? '<' : '=');

const leadingDigit = (n: number) => Number(String(n)[0]);

/**
 * The signs she would choose if she lost track of a ten — the comparing
 * mistake that means something:
 *   - looked only at the ones: 12 ☐ 9 reads as "2 is less than 9";
 *     20 ☐ 10 reads as "0 and 0, the same";
 *   - read a ten as a one: 15 ☐ 3 reads as "1 is less than 3".
 * Between two numbers with the same tens neither applies, and nothing is tagged.
 */
function tenSlipSigns(a: number, b: number): Set<Sign> {
  const out = new Set<Sign>();
  if (Math.floor(a / 10) !== Math.floor(b / 10)) out.add(signOf(a % 10, b % 10));
  if ((a < 10) !== (b < 10)) out.add(signOf(leadingDigit(a), leadingDigit(b)));
  out.delete(signOf(a, b));
  return out;
}

const SIGN_WORDS = 'greater than, less than, or equal to';

const MAX = 20;
const difficultyOf = (a: number, b: number) => (Math.max(a, b) <= 10 ? 1 : 2);

function signQuestion(a: number, b: number): Question {
  const correct = signOf(a, b);
  const slips = tenSlipSigns(a, b);
  const distractorMeaning: Record<string, ErrorTag> = {};
  for (const s of SIGNS) if (s !== correct) distractorMeaning[s] = slips.has(s) ? 'place-value' : 'unknown';
  const difficulty = difficultyOf(a, b);
  return {
    id: `gcmp-sign-${a}-${b}`,
    type: 'number_compare',
    prompt: `${a} ☐ ${b}`,
    correctAnswer: correct,
    choices: shuffle(SIGNS),
    distractorMeaning,
    difficulty,
    // The same hint whatever the answer, so it can never give the answer away.
    hint: difficulty === 1
      ? 'The open mouth of the sign eats the bigger number. If they are the same, use the equals sign.'
      : 'Look at the tens first, then the ones. The open mouth eats the bigger number.',
    speakText: `Which sign goes in the box? Is ${a} ${SIGN_WORDS} ${b}?`,
  };
}

function whichQuestion(ask: 'more' | 'less', a: number, b: number): Question {
  const correct = ask === 'more' ? Math.max(a, b) : Math.min(a, b);
  const wrong = correct === a ? b : a;
  // Picking `wrong` is a lost ten when a slip would have said it is the one asked for.
  const slipSays = tenSlipSigns(wrong, correct);
  const tag: ErrorTag = slipSays.has(ask === 'more' ? '>' : '<') ? 'place-value' : 'unknown';
  const difficulty = difficultyOf(a, b);
  const how = ask === 'more'
    ? 'Count up. The one you say later is more.'
    : 'Count up. The one you say first is less.';
  return {
    id: `gcmp-${ask}-${a}-${b}`,
    type: 'number_compare',
    prompt: `Which is ${ask}?`,
    promptEmoji: `${a}  or  ${b}`,
    correctAnswer: String(correct),
    choices: shuffle([String(a), String(b)]),
    distractorMeaning: { [String(wrong)]: tag },
    difficulty,
    hint: difficulty === 1 ? how : `Look at the tens first. ${how}`,
    speakText: `Which is ${ask}, ${a} or ${b}?`,
  };
}

/** Two different numbers for the rung. Past ten, half are pairs where looking only at the ones gets it wrong. */
function unequalPair(max: number): [number, number] {
  let a: number, b: number;
  if (max <= 10) {
    do { a = randomInt(0, 10); b = randomInt(0, 10); } while (a === b);
  } else {
    a = randomInt(11, max);
    if (Math.random() < 0.5) {
      // 12 against 9, 14 against 4: a single digit whose ones are not smaller.
      b = randomInt(a % 10, 9);
    } else {
      do { b = randomInt(0, max); } while (b === a);
    }
  }
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

// Equal often enough that '=' is a real answer, not a sign she learns to skip.
const EQUAL_SHARE = 0.3;

/**
 * One question for a Comparing rung.
 *
 *   { operation: 'compare', max: 10 }  numbers 0–10, difficulty 1
 *   { operation: 'compare', max: 20 }  at least one number 11–20, difficulty 2
 */
export function generateCompareQuestion(params: Record<string, number | string>): Question {
  const max = Number(params.max) <= 10 ? 10 : MAX;
  if (Math.random() < 0.6) {
    if (Math.random() < EQUAL_SHARE) {
      const n = max <= 10 ? randomInt(1, 10) : randomInt(11, max);
      return signQuestion(n, n);
    }
    return signQuestion(...unequalPair(max));
  }
  return whichQuestion(Math.random() < 0.5 ? 'more' : 'less', ...unequalPair(max));
}

/** Exactly the ids this file emits and `compareFromId` accepts. */
export const COMPARE_ID_PATTERN = /^gcmp-(?:sign|more|less)-(?:0|[1-9]\d*)-(?:0|[1-9]\d*)$/;

/**
 * Rebuild a comparing question from its SRS card id: the same prompt, answer
 * and difficulty, with the options shuffled afresh.
 *
 * Null for anything no rung could have asked: numbers past 20, "which is
 * more" between two equal numbers, or 0 ☐ 0.
 */
export function compareFromId(id: string): Question | null {
  if (!COMPARE_ID_PATTERN.test(id)) return null;
  const [, shape, sa, sb] = id.match(/^gcmp-(sign|more|less)-(\d+)-(\d+)$/)!;
  const a = +sa, b = +sb;
  if (a > MAX || b > MAX) return null;
  if (shape === 'sign') return a === 0 && b === 0 ? null : signQuestion(a, b);
  return a === b ? null : whichQuestion(shape as 'more' | 'less', a, b);
}

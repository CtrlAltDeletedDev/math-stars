import { Question } from '@/types';
import { buildChoices, randomInt, shuffle } from '@/engine/choices';

// Fractions for a first/second grader: halves, thirds, fourths, then fractions
// of a set, then comparing. Everything is drawn as well as written, because
// "1/4" means nothing until you have seen a quarter of a pizza.
//
// Two rules this file has to hold to:
//
//   Only one label can be correct. A bar with 2 of 4 parts shaded is *both*
//   2/4 and 1/2, so shaded counts are always in lowest terms — otherwise two
//   options are right and one of them is marked wrong.
//
//   Distractors are real fractions. 2/1 and 1/1 are not mistakes a six-year-old
//   makes, they are noise, and they teach her that some options are ignorable.

const NAMES: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 6: 'sixth', 8: 'eighth' };

const label = (num: number, den: number) => `${num}/${den}`;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Shaded counts that can't be written a simpler way. */
function properNumerators(den: number): number[] {
  const out: number[] = [];
  for (let n = 1; n < den; n++) if (gcd(n, den) === 1) out.push(n);
  return out;
}

/** A fraction is showable if it's a real part of a whole. */
const isProper = (num: number, den: number) => num >= 1 && den >= 2 && num < den;

/** Bias toward the biggest denominators in play, so higher rungs feel harder. */
function pickDenominator(dens: number[]): number {
  const sorted = [...dens].sort((a, b) => a - b);
  // Weight grows with position, so the newest denominator at this rung is the
  // most likely one to come up.
  const weights = sorted.map((_, i) => i + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < sorted.length; i++) {
    r -= weights[i];
    if (r <= 0) return sorted[i];
  }
  return sorted[sorted.length - 1];
}

function whatFractionShaded(den: number, num: number, shape: 'circle' | 'bar'): Question {
  const correct = label(num, den);
  const candidates: [number, number][] = [
    [den - num, den], // counted the empty parts instead
    [num, den + 1], // miscounted the total parts
    [num, den - 1],
    [num + 1, den], // miscounted the shaded parts
    [num - 1, den],
    // Halves have very few near misses — without these, a "what fraction is
    // shaded" question on a 1/2 bar could only muster two options, which is a
    // coin flip at the exact rung where she starts.
    [num, den + 2],
    [num + 1, den + 1],
    [1, den * 2],
  ];
  const wrong = candidates
    .filter(([n, d]) => isProper(n, d))
    // Reject anything worth the same as the answer: 2/4 and 1/2 shade the same
    // bar, so offering both makes two options correct.
    .filter(([n, d]) => Math.abs(n / d - num / den) > 1e-9)
    .map(([n, d]) => label(n, d));

  return {
    id: `frac-shaded-${shape}-${num}-${den}`,
    type: 'fraction',
    prompt: 'What fraction is shaded?',
    correctAnswer: correct,
    choices: shuffle([correct, ...[...new Set(wrong)].slice(0, 3)]),
    difficulty: den <= 2 ? 1 : den <= 4 ? 2 : 3,
    hint: `The shape has ${den} equal parts, and ${num} ${num === 1 ? 'is' : 'are'} coloured in.`,
    speakText: 'What fraction is shaded?',
    visual: { kind: 'fraction', numerator: num, denominator: den, shape },
  };
}

function whichShows(den: number, shape: 'circle' | 'bar'): Question {
  const name = NAMES[den] ?? `one out of ${den}`;
  const others = [2, 3, 4, 6, 8].filter((d) => d !== den).slice(0, 3);
  return {
    id: `frac-which-${shape}-${den}`,
    type: 'fraction',
    prompt: `Which fraction means one ${name}?`,
    correctAnswer: label(1, den),
    choices: shuffle([label(1, den), ...others.map((d) => label(1, d))]),
    difficulty: den <= 2 ? 1 : 2,
    hint: `One ${name} means splitting the whole into ${den} equal parts and taking 1.`,
    speakText: `Which fraction means one ${name}?`,
    visual: { kind: 'fraction', numerator: 1, denominator: den, shape },
  };
}

function fractionOfSet(den: number, whole: number): Question {
  const correct = whole / den;
  const name = NAMES[den] ?? `one out of ${den}`;
  return {
    id: `frac-set-${den}-${whole}`,
    type: 'fraction',
    prompt: `What is one ${name} of ${whole}?`,
    correctAnswer: String(correct),
    choices: buildChoices(
      correct,
      [
        whole - correct, // gave the rest instead of the share
        whole, // gave the whole
        den, // answered with the number of groups
        correct * 2,
      ],
      { step: 1, isValid: (n) => n >= 0 && n <= whole * 2 },
    ),
    difficulty: den === 2 ? 2 : 3,
    hint: `Split ${whole} into ${den} equal groups. How many are in one group?`,
    speakText: `What is one ${name} of ${whole}?`,
  };
}

/**
 * "Which is biggest?" over three unit fractions — the counter-intuitive idea
 * that more pieces means smaller pieces.
 *
 * All three are drawn, deliberately. The earlier version showed a single bar of
 * the *correct* answer, which handed her the answer in a picture. Showing every
 * option is the lesson; showing one is a leak.
 */
function compareFractions(dens: number[], want: 'biggest' | 'smallest'): Question {
  const pool = [...new Set(dens)].sort((a, b) => a - b);
  const chosen = shuffle(pool).slice(0, Math.min(3, pool.length));
  if (chosen.length < 2) chosen.push(chosen[0] === 2 ? 4 : 2);

  const sorted = [...chosen].sort((a, b) => a - b); // smaller denominator = bigger piece
  const target = want === 'biggest' ? sorted[0] : sorted[sorted.length - 1];

  return {
    id: `frac-cmp-${want}-${chosen.join('-')}`,
    type: 'fraction',
    prompt: `Which is ${want}?`,
    correctAnswer: label(1, target),
    choices: shuffle(chosen.map((d) => label(1, d))),
    difficulty: 3,
    hint: 'The more pieces you cut something into, the smaller each piece gets!',
    speakText: `Which fraction is ${want}?`,
    visual: { kind: 'fractionSet', fractions: chosen.map((d) => [1, d] as [number, number]) },
  };
}

const pickShape = (): 'circle' | 'bar' => (Math.random() < 0.5 ? 'circle' : 'bar');

export function generateFractionQuestion(
  dens: number[],
  mode: 'recognise' | 'ofSet' | 'compare',
): Question {
  if (mode === 'compare') {
    return compareFractions(dens, Math.random() < 0.5 ? 'biggest' : 'smallest');
  }

  const den = pickDenominator(dens);

  if (mode === 'ofSet') {
    const wholes = [2, 3, 4, 5, 6].map((k) => k * den).filter((w) => w <= 24);
    return fractionOfSet(den, wholes[randomInt(0, wholes.length - 1)]);
  }

  if (Math.random() < 0.25) return whichShows(den, pickShape());
  const nums = properNumerators(den);
  return whatFractionShaded(den, nums[randomInt(0, nums.length - 1)], pickShape());
}

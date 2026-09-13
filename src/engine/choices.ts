// Building the four answer buttons.
//
// The rule this file exists to enforce: a child must not be able to score well
// by spotting a pattern in *where* the answer sits or *what shape* the options
// take. Two things go wrong easily, and both did:
//
//   1. Distractors clustered around the answer (c-2, c-1, c, c+1) make the four
//      options consecutive integers, so the answer is almost always the third
//      smallest. That is learnable in a week and teaches nothing.
//   2. Writing the correct answer first in a hand-authored `choices` array and
//      rendering that array in order puts the answer under the same button every
//      time.
//
// So: distractors are drawn from *plausible mistakes* supplied by the caller,
// and the final order is randomised here, once, for everyone.

import { ErrorTag } from '@/types';

/**
 * A plausible wrong answer, optionally carrying what picking it would mean.
 *
 * A bare number still works, so every existing call site compiles untouched and
 * can be tagged one at a time.
 */
export type Candidate = number | readonly [number, ErrorTag];

const valueOf = (c: Candidate): number => (typeof c === 'number' ? c : c[0]);
const tagOf = (c: Candidate): ErrorTag => (typeof c === 'number' ? 'unknown' : c[1]);

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CHOICE_COUNT = 4;

/**
 * Assemble a shuffled set of `CHOICE_COUNT` options.
 *
 * `candidates` are plausible wrong answers in priority order — the mistakes a
 * child would actually make on this question. They're used first; `fallback`
 * only tops up the list when there aren't enough distinct valid candidates.
 *
 * Values that are invalid (negative, or rejected by `isValid`), duplicated, or
 * equal to the answer are skipped, so callers can propose freely.
 */
export interface ChoiceOptions {
  /**
   * The natural unit for this question — 1 for arithmetic, `by` for skip
   * counting, the table for multiplication. When the caller's candidate pool
   * runs thin on one side of the answer, more are synthesised as
   * `correct ± k * step`, which stays plausible (a wrong multiple, an
   * off-by-one) while keeping both sides populated.
   */
  step?: number;
  isValid?: (n: number) => boolean;
  /**
   * How a value is written on the button. Money needs "30¢" rather than "30",
   * and it has to happen in here: `distractorMeaning` is keyed by the option's
   * own text, so formatting afterwards would leave the keys pointing at
   * options that no longer exist.
   */
  format?: (n: number) => string;
}

/**
 * The options plus what each wrong one would mean.
 *
 * The field is named `distractorMeaning` so a caller can spread the whole
 * result straight into the question it is building. That matters more than it
 * looks: TypeScript does not apply excess-property checking to a spread, so a
 * near-miss name here would compile cleanly and silently produce questions
 * carrying no meaning at all.
 */
export interface TaggedChoices {
  choices: string[];
  distractorMeaning: Record<string, ErrorTag>;
}

export function buildChoices(
  correct: number,
  candidates: readonly Candidate[],
  opts: ChoiceOptions = {},
): string[] {
  return buildTaggedChoices(correct, candidates, opts).choices;
}

export function buildTaggedChoices(
  correct: number,
  candidates: readonly Candidate[],
  opts: ChoiceOptions = {},
): TaggedChoices {
  const { step = 1, isValid = (n: number) => n >= 0, format = String } = opts;
  const wrong: number[] = [];
  const taken = new Set<number>([correct]);

  // What each value would mean, first assignment winning: a caller's own
  // reading of a value always beats the one synthesised below.
  const meaningOf = new Map<number, ErrorTag>();
  for (const c of candidates) {
    const v = valueOf(c);
    if (!meaningOf.has(v)) meaningOf.set(v, tagOf(c));
  }

  const offer = (n: number): boolean => {
    if (wrong.length >= CHOICE_COUNT - 1) return false;
    if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
    if (taken.has(n) || !isValid(n)) return false;
    taken.add(n);
    wrong.push(n);
    return true;
  };

  // Balance how many distractors sit below vs above the answer.
  //
  // Without this, a generator whose plausible mistakes skew one way (subtraction
  // errors mostly land high, addition errors mostly land low) parks the answer at
  // the same rank once the options are sorted — the exact tell we removed from
  // the old c-2/c-1/c/c+1 scheme. Choosing the split at random per question means
  // sorted position carries no information, whatever the candidate pool looks like.
  const pool = shuffle(candidates.map(valueOf));
  const stepped = [1, 2, 3].map((k) => k * step);

  // A synthesised top-up still means something: one step off the answer in a
  // question that counts in steps is a wrong multiple, and one off in a
  // question that counts in ones is a miscount. Anything further out is a near
  // miss with no story, which is what 'unknown' is for.
  for (const [k, d] of stepped.entries()) {
    const tag: ErrorTag = step > 1 ? 'wrong-multiple' : k === 0 ? 'off-by-one' : 'unknown';
    for (const v of [correct - d, correct + d]) if (!meaningOf.has(v)) meaningOf.set(v, tag);
  }

  // Each side gets the caller's own candidates first, then synthesised ones, so
  // both sides can always supply up to three distractors.
  const below = [...pool.filter((n) => n < correct), ...stepped.map((d) => correct - d)]
    .filter((n) => isValid(n));
  const above = [...pool.filter((n) => n > correct), ...stepped.map((d) => correct + d)]
    .filter((n) => isValid(n));

  const targetBelow = Math.min(
    new Set(below).size,
    randomInt(0, Math.min(CHOICE_COUNT - 1, new Set(above).size ? CHOICE_COUNT - 1 : 0)),
  );

  let takenBelow = 0;
  for (const c of below) {
    if (takenBelow >= targetBelow) break;
    if (offer(c)) takenBelow++;
  }
  for (const c of above) offer(c);
  for (const c of below) offer(c); // top up if one side ran short

  // Last resort: walk outward from the answer until we have four distinct
  // non-negative values. Only reachable for very small answer spaces.
  for (let d = 1; wrong.length < CHOICE_COUNT - 1 && d < 200; d++) {
    offer(correct + d);
    offer(correct - d);
  }

  const distractorMeaning: Record<string, ErrorTag> = {};
  for (const n of wrong) distractorMeaning[format(n)] = meaningOf.get(n) ?? 'unknown';

  return { choices: shuffle([correct, ...wrong]).map(format), distractorMeaning };
}

/** Shuffle an already-built list of string options (used for hand-written banks). */
export function shuffleChoices(choices: readonly string[]): string[] {
  return shuffle(choices);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

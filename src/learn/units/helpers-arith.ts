import { additionHint, subtractionHint } from '@/engine/questionGenerator';
import { randomInt, shuffle } from '@/engine/choices';
import { Choice, CounterColour, Item, ModelState } from '../types';

// Shared builders for the arithmetic units: Numbers to 20, Adding to 10,
// Taking away to 10, and Adding and taking away to 20.
//
// The model states here follow the comments in ../types.ts. Three readings of
// those comments matter for "do" tasks, and every solution below respects them
// so that a sequence of her taps can actually reach it:
//
//   - A ten frame's tray hands out its `a` counters first, then its `b` ones.
//     Tapping a counter sends it back to the tray (or crosses it out when
//     `takeAway` is set), so counters on the frame plus the tray never change.
//   - A number line's `path` is every number landed on, not counting `start`.
//   - A bond's `split` is how many counters are in the left part.

export { randomInt, shuffle };

export type FrameState = Extract<ModelState, { model: 'tenFrame' }>;
export type LineState = Extract<ModelState, { model: 'numberLine' }>;
export type ObjectsState = Extract<ModelState, { model: 'objects' }>;
export type BondState = Extract<ModelState, { model: 'bond' }>;

export function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/** One of several question makers, chosen by weight. */
export function weighted(entries: readonly (readonly [number, () => Item])[]): Item {
  const total = entries.reduce((s, [w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [w, make] of entries) {
    if ((r -= w) < 0) return make();
  }
  return entries[entries.length - 1][1]();
}

export function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
}

// --- Ten frames -------------------------------------------------------------

type Cell = CounterColour | null;

export interface FrameOpts {
  frames?: 1 | 2;
  crossed?: number[];
  tray?: { a: number; b: number };
  takeAway?: boolean;
}

function finish(base: FrameState, opts: FrameOpts): FrameState {
  const s: FrameState = { ...base };
  if (opts.crossed && opts.crossed.length > 0) s.crossed = opts.crossed;
  if (opts.tray) s.tray = opts.tray;
  if (opts.takeAway) s.takeAway = true;
  return s;
}

/** `a` counters of the first colour then `b` of the second, filling in order: top row, bottom row, next frame. */
export function frame(a: number, b = 0, opts: FrameOpts = {}): FrameState {
  const frames = opts.frames ?? (a + b > 10 ? 2 : 1);
  const cells = Array.from({ length: frames * 10 }, (_, i): Cell => (i < a ? 'a' : i < a + b ? 'b' : null));
  return finish({ model: 'tenFrame', frames, cells }, opts);
}

function oneFrame(a: number, b: number): Cell[] {
  return Array.from({ length: 10 }, (_, i): Cell => (i < a ? 'a' : i < a + b ? 'b' : null));
}

/** Two frames filled separately: [first colour, second colour] in each. */
export function frames2(top: [number, number], bottom: [number, number], opts: Omit<FrameOpts, 'frames'> = {}): FrameState {
  return finish({ model: 'tenFrame', frames: 2, cells: [...oneFrame(...top), ...oneFrame(...bottom)] }, opts);
}

/** One frame, `top` counters in the top row and `bottom` (second colour) in the bottom row: how doubles look. */
export function rows(top: number, bottom: number, opts: Omit<FrameOpts, 'frames'> = {}): FrameState {
  const cells = Array.from({ length: 10 }, (_, i): Cell => (i < top ? 'a' : i >= 5 && i < 5 + bottom ? 'b' : null));
  return finish({ model: 'tenFrame', frames: 1, cells }, opts);
}

/** `a` counters with the last `b` crossed out: a − b as a picture. */
export function crossFrame(a: number, b: number, opts: Omit<FrameOpts, 'crossed'> = {}): FrameState {
  return frame(a, 0, { ...opts, crossed: range(a - b, a) });
}

export const placed = (s: FrameState): number => s.cells.filter((c) => c !== null).length;
export const inFrame = (s: FrameState, k: 0 | 1): number => s.cells.slice(k * 10, k * 10 + 10).filter((c) => c !== null).length;
export const topRow = (s: FrameState): number => s.cells.slice(0, 5).filter((c) => c !== null).length;
export const bottomRow = (s: FrameState): number => s.cells.slice(5, 10).filter((c) => c !== null).length;
export const colourCount = (s: FrameState, c: CounterColour): number => s.cells.filter((x) => x === c).length;
export const crossedCells = (s: FrameState): number[] => [...new Set(s.crossed ?? [])].filter((i) => s.cells[i] != null);
export const crossedCount = (s: FrameState): number => crossedCells(s).length;
export const trayCount = (s: FrameState): number => (s.tray?.a ?? 0) + (s.tray?.b ?? 0);
/** Counters still there: on the frame and not crossed out. */
export const leftOn = (s: FrameState): number => placed(s) - crossedCount(s);

// --- Number lines -----------------------------------------------------------

export function line(start: number | null, path: number[] = [], max = 10, min = 0): LineState {
  return { model: 'numberLine', min, max, start, path };
}

/** Every number landed on, hopping `n` from `from` (back when n < 0). */
export function hops(from: number, n: number): number[] {
  const step = Math.sign(n);
  return Array.from({ length: Math.abs(n) }, (_, i) => from + step * (i + 1));
}

const same = (x: readonly number[], y: readonly number[]) => x.length === y.length && x.every((v, i) => v === y[i]);

// --- Objects and bonds ------------------------------------------------------

export function things(emoji: string, count: number, counted: number[] = [], scattered = false): ObjectsState {
  return scattered ? { model: 'objects', emoji, count, counted, scattered } : { model: 'objects', emoji, count, counted };
}

/** Every one tapped, each once. */
export const allCounted = (s: ObjectsState): boolean => s.counted.length === s.count && new Set(s.counted).size === s.count;

export function bond(whole: number | null, parts: [number | null, number | null], split?: number): BondState {
  return split === undefined ? { model: 'bond', whole, parts } : { model: 'bond', whole, parts, counters: true, split };
}

// --- Goals and hints for "do" steps ------------------------------------------

type Goal = (s: ModelState) => boolean;
type Hint = (s: ModelState) => string;

export const onFrame = (p: (s: FrameState) => boolean): Goal => (s) => s.model === 'tenFrame' && p(s);
export const onLine = (p: (s: LineState) => boolean): Goal => (s) => s.model === 'numberLine' && p(s);
export const onObjects = (p: (s: ObjectsState) => boolean): Goal => (s) => s.model === 'objects' && p(s);
export const onBond = (p: (s: BondState) => boolean): Goal => (s) => s.model === 'bond' && p(s);

export const frameHint = (f: (s: FrameState) => string): Hint => (s) => (s.model === 'tenFrame' ? f(s) : 'Tap the ten frame.');
export const lineHint = (f: (s: LineState) => string): Hint => (s) => (s.model === 'numberLine' ? f(s) : 'Tap the number line.');
export const objectsHint = (f: (s: ObjectsState) => string): Hint => (s) => (s.model === 'objects' ? f(s) : 'Tap each one.');
export const bondHint = (f: (s: BondState) => string): Hint => (s) => (s.model === 'bond' ? f(s) : 'Move the counters.');

/** Start on `start` and hop `n` (back when n < 0), one hop at a time. */
export const hopGoal = (start: number, n: number): Goal => onLine((s) => s.start === start && same(s.path, hops(start, n)));

/** Says what to fix: where to start, which way to hop, how many hops are left. */
export function hopHint(start: number, n: number): Hint {
  const way = n > 0 ? 'forward' : 'back';
  const want = Math.abs(n);
  return lineHint((s) => {
    if (s.start === null) return `Tap ${start} to start there.`;
    if (s.start !== start) return `Start on ${start}. Tap ${start} first.`;
    const wrongWay = s.path.some((p, i) => (p - (i === 0 ? start : s.path[i - 1])) * Math.sign(n) < 0);
    if (wrongWay) return n > 0 ? 'Adding hops forward, to the bigger numbers.' : 'Taking away hops back, toward 0.';
    const made = s.path.length;
    if (made === 0) return `You are on ${start}. Now hop ${way} ${want}, counting each hop.`;
    if (made > want) return `That is too many hops. Start again on ${start} and make ${want}.`;
    return `You have made ${made}. Hop ${way} ${want - made} more.`;
  });
}

/** Cross out exactly `n`. */
export function crossHint(n: number): Hint {
  return frameHint((s) => {
    const c = crossedCount(s);
    if (c === 0) return `Tap a counter to cross it out. Cross out ${n}.`;
    if (c < n) return `You crossed out ${c}. Cross out ${n - c} more.`;
    if (c > n) return `That is too many crossed out. Start again and cross out ${n}.`;
    return 'Count the ones you crossed out.';
  });
}

/** Fill the frame (or frames) so they hold exactly `n`. */
export function fillHint(n: number): Hint {
  return frameHint((s) => {
    const p = placed(s);
    if (p < n) return `There are ${p} in the frame. Put in ${n - p} more.`;
    if (p > n) return `That is too many. Tap a counter to send it back.`;
    return 'Check the top row is full first.';
  });
}

// --- Items ------------------------------------------------------------------

type Pic = ModelState | null;
const withPicture = (item: Item, picture: Pic): Item => (picture ? { ...item, picture } : item);

/** "a + b = ?", a fact (id add-a+b) the grown-ups grid sees. Pictured as two colours in a ten frame unless told otherwise. */
export function sumItem(a: number, b: number, picture: Pic = frame(a, b), hint = additionHint(a, b)): Item {
  return withPicture({
    id: `add-${a}+${b}`,
    say: `What is ${a} plus ${b}?`,
    prompt: `${a} + ${b} = ?`,
    answer: String(a + b),
    input: 'number',
    hint,
  }, picture);
}

/** "a − b = ?", a fact (id sub-a-b). Pictured as a counters with b crossed out unless told otherwise. */
export function diffItem(a: number, b: number, picture: Pic = crossFrame(a, b), hint = subtractionHint(a, b)): Item {
  return withPicture({
    id: `sub-${a}-${b}`,
    say: `What is ${a} take away ${b}?`,
    prompt: `${a} − ${b} = ?`,
    answer: String(a - b),
    input: 'number',
    hint,
  }, picture);
}

/** "a + ? = whole": the missing part. */
export function missingAdd(a: number, whole: number, picture: Pic = null, hint = `Start at ${a} and count up to ${whole}. How many did you count?`): Item {
  return withPicture({
    id: `miss-add-${a}+x=${whole}`,
    say: `${a} plus what makes ${whole}?`,
    prompt: `${a} + ? = ${whole}`,
    answer: String(whole - a),
    input: 'number',
    hint,
  }, picture);
}

/** "? + b = whole". */
export function missingFirst(b: number, whole: number, picture: Pic = null, hint = `Start at ${b} and count up to ${whole}. How many did you count?`): Item {
  return withPicture({
    id: `miss-add-x+${b}=${whole}`,
    say: `What plus ${b} makes ${whole}?`,
    prompt: `? + ${b} = ${whole}`,
    answer: String(whole - b),
    input: 'number',
    hint,
  }, picture);
}

/** "a − ? = left": how many were taken away. */
export function missingSub(a: number, left: number, picture: Pic = null, hint = `Start at ${left} and count up to ${a}. How many did you count?`): Item {
  return withPicture({
    id: `miss-sub-${a}-x=${left}`,
    say: `${a} take away what leaves ${left}?`,
    prompt: `${a} − ? = ${left}`,
    answer: String(a - left),
    input: 'number',
    hint,
  }, picture);
}

/** "a + b = c + ?": the same total written another way (8 + 5 = 10 + ?, 2 + 7 = 7 + ?). */
export function sameAsItem(a: number, b: number, c: number, hint: string, picture: Pic = null): Item {
  return withPicture({
    id: `same-${a}+${b}=${c}+x`,
    say: `${a} plus ${b} is the same as ${c} plus what?`,
    prompt: `${a} + ${b} = ${c} + ?`,
    answer: String(a + b - c),
    input: 'number',
    hint,
  }, picture);
}

/** A question answered by tapping one of a few choices, shuffled every time. */
export function choiceItem(fields: Omit<Item, 'input' | 'answer'>, right: Choice, wrong: Choice[]): Item {
  return { ...fields, answer: right.value, input: { choices: shuffle([right, ...wrong]) } };
}

/** The wrong totals a first grader really gives for a + b. */
export function wrongSums(a: number, b: number): number[] {
  const s = a + b;
  return [s - 1, s + 1, Math.abs(a - b), 2 * Math.max(a, b)].filter((n) => n >= 0 && n !== s);
}

/** The wrong answers a first grader really gives for a − b. */
export function wrongDiffs(a: number, b: number): number[] {
  const d = a - b;
  return [a + b, d + 1, d - 1, b].filter((n) => n >= 0 && n !== d);
}

/**
 * "Is 6 + 2 = 9 right?" Half the time it is; otherwise it shows a real
 * mistake (one off, or the other operation).
 */
export function trueOrFalse(a: number, op: '+' | '−', b: number, picture: Pic = null): Item {
  const right = op === '+' ? a + b : a - b;
  const shown = Math.random() < 0.5 ? right : pick(op === '+' ? wrongSums(a, b) : wrongDiffs(a, b));
  const word = op === '+' ? 'plus' : 'take away';
  const yes = shown === right;
  return withPicture(choiceItem(
    {
      id: `tf-${a}${op === '+' ? '+' : '-'}${b}=${shown}`,
      say: `Is ${a} ${word} ${b} the same as ${shown}? Yes or no?`,
      prompt: `${a} ${op} ${b} = ${shown}`,
      hint: op === '+' ? additionHint(a, b) : subtractionHint(a, b),
    },
    yes ? { value: 'yes', label: '👍 Yes', say: 'Yes' } : { value: 'no', label: '👎 No', say: 'No' },
    [yes ? { value: 'no', label: '👎 No', say: 'No' } : { value: 'yes', label: '👍 Yes', say: 'Yes' }],
  ), picture);
}

/** Choices that are pictures. The label stays empty: a number on the button would give the answer away. */
export function pictureChoice(value: string, model: ModelState): Choice {
  return { value, label: '', say: 'This one?', model };
}

/** "Which ten frame shows n?", with the frames she would really confuse it with. */
export function whichFrame(n: number, picture: (k: number) => ModelState = (k) => frame(k)): Item {
  // One off from counting, and the empty spaces counted instead of the counters.
  const wrong = shuffle([n - 1, n + 1, 10 - n, n + 2].filter((k) => k >= 0 && k <= 20 && k !== n));
  const chosen = [...new Set(wrong)].slice(0, 2);
  return choiceItem(
    {
      id: `which-frame-${n}`,
      say: `Which one shows ${n}?`,
      prompt: `Which shows ${n}?`,
      hint: n >= 5 ? `Look for a full row of 5, then count on.` : 'Count the counters, not the empty spaces.',
    },
    pictureChoice(String(n), picture(n)),
    chosen.map((k) => pictureChoice(String(k), picture(k))),
  );
}

/** A copy with no picture, for the check. */
export function bare(item: Item): Item {
  const { picture: _picture, ...rest } = item;
  return rest;
}

/** "How many?" about a figure that is part of the question (it stays in the check). */
export function howMany(id: string, say: string, figure: ModelState, answer: number, hint: string): Item {
  return { id, say, prompt: 'How many?', answer: String(answer), input: 'number', figure, hint };
}

import { buildTaggedChoices, Candidate, randomInt, shuffle } from '@/engine/choices';
import { AskStep, Choice, DoStep, Item, ModelState, ShowStep } from '../types';

// Shared builders for the "world" units: stories, tens and ones, length,
// graphs, time, shapes and coins.
//
// Two things every unit leans on, so they live here once:
//   - Items. Choices are shuffled here, per item, and duplicates and the answer
//     itself are dropped from the wrong ones, so a unit can propose its
//     plausible mistakes freely.
//   - Names. Stories pick names (and things) from their numbers, so the same
//     item id always rebuilds to the same words, and no one is ever called by a pronoun:
//     the name is simply said again.

export { randomInt, shuffle };

// --- Steps ------------------------------------------------------------------

export const show = (say: string, caption?: string, model?: ModelState): ShowStep => ({ type: 'show', say, caption, model });

/** A "do" step; typed by model kind so goals and hints read their own state. */
export function doStep<K extends ModelState['model']>(o: {
  say: string;
  caption?: string;
  model: Extract<ModelState, { model: K }>;
  solution: Extract<ModelState, { model: K }>;
  goal: (s: Extract<ModelState, { model: K }>) => boolean;
  hint: string | ((s: Extract<ModelState, { model: K }>) => string);
  then: string;
}): DoStep {
  const kind = o.model.model;
  const as = (s: ModelState) => s as Extract<ModelState, { model: K }>;
  return {
    type: 'do',
    say: o.say,
    caption: o.caption,
    model: o.model,
    solution: o.solution,
    goal: (s) => s.model === kind && o.goal(as(s)),
    hint: typeof o.hint === 'string' ? o.hint : (s) => (s.model === kind ? (o.hint as (x: Extract<ModelState, { model: K }>) => string)(as(s)) : 'Try again.'),
    then: o.then,
  };
}

export const ask = (item: Item): AskStep => ({ type: 'ask', item });

// --- Items ------------------------------------------------------------------

interface ItemBase {
  id: string;
  say: string;
  prompt: string;
  figure?: ModelState;
  picture?: ModelState;
  hint?: string;
}

/** A number typed on the pad. */
export function numberItem(o: ItemBase & { answer: number }): Item {
  return { ...o, answer: String(o.answer), input: 'number' };
}

/**
 * Tap one of a few choices. `wrong` are plausible mistakes, most telling
 * first; any equal to the answer or to each other are dropped, and at most
 * `max - 1` are kept. The order is shuffled here, every time.
 */
export function choiceItem(o: ItemBase & { answer: Choice; wrong: Choice[]; max?: number }): Item {
  const max = o.max ?? 4;
  const seen = new Set([o.answer.value]);
  const wrong: Choice[] = [];
  for (const c of o.wrong) {
    if (wrong.length >= max - 1 || seen.has(c.value)) continue;
    seen.add(c.value);
    wrong.push(c);
  }
  const { wrong: _w, answer, max: _m, ...rest } = o;
  return { ...rest, answer: answer.value, input: { choices: shuffle([answer, ...wrong]) } };
}

/** Something to do with a model: set the clock, build the number. */
export function modelItem<K extends ModelState['model']>(o: ItemBase & {
  answer: string;
  model: Extract<ModelState, { model: K }>;
  solution: Extract<ModelState, { model: K }>;
  goal: (s: Extract<ModelState, { model: K }>) => boolean;
}): Item {
  const kind = o.model.model;
  const { model, solution, goal, ...rest } = o;
  return {
    ...rest,
    input: { model, solution, goal: (s) => s.model === kind && goal(s as Extract<ModelState, { model: K }>) },
  };
}

/**
 * Four number choices: the answer and the caller's plausible mistakes, topped
 * up and balanced above and below by `buildTaggedChoices` so the answer's rank
 * among them never gives it away. `prefer` is the one mistake the question
 * exists to catch: whenever a wrong answer is offered on its side of the
 * answer, it is that one.
 */
export function numberChoices(answer: number, mistakes: Candidate[], opts: { format?: (n: number) => string; say?: (n: number) => string; step?: number; max?: number; prefer?: number[] } = {}): { answer: Choice; wrong: Choice[] } {
  const format = opts.format ?? String;
  const { choices } = buildTaggedChoices(answer, mistakes, {
    format,
    step: opts.step ?? 1,
    isValid: (n) => n >= 0 && n <= (opts.max ?? 200),
    prefer: opts.prefer ?? [],
  });
  const toChoice = (label: string): Choice => {
    const n = Number(label.replace(/[^\d]/g, ''));
    return { value: label, label, say: opts.say ? opts.say(n) : undefined };
  };
  const all = choices.map(toChoice);
  return { answer: all.find((c) => c.value === format(answer))!, wrong: all.filter((c) => c.value !== format(answer)) };
}

/** A practice generator drawing from several, by weight. */
export function mix(...gens: [number, () => Item][]): () => Item {
  const total = gens.reduce((s, [w]) => s + w, 0);
  return () => {
    let r = Math.random() * total;
    for (const [w, g] of gens) if ((r -= w) < 0) return g();
    return gens[gens.length - 1][1]();
  };
}

/** One of a list. */
export const any = <T>(xs: readonly T[]): T => xs[randomInt(0, xs.length - 1)];

/** A fixed pick from a seed, so a question rebuilds to the same words from its numbers. */
export function seeded<T>(xs: readonly T[], seed: number): T {
  return xs[((seed % xs.length) + xs.length) % xs.length];
}

export const last = <T>(xs: readonly T[]): T | undefined => xs[xs.length - 1];

export const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

// --- People and things ------------------------------------------------------

export const NAMES = [
  'Ava', 'Leo', 'Mia', 'Omar', 'Zoe', 'Eli', 'Priya', 'Sam', 'Lucy', 'Max', 'Ruby', 'Theo', 'Nora', 'Jack',
  'Molly', 'Hudson', 'Kenna', 'Rhett', 'Sally', 'Nick', 'Madison', 'Harry', 'Talan', 'Gordan',
] as const;

/** Two different names from a seed (7 is coprime with 24). */
export function twoNames(seed: number): [string, string] {
  return [seeded(NAMES, seed), seeded(NAMES, seed + 7)];
}

/** Things to have a pile of: plural noun and its picture. */
export const THINGS = [
  { noun: 'apples', emoji: '🍎' },
  { noun: 'shells', emoji: '🐚' },
  { noun: 'stickers', emoji: '⭐' },
  { noun: 'balloons', emoji: '🎈' },
  { noun: 'cookies', emoji: '🍪' },
  { noun: 'toy cars', emoji: '🚗' },
  { noun: 'marbles', emoji: '🔵' },
  { noun: 'crayons', emoji: '🖍️' },
  { noun: 'books', emoji: '📚' },
  { noun: 'fish', emoji: '🐟' },
] as const;

/** A whole made of two kinds, for "some are red and the rest are green". */
export const SPLITS = [
  { whole: 'apples', a: 'red apples', b: 'green apples', ea: '🍎', eb: '🍏' },
  { whole: 'balls', a: 'soccer balls', b: 'basketballs', ea: '⚽', eb: '🏀' },
  { whole: 'animals', a: 'bears', b: 'bunnies', ea: '🧸', eb: '🐰' },
  { whole: 'flowers', a: 'red flowers', b: 'yellow flowers', ea: '🌹', eb: '🌼' },
  { whole: 'fish', a: 'orange fish', b: 'blue fish', ea: '🐠', eb: '🐟' },
  { whole: 'pets', a: 'dogs', b: 'cats', ea: '🐶', eb: '🐱' },
] as const;

// --- Small model helpers ------------------------------------------------------

/** A ten frame (or two) with `a` counters then `b` counters. */
export function frameOf(a: number, b = 0, extra: Partial<Extract<ModelState, { model: 'tenFrame' }>> = {}): Extract<ModelState, { model: 'tenFrame' }> {
  const frames: 1 | 2 = a + b > 10 || (extra.tray && a + b + extra.tray.a + extra.tray.b > 10) ? 2 : 1;
  const cells: ('a' | 'b' | null)[] = Array.from({ length: frames * 10 }, (_, i) => (i < a ? 'a' : i < a + b ? 'b' : null));
  return { model: 'tenFrame', frames, cells, ...extra };
}

export const countOf = (cells: ('a' | 'b' | null)[], c: 'a' | 'b') => cells.filter((x) => x === c).length;

export const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

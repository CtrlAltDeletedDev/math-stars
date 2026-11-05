import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import {
  NAMES, SPLITS, THINGS, ask, choiceItem, countOf, doStep, frameOf, last, mix, numberItem, randomInt, range, seeded, show, shuffle,
} from './helpers-world';

// Unit: Story problems.
//
// Every story is heard, then pictured, then solved. The picture is the one a
// teacher would draw for that kind of story -- two colours in a ten frame for
// putting together, counters crossed out for taking from, a number bond with
// a missing part for "some and the rest", two rows lined up for "how many
// more" -- and it fades in practice and is gone in the check.
//
// Within 10 first (lessons 1-5), then within 20 (lesson 6). Take-away lessons
// always mix in some putting-together stories, so a story can never be solved
// by "always subtract" without listening.

// --- Stories ------------------------------------------------------------------

export type StoryKind = 'put' | 'join' | 'take' | 'rest' | 'more' | 'fewer';

/** Is the answer x + y, or x − y? */
export const STORY_OP: Record<StoryKind, 'add' | 'sub'> = {
  put: 'add', join: 'add', take: 'sub', rest: 'sub', more: 'sub', fewer: 'sub',
};

export interface Story {
  id: string;
  kind: StoryKind;
  x: number;
  y: number;
  /** The story, then its question, spoken. */
  say: string;
  /** The question as a clause, for "which number sentence shows ...". */
  clause: string;
  /** The story, short, with its numbers. */
  prompt: string;
  answer: number;
  hint: string;
  picture: ModelState;
  /** The number sentence a teacher would write for it. */
  sentence: string;
}

const KIND_SEED: Record<StoryKind, number> = { put: 1, join: 2, take: 3, rest: 4, more: 5, fewer: 6 };

/**
 * The story for kind and numbers. For put and join, x and y are the two
 * parts; for the rest, x is the whole (or the bigger amount) and y the part
 * that is known (or the smaller amount).
 */
export function story(kind: StoryKind, x: number, y: number): Story {
  const seed = x * 7 + y * 3 + KIND_SEED[kind];
  const n = seeded(NAMES, seed);
  const n2 = seeded(NAMES, seed + 7);
  const t = seeded(THINGS, seed);
  const s = seeded(SPLITS, seed);
  const id = `story-${kind}-${x}-${y}`;
  const base = { id, kind, x, y };
  switch (kind) {
    case 'put':
      return {
        ...base,
        say: `${n} has ${x} ${s.a} and ${y} ${s.b}. How many ${s.whole} does ${n} have in all?`,
        clause: `how many ${s.whole} ${n} has in all`,
        prompt: `${x} ${s.ea} and ${y} ${s.eb}. How many in all?`,
        answer: x + y,
        hint: 'Put both parts together. Start at the bigger part and count on.',
        picture: frameOf(x, y),
        sentence: `${x} + ${y} = ?`,
      };
    case 'join':
      return {
        ...base,
        say: `${n} has ${x} ${t.noun}. ${n} gets ${y} more. How many ${t.noun} does ${n} have now?`,
        clause: `how many ${t.noun} ${n} has now`,
        prompt: `${n}: ${x} ${t.emoji}, gets ${y} more. How many now?`,
        answer: x + y,
        hint: `${n} gets more, so there will be more. Start at ${x} and count on ${y}.`,
        picture: frameOf(x, y),
        sentence: `${x} + ${y} = ?`,
      };
    case 'take':
      return {
        ...base,
        say: `${n} has ${x} ${t.noun}. ${n} gives ${y} to a friend. How many ${t.noun} does ${n} have left?`,
        clause: `how many ${t.noun} ${n} has left`,
        prompt: `${n}: ${x} ${t.emoji}, gives away ${y}. How many left?`,
        answer: x - y,
        hint: `Some go away, so there will be fewer. Start at ${x} and count back ${y}.`,
        picture: frameOf(x, 0, { crossed: range(x - y, x - 1) }),
        sentence: `${x} − ${y} = ?`,
      };
    case 'rest':
      return {
        ...base,
        say: `${n} has ${x} ${s.whole}. ${y} are ${s.a}. The rest are ${s.b}. How many ${s.b} does ${n} have?`,
        clause: `how many ${s.b} ${n} has`,
        prompt: `${x} ${s.whole}. ${y} are ${s.ea}. How many ${s.eb}?`,
        answer: x - y,
        hint: `${x} is all of them. Start at ${y} and count up to ${x}.`,
        picture: { model: 'bond', whole: x, parts: [y, null] },
        sentence: `${y} + ? = ${x}`,
      };
    case 'more':
      return {
        ...base,
        say: `${n} has ${x} ${t.noun}. ${n2} has ${y} ${t.noun}. How many more ${t.noun} does ${n} have than ${n2}?`,
        clause: `how many more ${t.noun} ${n} has than ${n2}`,
        prompt: `${n}: ${x} ${t.emoji}. ${n2}: ${y} ${t.emoji}. How many more for ${n}?`,
        answer: x - y,
        hint: `Line them up, one with one. Count the ones ${n} has with no partner.`,
        picture: { model: 'compare', rows: [{ emoji: t.emoji, count: x }, { emoji: t.emoji, count: y }], matched: true },
        sentence: `${x} − ${y} = ?`,
      };
    case 'fewer':
      return {
        ...base,
        say: `${n} has ${x} ${t.noun}. ${n2} has ${y} ${t.noun}. How many fewer ${t.noun} does ${n2} have than ${n}?`,
        clause: `how many fewer ${t.noun} ${n2} has than ${n}`,
        prompt: `${n}: ${x} ${t.emoji}. ${n2}: ${y} ${t.emoji}. How many fewer for ${n2}?`,
        answer: x - y,
        hint: `Line them up. How many more would ${n2} need to catch up with ${n}?`,
        picture: { model: 'compare', rows: [{ emoji: t.emoji, count: x }, { emoji: t.emoji, count: y }], matched: true },
        sentence: `${y} + ? = ${x}`,
      };
  }
}

/** Fresh numbers for a story, with every number in it from `lo` to `hi`. */
export function operands(kind: StoryKind, lo: number, hi: number): [number, number] {
  if (STORY_OP[kind] === 'add') {
    const total = randomInt(Math.max(lo, 4), hi);
    const x = randomInt(2, total - 2);
    return [x, total - x];
  }
  const x = randomInt(Math.max(lo, 4), hi);
  return [x, randomInt(2, x - 1)];
}

/** The story, answered on the number pad. */
export function storyItem(kind: StoryKind, x: number, y: number): Item {
  const st = story(kind, x, y);
  return numberItem({ id: st.id, say: st.say, prompt: st.prompt, answer: st.answer, hint: st.hint, picture: st.picture });
}

const spokenSentence = (s: string) =>
  s.replace(/\+/g, 'plus').replace(/−/g, 'minus').replace(/\?/g, 'what').replace(/=/g, 'equals');

const sentenceChoice = (s: string): Choice => ({ value: s, label: s, say: spokenSentence(s) });

/**
 * The number sentences a child might write with the story's two numbers. The
 * right one solves to the answer; every wrong one solves to something else
 * (usually the other operation), so exactly one is right. When the right one
 * has a minus, so does one wrong one: "the only one with a minus" is no tell.
 */
export function wrongSentences(kind: StoryKind, x: number, y: number): string[] {
  if (STORY_OP[kind] === 'add') {
    const b = Math.max(x, y), s = Math.min(x, y);
    return shuffle([`${b} − ${s} = ?`, `${s} + ? = ${b}`, `${b} − ? = ${s}`, `? + ${s} = ${b}`]).slice(0, 3);
  }
  // The telling mistake first: adding the two numbers because they are there.
  return [`${x} + ${y} = ?`, `? − ${y} = ${x}`, ...shuffle([`${y} + ${x} = ?`, `${x} + ? = ${y}`])];
}

export function sentenceItem(kind: StoryKind, x: number, y: number): Item {
  const st = story(kind, x, y);
  return choiceItem({
    id: `${st.id}-eq`,
    say: `${st.say.replace(/ [^.]*\?$/, '')} Which number sentence shows ${st.clause}?`,
    prompt: `${st.prompt.replace(/ [^.]*\?$/, '')} Which one?`,
    answer: sentenceChoice(st.sentence),
    wrong: wrongSentences(kind, x, y).map(sentenceChoice),
    hint: STORY_OP[kind] === 'add'
      ? 'Are two groups going together? Then you are finding the whole.'
      : 'Is a part going away, or missing? Then you are finding a part, not the whole.',
  });
}

const fresh = (kinds: StoryKind[], lo: number, hi: number, as: (k: StoryKind, x: number, y: number) => Item = storyItem) => () => {
  const kind = kinds[randomInt(0, kinds.length - 1)];
  const [x, y] = operands(kind, lo, hi);
  return as(kind, x, y);
};

// --- Lessons --------------------------------------------------------------------

const UNTIL = (n: number, what: string, have: number) =>
  have < n ? `Keep going: ${n} ${what} in all.` : `That's too many ${what}. Tap one to take it back.`;

const putTogether: Lesson = {
  id: 'stories-put-together',
  title: 'Put them together',
  goal: 'Solve "in all" stories within 10 by putting two parts together.',
  standard: '1.OA.1',
  emoji: '🍎',
  teach: [
    show('Molly has 4 red apples and 3 green apples. How many apples does Molly have in all?', '4 🍎 and 3 🍏',
      { model: 'bond', whole: null, parts: [4, 3] }),
    show('The red apples are one part. The green apples are the other part.', 'part 4, part 3',
      { model: 'bond', whole: null, parts: [4, 3] }),
    show('In all means both parts together. Start at 4 and count on: 5, 6, 7.', '4 + 3 = 7',
      { model: 'bond', whole: 7, parts: [4, 3] }),
    show('Molly has 7 apples in all. The whole goes on top.', 'whole: 7',
      { model: 'bond', whole: 7, parts: [4, 3] }),
    doStep({
      say: 'Leo has 5 bears and 2 bunnies. Tap the boxes to put in the 5 bears, then the 2 bunnies.',
      caption: '5 🧸 and 2 🐰',
      model: frameOf(0, 0, { tray: { a: 5, b: 2 } }),
      solution: frameOf(5, 2, { tray: { a: 0, b: 0 } }),
      goal: (s) => countOf(s.cells, 'a') === 5 && countOf(s.cells, 'b') === 2,
      hint: (s) => (countOf(s.cells, 'a') < 5 ? 'Tap empty boxes until all 5 bears are in.' : 'Now tap to put in the 2 bunnies.'),
      then: '5 bears and 2 bunnies. Count them all: 7 animals in all.',
    }),
    doStep({
      say: 'Jack has 2 cats and 5 dogs, 7 pets in all. Move 2 counters to the cats side.',
      caption: '2 🐱 and 5 🐶',
      model: { model: 'bond', whole: 7, parts: [null, null], counters: true, split: 0 },
      solution: { model: 'bond', whole: 7, parts: [2, 5], counters: true, split: 2 },
      goal: (s) => s.split === 2,
      hint: (s) => ((s.split ?? 0) < 2 ? 'Move counters to the cats side until there are 2.' : 'Only 2 cats. Move some back to the dogs side.'),
      then: '2 cats and 5 dogs make 7. And 5 and 2 make 7 too: any order.',
    }),
    ask(storyItem('put', 3, 4)),
  ],
  practice: fresh(['put'], 4, 10),
};

const addingTo: Lesson = {
  id: 'stories-adding-to',
  title: 'Some more come',
  goal: 'Solve "gets more" stories within 10 by counting on.',
  standard: '1.OA.1',
  emoji: '🎈',
  teach: [
    show('Nora has 5 balloons.', '5 🎈', frameOf(5)),
    show('Then Nora gets 3 more balloons.', '5, then 3 more', frameOf(5, 3)),
    show('Nora had 5. Start at 5 and count on the new ones: 6, 7, 8.', '5 + 3 = 8', frameOf(5, 3)),
    show('Now Nora has 8 balloons. Getting more makes the number bigger.', '8 🎈', frameOf(5, 3)),
    doStep({
      say: 'Eli has 6 cookies. Eli gets 2 more. Tap to put in the 2 more.',
      caption: '6 🍪, 2 more',
      model: frameOf(6, 0, { tray: { a: 0, b: 2 } }),
      solution: frameOf(6, 2, { tray: { a: 0, b: 0 } }),
      goal: (s) => countOf(s.cells, 'b') === 2,
      hint: (s) => UNTIL(2, 'new cookies', countOf(s.cells, 'b')),
      then: 'Start at 6 and count on: 7, 8. Eli has 8 cookies now.',
    }),
    doStep({
      say: 'Priya has 4 stickers and gets 3 more. Tap 4 to start, then make 3 hops.',
      caption: '4, then 3 more',
      model: { model: 'numberLine', min: 0, max: 10, start: null, path: [] },
      solution: { model: 'numberLine', min: 0, max: 10, start: 4, path: [5, 6, 7] },
      goal: (s) => s.start === 4 && s.path.length === 3 && last(s.path) === 7,
      hint: (s) => (s.start !== 4 ? 'Tap 4 first: Priya starts with 4 stickers.' : 'Hop forward one at a time: 3 hops.'),
      then: '4, then 5, 6, 7. Priya has 7 stickers now.',
    }),
    ask(storyItem('join', 6, 3)),
  ],
  practice: mix([3, fresh(['join'], 4, 10)], [1, fresh(['put'], 4, 10)]),
};

const takingFrom: Lesson = {
  id: 'stories-taking-from',
  title: 'Some go away',
  goal: 'Solve "gives away" stories within 10 by taking away, and tell them from "in all" stories.',
  standard: '1.OA.1',
  emoji: '🍪',
  teach: [
    show('Max has 8 cookies.', '8 🍪', frameOf(8, 0, { crossed: [] })),
    show('Max eats 3 of the cookies. Cross out 3.', '8, take away 3', frameOf(8, 0, { crossed: [7, 6, 5] })),
    show('Count the cookies that are left: 1, 2, 3, 4, 5.', '8 − 3 = 5', frameOf(8, 0, { crossed: [7, 6, 5] })),
    show('Max has 5 cookies left. Taking away makes the number smaller.', '5 left', frameOf(8, 0, { crossed: [7, 6, 5] })),
    doStep({
      say: 'Lucy has 9 shells. Lucy gives 4 to a friend. Tap 4 shells to cross them out.',
      caption: '9 🐚, give away 4',
      model: frameOf(9, 0, { takeAway: true, crossed: [] }),
      solution: frameOf(9, 0, { takeAway: true, crossed: [8, 7, 6, 5] }),
      goal: (s) => (s.crossed ?? []).length === 4,
      hint: (s) => UNTIL(4, 'crossed out', (s.crossed ?? []).length),
      then: '9 take away 4. Count the ones left: 5 shells.',
    }),
    doStep({
      say: 'Theo has 7 marbles. Theo loses 2. Tap 7 to start, then hop back 2.',
      caption: '7, lose 2',
      model: { model: 'numberLine', min: 0, max: 10, start: null, path: [] },
      solution: { model: 'numberLine', min: 0, max: 10, start: 7, path: [6, 5] },
      goal: (s) => s.start === 7 && s.path.length === 2 && last(s.path) === 5,
      hint: (s) => (s.start !== 7 ? 'Tap 7 first: Theo starts with 7.' : 'Losing marbles means fewer: hop back toward 0, 2 hops.'),
      then: '7, then 6, 5. Theo has 5 marbles left.',
    }),
    ask(storyItem('take', 10, 3)),
  ],
  // Mostly taking away, with "gets more" mixed in so she has to listen.
  practice: mix([3, fresh(['take'], 4, 10)], [1, fresh(['join', 'put'], 4, 10)]),
};

const someAndTheRest: Lesson = {
  id: 'stories-some-and-the-rest',
  title: 'Some and the rest',
  goal: 'Find the missing part when a story gives the whole and one part, within 10.',
  standard: '1.OA.1',
  emoji: '⚽',
  teach: [
    show('Rhett has 9 balls. 5 are soccer balls. The rest are basketballs.', '9 balls, 5 ⚽',
      { model: 'bond', whole: 9, parts: [5, null] }),
    show('9 is all the balls. All of them is the whole, on top.', 'whole: 9',
      { model: 'bond', whole: 9, parts: [5, null] }),
    show('The soccer balls are one part. The basketballs are the missing part.', '5 and ? make 9',
      { model: 'bond', whole: 9, parts: [5, null] }),
    show('5 and what make 9? Count up from 5: 6, 7, 8, 9. That is 4 more.', '5 + 4 = 9',
      { model: 'bond', whole: 9, parts: [5, 4] }),
    show('Rhett has 4 basketballs. A part is never more than the whole.', '4 🏀',
      { model: 'bond', whole: 9, parts: [5, 4] }),
    doStep({
      say: 'Sally has 8 flowers. 3 are red, and the rest are yellow. Move 3 counters to the red side.',
      caption: '8 flowers, 3 🌹',
      model: { model: 'bond', whole: 8, parts: [null, null], counters: true, split: 0 },
      solution: { model: 'bond', whole: 8, parts: [3, 5], counters: true, split: 3 },
      goal: (s) => s.split === 3,
      hint: (s) => ((s.split ?? 0) < 3 ? 'Move counters to the red side until there are 3.' : 'Only 3 are red. Move some back.'),
      then: '3 red. The rest are yellow: count them, 5. 3 and 5 make 8.',
    }),
    doStep({
      say: 'Harry has 10 pets. 6 are dogs. The rest are cats. Show the 6 dogs.',
      caption: '10 pets, 6 🐶',
      model: { model: 'bond', whole: 10, parts: [null, null], counters: true, split: 0 },
      solution: { model: 'bond', whole: 10, parts: [6, 4], counters: true, split: 6 },
      goal: (s) => s.split === 6,
      hint: (s) => ((s.split ?? 0) < 6 ? 'Move counters to the dogs side until there are 6.' : 'Only 6 are dogs. Move some back.'),
      then: '6 dogs, so the rest, 4, are cats. 6 and 4 make 10.',
    }),
    ask(storyItem('rest', 7, 2)),
  ],
  // One in four is "in all", so the rest is never "always take away".
  practice: mix([3, fresh(['rest'], 5, 10)], [1, fresh(['put'], 5, 10)]),
};

const howManyMore: Lesson = {
  id: 'stories-how-many-more',
  title: 'How many more?',
  goal: 'Compare two amounts within 10: how many more, and how many fewer.',
  standard: '1.OA.1',
  emoji: '🚗',
  teach: [
    show('Leo has 7 toy cars. Mia has 4 toy cars.', 'Leo 7, Mia 4',
      { model: 'compare', rows: [{ emoji: '🚗', count: 7 }, { emoji: '🚗', count: 4 }] }),
    show('Line them up, one of Leo\'s cars with one of Mia\'s.', 'match them up',
      { model: 'compare', rows: [{ emoji: '🚗', count: 7 }, { emoji: '🚗', count: 4 }], matched: true }),
    show('3 of Leo\'s cars have no partner. Leo has 3 more cars than Mia.', '7 − 4 = 3',
      { model: 'compare', rows: [{ emoji: '🚗', count: 7 }, { emoji: '🚗', count: 4 }], matched: true }),
    show('So Mia has 3 fewer cars than Leo. More and fewer: the same 3.', '3 more, 3 fewer',
      { model: 'compare', rows: [{ emoji: '🚗', count: 7 }, { emoji: '🚗', count: 4 }], matched: true }),
    doStep({
      say: 'Ruby has 8 shells. Jack has 5 shells. Tap Jack\'s 5, then hop up to Ruby\'s 8.',
      caption: 'Ruby 8, Jack 5',
      model: { model: 'numberLine', min: 0, max: 10, start: null, path: [] },
      solution: { model: 'numberLine', min: 0, max: 10, start: 5, path: [6, 7, 8] },
      goal: (s) => s.start === 5 && last(s.path) === 8,
      hint: (s) => (s.start !== 5 ? 'Start at Jack\'s number: 5.' : 'Hop forward until you land on Ruby\'s 8.'),
      then: '3 hops from 5 to 8. Ruby has 3 more shells than Jack.',
    }),
    doStep({
      say: 'Ava has 6 stickers. Omar has 9. Give Ava more stickers until Ava has as many as Omar.',
      caption: 'Ava 6, Omar 9',
      model: frameOf(6, 0, { tray: { a: 0, b: 5 } }),
      solution: frameOf(6, 3, { tray: { a: 0, b: 2 } }),
      goal: (s) => countOf(s.cells, 'a') + countOf(s.cells, 'b') === 9,
      hint: (s) => UNTIL(9, 'stickers', countOf(s.cells, 'a') + countOf(s.cells, 'b')),
      then: 'Ava needed 3 more to match. So Omar has 3 more than Ava.',
    }),
    ask(storyItem('fewer', 9, 6)),
  ],
  practice: fresh(['more', 'fewer'], 4, 10),
};

const numberSentence: Lesson = {
  id: 'stories-number-sentence',
  title: 'Which number sentence?',
  goal: 'Solve every kind of story within 20, and choose the number sentence that matches a story.',
  standard: '1.OA.1',
  emoji: '📝',
  teach: [
    show('Zoe has 12 shells. Zoe gives 5 away. How many shells are left?', '12 🐚, 5 go away',
      { model: 'text', text: '12 🐚 − 5', tone: 'plain' }),
    show('Some go away, so we take away: 12 minus 5.', '12 − 5 = ?',
      { model: 'text', text: '12 − 5 = ?', tone: 'minus' }),
    show('Not 12 plus 5! Adding would give Zoe more shells, not fewer.', '12 + 5 ✗',
      { model: 'text', text: '12 + 5 ✗', tone: 'plain' }),
    show('Kenna has 9 red apples and 6 green apples. In all means both parts together.', '9 + 6 = ?',
      { model: 'text', text: '9 + 6 = ?', tone: 'plus' }),
    doStep({
      say: 'Solve Zoe\'s story. Tap 12, then hop back 5.',
      caption: '12 − 5',
      model: { model: 'numberLine', min: 0, max: 20, start: null, path: [] },
      solution: { model: 'numberLine', min: 0, max: 20, start: 12, path: [11, 10, 9, 8, 7] },
      goal: (s) => s.start === 12 && s.path.length === 5 && last(s.path) === 7,
      hint: (s) => (s.start !== 12 ? 'Zoe starts with 12. Tap 12 first.' : 'Hop back toward 0, one for each shell Zoe gives away: 5 hops.'),
      then: '12 − 5 = 7. Zoe has 7 shells left.',
    }),
    doStep({
      say: 'Kenna has 15 apples. 9 are red. Show the 9 red ones on this side.',
      caption: '15 apples, 9 🍎',
      model: { model: 'bond', whole: 15, parts: [null, null], counters: true, split: 0 },
      solution: { model: 'bond', whole: 15, parts: [9, 6], counters: true, split: 9 },
      goal: (s) => s.split === 9,
      hint: (s) => ((s.split ?? 0) < 9 ? 'Move counters to the red side until there are 9.' : 'Only 9 are red. Move some back.'),
      then: '9 red and 6 green make 15. So 9 + 6 = 15, and 15 − 9 = 6.',
    }),
    ask(sentenceItem('rest', 14, 8)),
  ],
  practice: mix(
    [4, fresh(['put', 'join', 'take', 'rest', 'more', 'fewer'], 8, 20, sentenceItem)],
    [1, fresh(['put', 'join', 'take', 'rest', 'more', 'fewer'], 8, 20)],
  ),
  check: mix(
    [1, fresh(['put', 'join', 'take', 'rest', 'more', 'fewer'], 8, 20, sentenceItem)],
    [1, fresh(['put', 'join', 'take', 'rest', 'more', 'fewer'], 8, 20)],
  ),
};

export const UNIT: Unit = {
  id: 'stories',
  title: 'Story problems',
  emoji: '📖',
  about: 'Putting together, adding to, taking from, some and the rest, and how many more: stories she hears, pictures, then solves. Within 10, then 20.',
  colour: '#8D6E63',
  lessons: [putTogether, addingTo, takingFrom, someAndTheRest, howManyMore, numberSentence],
};

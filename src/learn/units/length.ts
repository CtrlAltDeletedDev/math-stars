import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { ask, choiceItem, doStep, mix, numberItem, randomInt, seeded, show, shuffle } from './helpers-world';

// Unit: Measuring length.
//
// Compare first, by lining two things up at one end (the step children
// skip). Then order three, and see that if the ribbon beats the pencil and
// the pencil beats the crayon, the ribbon beats the crayon. Then measure: the
// same unit laid end to end, starting at the end, no gaps and no overlaps --
// and a picture with gaps, to see why that gives the wrong number.

type Measure = Extract<ModelState, { model: 'measure' }>;

export interface Thing { name: string; emoji: string }

export const THINGS: Thing[] = [
  { name: 'pencil', emoji: '✏️' },
  { name: 'crayon', emoji: '🖍️' },
  { name: 'ribbon', emoji: '🎀' },
  { name: 'snake', emoji: '🐍' },
  { name: 'spoon', emoji: '🥄' },
  { name: 'key', emoji: '🔑' },
  { name: 'worm', emoji: '🪱' },
  { name: 'carrot', emoji: '🥕' },
  { name: 'train', emoji: '🚂' },
  { name: 'paintbrush', emoji: '🖌️' },
];

const CUBE = '🟩';

export const measure = (t: Thing, length: number, placed = 0, extra: Partial<Measure> = {}): Measure =>
  ({ model: 'measure', object: t.emoji, length, unit: CUBE, placed, ...extra });

const thingChoice = (t: Thing, length: number): Choice =>
  ({ value: t.name, label: `${t.emoji} ${t.name}`, say: `the ${t.name}`, model: measure(t, length, length) });

/** Different things, picked from a seed. */
function things(n: number, seed: number): Thing[] {
  const out: Thing[] = [];
  for (let i = 0; out.length < n; i++) {
    const t = seeded(THINGS, seed + i * 3);
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** Distinct lengths, at least 2 apart, so the difference can be seen. */
function lengths(n: number): number[] {
  for (;;) {
    const ls = Array.from({ length: n }, () => randomInt(2, 12));
    const s = [...ls].sort((a, b) => a - b);
    if (s.every((v, i) => i === 0 || v - s[i - 1] >= 2)) return ls;
  }
}

const layStep = (t: Thing, length: number, say: string, then: string) => doStep({
  say,
  caption: `${t.emoji} ${t.name}`,
  model: measure(t, length),
  solution: measure(t, length, length),
  goal: (s) => s.placed === length,
  hint: (s) => (s.placed < length ? `Keep laying cubes, end to end, until you reach the other end of the ${t.name}.` : `That goes past the end of the ${t.name}. Take one back.`),
  then,
});

// --- 1. Longer and shorter ----------------------------------------------------------

function longerShorter(): Item {
  const [a, b] = lengths(2);
  const [ta, tb] = things(2, a * 5 + b);
  const longer = Math.random() < 0.5;
  const right = longer === a > b ? 0 : 1;
  const pair = [thingChoice(ta, a), thingChoice(tb, b)];
  return choiceItem({
    id: `length-${longer ? 'longer' : 'shorter'}-${ta.name}-${a}-${tb.name}-${b}`,
    say: longer ? `Which is longer, the ${ta.name} or the ${tb.name}?` : `Which is shorter, the ${ta.name} or the ${tb.name}?`,
    prompt: longer ? 'Which is longer?' : 'Which is shorter?',
    answer: pair[right],
    wrong: [pair[1 - right]],
    hint: 'Line them up at one end. See which one goes further.',
  });
}

const longerAndShorter: Lesson = {
  id: 'length-longer-shorter',
  title: 'Longer and shorter',
  goal: 'Compare two lengths by lining them up at one end, and say which is longer and which is shorter.',
  standard: '1.MD.1',
  emoji: '📏',
  teach: [
    show('Here are two cube trains, a green one and a blue one. Which is longer?', 'green and blue',
      { model: 'compare', rows: [{ emoji: '🟩', count: 7 }, { emoji: '🟦', count: 4 }] }),
    show('Line them up so they start at the same place.', 'start together',
      { model: 'compare', rows: [{ emoji: '🟩', count: 7 }, { emoji: '🟦', count: 4 }], matched: true }),
    show('The green train goes further. Green is longer. Blue is shorter.', 'green longer, blue shorter',
      { model: 'compare', rows: [{ emoji: '🟩', count: 7 }, { emoji: '🟦', count: 4 }], matched: true }),
    show('If the ends do not start together, your eyes can be fooled. Always line up one end first.', 'line up one end',
      { model: 'compare', rows: [{ emoji: '🟩', count: 7 }, { emoji: '🟦', count: 4 }], matched: true }),
    layStep(THINGS[0], 7, 'Measure the pencil. Tap to lay cubes end to end, from one end of the pencil.', 'The pencil is 7 cubes long.'),
    layStep(THINGS[1], 4, 'Now measure the crayon.', 'The crayon is 4 cubes long. 7 is more than 4, so the pencil is longer.'),
  ],
  practice: longerShorter,
};

// --- 2. Shortest to longest -----------------------------------------------------------

function longestShortest(): Item {
  const ls = lengths(3);
  const ts = things(3, ls[0] + ls[1] * 2 + ls[2] * 3);
  const longest = Math.random() < 0.5;
  const pick = ls.indexOf(longest ? Math.max(...ls) : Math.min(...ls));
  const cs = ts.map((t, i) => thingChoice(t, ls[i]));
  return choiceItem({
    id: `length-${longest ? 'longest' : 'shortest'}-${ts.map((t, i) => `${t.name}-${ls[i]}`).join('-')}`,
    say: longest ? 'Which one is the longest?' : 'Which one is the shortest?',
    prompt: longest ? 'Which is longest?' : 'Which is shortest?',
    answer: cs[pick],
    wrong: cs.filter((_, i) => i !== pick),
    hint: 'Line them up at one end. Find the one that goes furthest, or the least far.',
  });
}

/** "The ribbon is longer than the pencil. The pencil is longer than the crayon." -- heard, not seen. */
function chain(): Item {
  const seed = randomInt(0, 99);
  const [a, b, c] = things(3, seed); // a > b > c
  const longest = Math.random() < 0.5;
  const choice = (t: Thing): Choice => ({ value: t.name, label: `${t.emoji} ${t.name}` });
  const [first, second] = Math.random() < 0.5
    ? [`The ${a.name} is longer than the ${b.name}.`, `The ${b.name} is longer than the ${c.name}.`]
    : [`The ${c.name} is shorter than the ${b.name}.`, `The ${b.name} is shorter than the ${a.name}.`];
  return choiceItem({
    id: `length-chain-${longest ? 'longest' : 'shortest'}-${a.name}-${b.name}-${c.name}-${first.includes('longer') ? 'l' : 's'}`,
    say: `${first} ${second} Which is the ${longest ? 'longest' : 'shortest'}?`,
    prompt: `${first} ${second} ${longest ? 'Longest?' : 'Shortest?'}`,
    answer: choice(longest ? a : c),
    wrong: shuffle([b, longest ? c : a]).map(choice),
    hint: 'Put them in order one at a time, the way the words say.',
  });
}

const shortestToLongest: Lesson = {
  id: 'length-order-three',
  title: 'Shortest to longest',
  goal: 'Order three things by length, and compare two things by using a third.',
  standard: '1.MD.1',
  emoji: '🪜',
  teach: [
    show('Three things: a ribbon, a crayon and a pencil. Here they are as cube trains, lined up at one end.', 'ribbon, crayon, pencil',
      { model: 'graph', rows: [{ emoji: '🟥', label: 'ribbon', count: 9 }, { emoji: '🟨', label: 'crayon', count: 4 }, { emoji: '🟦', label: 'pencil', count: 6 }] }),
    show('The crayon stops first. The crayon is the shortest.', 'shortest: crayon',
      { model: 'graph', rows: [{ emoji: '🟥', label: 'ribbon', count: 9 }, { emoji: '🟨', label: 'crayon', count: 4 }, { emoji: '🟦', label: 'pencil', count: 6 }] }),
    show('The ribbon goes furthest. The ribbon is the longest. The pencil is in the middle.', 'longest: ribbon',
      { model: 'graph', rows: [{ emoji: '🟥', label: 'ribbon', count: 9 }, { emoji: '🟨', label: 'crayon', count: 4 }, { emoji: '🟦', label: 'pencil', count: 6 }] }),
    show('Shortest to longest: crayon, pencil, ribbon.', 'crayon, pencil, ribbon',
      { model: 'graph', rows: [{ emoji: '🟨', label: 'crayon', count: 4 }, { emoji: '🟦', label: 'pencil', count: 6 }, { emoji: '🟥', label: 'ribbon', count: 9 }] }),
    show('The ribbon is longer than the pencil, and the pencil is longer than the crayon. So the ribbon is longer than the crayon too!', 'ribbon > pencil > crayon',
      { model: 'graph', rows: [{ emoji: '🟨', label: 'crayon', count: 4 }, { emoji: '🟦', label: 'pencil', count: 6 }, { emoji: '🟥', label: 'ribbon', count: 9 }] }),
    layStep(THINGS[2], 9, 'Measure the ribbon with cubes.', 'The ribbon is 9 cubes long, the longest of the three.'),
    doStep({
      say: 'Make the yarn the longest of all. Add cubes until the yarn is longer than the ribbon.',
      caption: 'longer than 9',
      model: { model: 'graph', rows: [{ emoji: '🟥', label: 'ribbon', count: 9 }, { emoji: '🟪', label: 'yarn', count: 3 }], max: 12 },
      solution: { model: 'graph', rows: [{ emoji: '🟥', label: 'ribbon', count: 9 }, { emoji: '🟪', label: 'yarn', count: 10 }], max: 12 },
      goal: (s) => s.rows[0].count === 9 && s.rows[1].count > 9,
      hint: (s) => (s.rows[0].count !== 9 ? 'Leave the ribbon as it is: add to the yarn.' : 'Keep adding to the yarn until it goes past the end of the ribbon.'),
      then: 'Now the yarn goes further than the ribbon. The yarn is the longest.',
    }),
  ],
  practice: longestShortest,
  check: mix([1, longestShortest], [1, chain]),
};

// --- 3. Measuring with cubes -----------------------------------------------------------------

function howLong(): Item {
  const len = randomInt(2, 12);
  const t = seeded(THINGS, len * 7 + randomInt(0, 9));
  return numberItem({
    id: `length-measure-${t.name}-${len}`,
    say: `How many cubes long is the ${t.name}?`,
    prompt: 'How many cubes long?',
    answer: len,
    figure: measure(t, len, len),
    hint: 'Touch each cube as you count, from one end to the other.',
  });
}

function fairMeasureItem(len: number): Item {
  const t = seeded(THINGS, len);
  const right: Choice = { value: 'end-to-end', label: '', say: 'cubes end to end', model: measure(t, len, len) };
  const gappy: Choice = { value: 'gaps', label: '', say: 'cubes with gaps', model: measure(t, len, len - 2, { gaps: true }) };
  return choiceItem({
    id: `length-fair-${t.name}-${len}`,
    say: `Which one measures the ${t.name} the right way?`,
    prompt: 'Which is measured right?',
    answer: right,
    wrong: [gappy],
    hint: 'Cubes must touch, end to end, with no gaps.',
  });
}

const fairMeasure = () => fairMeasureItem(randomInt(4, 10));

const measuring: Lesson = {
  id: 'length-measure-with-cubes',
  title: 'Measuring with cubes',
  goal: 'Measure a length by laying same-size units end to end, with no gaps or overlaps.',
  standard: '1.MD.2',
  emoji: '🟩',
  teach: [
    show('How long is this spoon? Let\'s measure it with cubes.', '🥄', measure(THINGS[4], 6)),
    show('Start right at the end of the spoon. Lay the cubes end to end: 1, 2, 3.', '1, 2, 3', measure(THINGS[4], 6, 3)),
    show('Keep going to the other end: 4, 5, 6.', '6 cubes long', measure(THINGS[4], 6, 6)),
    show('These cubes have gaps. Gaps make the count too small: only 4! That is not the right way.', 'gaps ✗', measure(THINGS[4], 6, 4, { gaps: true })),
    show('Start at the end, no gaps, no overlaps. The spoon is 6 cubes long.', '6 cubes ✓', measure(THINGS[4], 6, 6)),
    layStep(THINGS[5], 4, 'Measure the key. Start at the end and lay cubes with no gaps.', 'The key is 4 cubes long.'),
    layStep(THINGS[7], 8, 'Now measure the carrot.', 'The carrot is 8 cubes long. The carrot is longer than the key.'),
    ask(fairMeasureItem(7)),
  ],
  practice: howLong,
  check: mix([3, howLong], [1, fairMeasure]),
};

// --- 4. How much longer? -----------------------------------------------------------------------

function howMuchLonger(pictured: boolean) {
  return (): Item => {
    const [a, b] = lengths(2).sort((x, y) => y - x);
    const [ta, tb] = things(2, a * 3 + b);
    const longer = Math.random() < 0.5;
    return numberItem({
      id: `length-diff-${longer ? 'longer' : 'shorter'}-${ta.name}-${a}-${tb.name}-${b}`,
      say: longer
        ? `The ${ta.name} is ${a} cubes long. The ${tb.name} is ${b} cubes long. How many cubes longer is the ${ta.name}?`
        : `The ${ta.name} is ${a} cubes long. The ${tb.name} is ${b} cubes long. How many cubes shorter is the ${tb.name}?`,
      prompt: `${ta.emoji} ${a} cubes, ${tb.emoji} ${b} cubes. How many ${longer ? 'longer' : 'shorter'}?`,
      answer: a - b,
      hint: `Line them up. Count the cubes the ${ta.name} has past the end of the ${tb.name}.`,
      picture: pictured ? { model: 'compare', rows: [{ emoji: '🟩', count: a }, { emoji: '🟦', count: b }], matched: true } : undefined,
    });
  };
}

const howMuch: Lesson = {
  id: 'length-how-much-longer',
  title: 'How much longer?',
  goal: 'Compare two measured lengths: how many units longer or shorter.',
  standard: '1.MD.2',
  emoji: '🐛',
  teach: [
    show('The worm is 8 cubes long. The snake is 5 cubes long.', 'worm 8, snake 5',
      { model: 'compare', rows: [{ emoji: '🟩', count: 8 }, { emoji: '🟦', count: 5 }] }),
    show('Line them up at one end.', 'start together',
      { model: 'compare', rows: [{ emoji: '🟩', count: 8 }, { emoji: '🟦', count: 5 }], matched: true }),
    show('The worm has 3 cubes past the end of the snake. The worm is 3 cubes longer.', '8 − 5 = 3',
      { model: 'compare', rows: [{ emoji: '🟩', count: 8 }, { emoji: '🟦', count: 5 }], matched: true }),
    show('So the snake is 3 cubes shorter than the worm.', '3 shorter',
      { model: 'compare', rows: [{ emoji: '🟩', count: 8 }, { emoji: '🟦', count: 5 }], matched: true }),
    layStep(THINGS[6], 8, 'Measure the worm.', 'The worm is 8 cubes long.'),
    doStep({
      say: 'The snake is 5 cubes. Add cubes to the snake until it is as long as the worm.',
      caption: 'snake 5 → worm 8',
      model: { model: 'graph', rows: [{ emoji: '🟩', label: 'worm', count: 8 }, { emoji: '🟦', label: 'snake', count: 5 }], max: 12 },
      solution: { model: 'graph', rows: [{ emoji: '🟩', label: 'worm', count: 8 }, { emoji: '🟦', label: 'snake', count: 8 }], max: 12 },
      goal: (s) => s.rows[0].count === 8 && s.rows[1].count === 8,
      hint: (s) => (s.rows[1].count < 8 ? 'Keep adding to the snake until its end lines up with the worm.' : 'The snake went past the worm. Take a cube back.'),
      then: 'You added 3 cubes. The worm was 3 cubes longer than the snake.',
    }),
  ],
  practice: howMuchLonger(true),
  check: howMuchLonger(false),
};

export const UNIT: Unit = {
  id: 'length',
  title: 'Measuring length',
  emoji: '📏',
  about: 'Longer and shorter, putting three in order, measuring with cubes laid end to end, and how much longer.',
  colour: '#00897B',
  lessons: [longerAndShorter, shortestToLongest, measuring, howMuch],
};

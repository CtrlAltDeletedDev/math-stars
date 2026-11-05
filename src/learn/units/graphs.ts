import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { any, choiceItem, doStep, mix, modelItem, numberItem, randomInt, show, shuffle, sum } from './helpers-world';

// Unit: Graphs.
//
// A picture graph is counting, organised: one picture for each thing, one row
// for each kind, every row starting at the same edge so the rows can be
// compared by eye. She reads one first, then answers most and fewest, then
// "how many more", which she does by making the short row as long as the
// long one -- and then makes graphs of her own from a few spoken counts.

type Graph = Extract<ModelState, { model: 'graph' }>;
type Row = Graph['rows'][number];

export interface Topic { title: string; rows: { emoji: string; label: string; plural: string }[] }

export const TOPICS: Topic[] = [
  { title: 'favourite fruit', rows: [{ emoji: '🍎', label: 'apple', plural: 'apples' }, { emoji: '🍌', label: 'banana', plural: 'bananas' }, { emoji: '🍇', label: 'grapes', plural: 'grapes' }] },
  { title: 'pets', rows: [{ emoji: '🐶', label: 'dog', plural: 'dogs' }, { emoji: '🐱', label: 'cat', plural: 'cats' }, { emoji: '🐟', label: 'fish', plural: 'fish' }] },
  { title: 'weather', rows: [{ emoji: '☀️', label: 'sunny', plural: 'sunny days' }, { emoji: '🌧️', label: 'rainy', plural: 'rainy days' }, { emoji: '☁️', label: 'cloudy', plural: 'cloudy days' }] },
  { title: 'bugs', rows: [{ emoji: '🐞', label: 'ladybug', plural: 'ladybugs' }, { emoji: '🐝', label: 'bee', plural: 'bees' }, { emoji: '🦋', label: 'butterfly', plural: 'butterflies' }] },
];

const MAX = 10;

export const graph = (topic: Topic, counts: number[]): Graph =>
  ({ model: 'graph', rows: topic.rows.map((r, i): Row => ({ emoji: r.emoji, label: r.label, count: counts[i] })), max: MAX });

export const countsOf = (g: Graph) => g.rows.map((r) => r.count);
const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Three different counts from 1 to 9. */
function distinctCounts(): number[] {
  for (;;) {
    const c = [randomInt(1, 9), randomInt(1, 9), randomInt(1, 9)];
    if (new Set(c).size === 3) return c;
  }
}

const idOf = (kind: string, ti: number, counts: number[], extra = '') => `graph-${kind}-${ti}-${counts.join('-')}${extra}`;

/** What to fix when making the graph show `target`. */
const fixGraph = (topic: Topic, target: number[]) => (s: Graph) => {
  const i = s.rows.findIndex((r, k) => r.count !== target[k]);
  if (i < 0) return 'Check every row.';
  const r = topic.rows[i];
  return s.rows[i].count < target[i]
    ? `The ${r.plural} row needs more. Count the pictures as you tap.`
    : `The ${r.plural} row has too many. Tap a picture to take it off.`;
};

const makeStep = (topic: Topic, from: number[], target: number[], say: string, then: string) => doStep({
  say,
  caption: topic.rows.map((r, i) => `${target[i]} ${r.emoji}`).join(', '),
  model: graph(topic, from),
  solution: graph(topic, target),
  goal: (s) => same(countsOf(s), target),
  hint: fixGraph(topic, target),
  then,
});

// --- 1. Reading a picture graph ---------------------------------------------------------------

function howManyItem(): Item {
  const ti = randomInt(0, TOPICS.length - 1), t = TOPICS[ti];
  const counts = distinctCounts();
  const k = randomInt(0, 2);
  return numberItem({
    id: idOf('count', ti, counts, `-${k}`),
    say: `How many ${t.rows[k].plural} does the graph show?`,
    prompt: `How many ${t.rows[k].emoji}?`,
    answer: counts[k],
    figure: graph(t, counts),
    hint: 'Find that row. Touch each picture as you count.',
  });
}

const fruit = TOPICS[0], pets = TOPICS[1], weather = TOPICS[2], bugs = TOPICS[3];

const reading: Lesson = {
  id: 'graphs-read',
  title: 'Reading a picture graph',
  goal: 'Read how many of each kind a picture graph shows.',
  standard: '1.MD.4',
  emoji: '📊',
  teach: [
    show('Ava\'s class voted for a favourite fruit. Each picture is one child\'s vote.', 'favourite fruit', graph(fruit, [3, 5, 2])),
    show('Count the apple row: 1, 2, 3. 3 children like apples best.', '🍎 3', graph(fruit, [3, 5, 2])),
    show('The banana row: 1, 2, 3, 4, 5. 5 children like bananas.', '🍌 5', graph(fruit, [3, 5, 2])),
    show('And grapes: 2. Each row starts at the same edge, so the rows are easy to compare.', '🍇 2', graph(fruit, [3, 5, 2])),
    makeStep(fruit, [3, 5, 2], [3, 5, 4], 'Two more children vote for grapes. Add their votes to the grapes row.',
      'Now 4 children like grapes.'),
    makeStep(fruit, [3, 5, 4], [4, 5, 4], 'Ruby votes for apples. Add Ruby\'s vote.',
      'Apples have 4 votes now, the same as grapes.'),
  ],
  practice: howManyItem,
};

// --- 2. Most and fewest -------------------------------------------------------------------------

function mostFewest(): Item {
  const ti = randomInt(0, TOPICS.length - 1), t = TOPICS[ti];
  const counts = distinctCounts();
  const most = Math.random() < 0.5;
  const k = counts.indexOf(most ? Math.max(...counts) : Math.min(...counts));
  const c = (i: number): Choice => ({ value: t.rows[i].label, label: `${t.rows[i].emoji} ${t.rows[i].label}`, say: t.rows[i].plural });
  return choiceItem({
    id: idOf(most ? 'most' : 'fewest', ti, counts),
    say: most ? `Which has the most on the graph?` : `Which has the fewest on the graph?`,
    prompt: most ? 'Which has the most?' : 'Which has the fewest?',
    answer: c(k),
    // The other rows: the opposite end is the telling mistake (most mixed up with fewest).
    wrong: [0, 1, 2].filter((i) => i !== k).map(c),
    figure: graph(t, counts),
    hint: most ? 'The most is the longest row.' : 'The fewest is the shortest row.',
  });
}

const mostAndFewest: Lesson = {
  id: 'graphs-most-fewest',
  title: 'Most and fewest',
  goal: 'Find which kind has the most and which has the fewest on a picture graph.',
  standard: '1.MD.4',
  emoji: '🏆',
  teach: [
    show('Here are the pets in Leo\'s class: 4 dogs, 6 cats and 2 fish.', '🐶 4, 🐱 6, 🐟 2', graph(pets, [4, 6, 2])),
    show('Which pet do the most children have? Look for the longest row: cats.', 'most: 🐱', graph(pets, [4, 6, 2])),
    show('Which do the fewest children have? The shortest row: fish.', 'fewest: 🐟', graph(pets, [4, 6, 2])),
    show('Most is the longest row. Fewest is the shortest row. No counting needed!', 'longest, shortest', graph(pets, [4, 6, 2])),
    doStep({
      say: 'Add dogs until dogs have the most.',
      caption: 'dogs: the most',
      model: graph(pets, [2, 4, 3]),
      solution: graph(pets, [5, 4, 3]),
      goal: (s) => s.rows[1].count === 4 && s.rows[2].count === 3 && s.rows[0].count > 4,
      hint: (s) => (s.rows[1].count !== 4 || s.rows[2].count !== 3 ? 'Only add to the dogs row.' : 'Keep adding dogs until the dogs row is longer than the cats row.'),
      then: 'The dogs row is the longest now. Dogs have the most.',
    }),
    doStep({
      say: 'Add bees until there are as many bees as ladybugs.',
      caption: 'bees = ladybugs',
      model: graph(bugs, [6, 3, 2]),
      solution: graph(bugs, [6, 6, 2]),
      goal: (s) => same(countsOf(s), [6, 6, 2]),
      hint: (s) => (s.rows[1].count < 6 ? 'Add to the bees row until it lines up with the ladybugs row.' : s.rows[1].count > 6 ? 'Too many bees. Tap one to take it off.' : 'Only change the bees row.'),
      then: 'The rows line up. Bees and ladybugs are the same: 6 each.',
    }),
  ],
  practice: mostFewest,
};

// --- 3. How many more? --------------------------------------------------------------------------

function compareItem(): Item {
  const ti = randomInt(0, TOPICS.length - 1), t = TOPICS[ti];
  const counts = distinctCounts();
  const kind = any(['more', 'fewer', 'total'] as const);
  if (kind === 'total') {
    return numberItem({
      id: idOf('total', ti, counts),
      say: 'How many are on the graph in all?',
      prompt: 'How many in all?',
      answer: sum(counts),
      figure: graph(t, counts),
      hint: 'Count each row, then put the rows together.',
    });
  }
  const [i, j] = shuffle([0, 1, 2]).slice(0, 2).sort((a, b) => counts[b] - counts[a]); // counts[i] > counts[j]
  const [bi, bj] = [t.rows[i], t.rows[j]];
  return numberItem({
    id: idOf(kind, ti, counts, `-${i}-${j}`),
    say: kind === 'more' ? `How many more ${bi.plural} than ${bj.plural}?` : `How many fewer ${bj.plural} than ${bi.plural}?`,
    prompt: kind === 'more' ? `How many more ${bi.emoji} than ${bj.emoji}?` : `How many fewer ${bj.emoji} than ${bi.emoji}?`,
    answer: counts[i] - counts[j],
    figure: graph(t, counts),
    hint: 'Look at the two rows lined up. Count the pictures in the longer row past the end of the shorter one.',
  });
}

const howManyMore: Lesson = {
  id: 'graphs-how-many-more',
  title: 'How many more?',
  goal: 'Use a picture graph to find how many more, how many fewer, and how many in all.',
  standard: '1.MD.4',
  emoji: '➕',
  teach: [
    show('How many more dogs than cats? Look at the two rows lined up.', '🐶 6, 🐱 4', graph(pets, [6, 4, 3])),
    show('The dogs row goes 2 past the end of the cats row. 2 more dogs than cats.', '6 − 4 = 2', graph(pets, [6, 4, 3])),
    show('So there are 2 fewer cats than dogs.', '2 fewer cats', graph(pets, [6, 4, 3])),
    show('How many pets in all? Put the rows together: 6 and 4 make 10, and 3 more make 13.', '6 + 4 + 3 = 13', graph(pets, [6, 4, 3])),
    doStep({
      say: 'Add cats until there are as many cats as dogs.',
      caption: 'cats = dogs',
      model: graph(pets, [6, 4, 3]),
      solution: graph(pets, [6, 6, 3]),
      goal: (s) => same(countsOf(s), [6, 6, 3]),
      hint: (s) => (s.rows[1].count < 6 ? 'Add to the cats row until it lines up with the dogs row.' : s.rows[1].count > 6 ? 'Too many cats. Tap one to take it off.' : 'Only change the cats row.'),
      then: 'You added 2 cats. That is how many more dogs there were: 2.',
    }),
    doStep({
      say: 'Add rainy days until there are as many as sunny days.',
      caption: 'rainy = sunny',
      model: graph(weather, [7, 3, 1]),
      solution: graph(weather, [7, 7, 1]),
      goal: (s) => same(countsOf(s), [7, 7, 1]),
      hint: (s) => (s.rows[1].count < 7 ? 'Add to the rainy row until it lines up with the sunny row.' : s.rows[1].count > 7 ? 'Too many rainy days. Tap one to take it off.' : 'Only change the rainy row.'),
      then: 'You added 4. There were 4 more sunny days than rainy days.',
    }),
  ],
  practice: compareItem,
};

// --- 4. Make a graph --------------------------------------------------------------------------------

function makeItem(): Item {
  const ti = randomInt(0, TOPICS.length - 1), t = TOPICS[ti];
  const counts = [randomInt(1, 7), randomInt(1, 7), randomInt(1, 7)];
  const words = t.rows.map((r, i) => `${counts[i]} ${counts[i] === 1 ? r.label : r.plural}`);
  return modelItem({
    id: idOf('make', ti, counts),
    say: `Make a graph: ${words[0]}, ${words[1]} and ${words[2]}.`,
    prompt: t.rows.map((r, i) => `${counts[i]} ${r.emoji}`).join('  '),
    answer: counts.join(','),
    model: graph(t, [0, 0, 0]),
    solution: graph(t, counts),
    goal: (s) => same(countsOf(s), counts),
    hint: 'Do one row at a time. Count as you tap.',
  });
}

const making: Lesson = {
  id: 'graphs-make',
  title: 'Make a graph',
  goal: 'Make a picture graph from counts, then answer questions about it.',
  standard: '1.MD.4',
  emoji: '✏️',
  teach: [
    show('Leo looks for bugs in the garden and finds 3 ladybugs, 5 bees and 1 butterfly. Let\'s make a graph.', '3 🐞, 5 🐝, 1 🦋', graph(bugs, [0, 0, 0])),
    show('One picture for each ladybug: 1, 2, 3.', '🐞 3', graph(bugs, [3, 0, 0])),
    show('One picture for each bee: 1, 2, 3, 4, 5.', '🐝 5', graph(bugs, [3, 5, 0])),
    show('And 1 butterfly. Now anyone can see that Leo found the most bees.', '🦋 1', graph(bugs, [3, 5, 1])),
    makeStep(fruit, [0, 0, 0], [4, 2, 5], 'Your turn. Make a graph: 4 apples, 2 bananas and 5 bunches of grapes.',
      'Grapes have the longest row: the most votes.'),
    makeStep(weather, [0, 0, 0], [6, 2, 3], 'Make the weather graph: 6 sunny days, 2 rainy days and 3 cloudy days.',
      'Sunny has the most. Rainy has the fewest.'),
  ],
  practice: mix([1, makeItem], [1, compareItem]),
};

export const UNIT: Unit = {
  id: 'graphs',
  title: 'Graphs',
  emoji: '📊',
  about: 'Reading and making picture graphs: how many, most and fewest, how many more, and how many in all.',
  colour: '#3949AB',
  lessons: [reading, mostAndFewest, howManyMore, making],
};

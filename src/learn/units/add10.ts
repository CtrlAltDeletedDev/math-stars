import { Lesson, Unit } from '../types';
import {
  choiceItem, colourCount, fillHint, frame, frameHint, hopGoal, hopHint, line, missingAdd, missingFirst,
  onFrame, pick, pictureChoice, placed, randomInt, rows, sameAsItem, shuffle, sumItem, topRow, bottomRow,
  trueOrFalse, weighted,
} from './helpers-arith';

// Unit: Adding to 10.
//
// She has added within 5 already, so the unit moves fast from "adding is
// putting together" to the strategies that replace counting from 1: count on
// from the bigger number, turn it around, doubles, and the pairs that make 10.
// Every lesson uses one manipulative she moves herself, and that same
// manipulative is the picture in practice.

const sumAtMost = (max: number, min = 1): [number, number] => {
  const a = randomInt(min, max - min);
  return [a, randomInt(min, max - a)];
};

// --- 1. Putting together ------------------------------------------------------

/** "Which picture shows a + b?": one group off by one is the slip to catch. */
function whichPictureShows(a: number, b: number) {
  const near: [number, number][] = [[a, b + 1], [a + 1, b], [a, b - 1], [a - 1, b]];
  const wrong = shuffle(near.filter(([x, y]) => x >= 1 && y >= 1)).slice(0, 2);
  return choiceItem(
    {
      id: `which-sum-${a}+${b}`,
      say: `Which picture shows ${a} plus ${b}? ${a} red, and ${b} yellow.`,
      prompt: `${a} + ${b}`,
      hint: `Count the red ones, then the yellow ones.`,
    },
    pictureChoice(`${a}+${b}`, frame(a, b)),
    wrong.map(([x, y]) => pictureChoice(`${x}+${y}`, frame(x, y))),
  );
}

const PUT_TOGETHER: Lesson = {
  id: 'add-put-together',
  title: 'Putting together',
  goal: 'Knows that adding means putting two groups together and counting how many there are altogether.',
  standard: 'K.OA.1',
  emoji: '🧺',
  placedBy: { track: 'plus', stage: 2 },
  teach: [
    { type: 'show', say: 'Here are 3 red counters.', caption: '3', model: frame(3) },
    { type: 'show', say: 'And here come 2 yellow counters.', caption: '3 and 2', model: frame(3, 2) },
    { type: 'show', say: "Let's put them together and count them all. 1, 2, 3, 4, 5. 5 altogether!", caption: '3 + 2 = 5', model: frame(3, 2) },
    { type: 'show', say: 'Plus means put together. 3 plus 2 makes 5.', caption: '3 + 2 = 5', model: frame(3, 2) },
    {
      type: 'do',
      say: "Your turn. Let's show 4 plus 3. Tap the frame to put in 4 red, then 3 yellow.",
      caption: '4 + 3',
      model: frame(0, 0, { tray: { a: 4, b: 6 } }),
      goal: onFrame((s) => colourCount(s, 'a') === 4 && colourCount(s, 'b') === 3),
      solution: frame(4, 3, { tray: { a: 0, b: 3 } }),
      hint: frameHint((s) => {
        const red = colourCount(s, 'a');
        const yellow = colourCount(s, 'b');
        if (red < 4) return `Put in ${4 - red} more red.`;
        if (yellow < 3) return `You have ${yellow} yellow. Put in ${3 - yellow} more.`;
        return 'That is too many yellow. Tap one to send it back.';
      }),
      then: '4 red and 3 yellow. Count them all: 7 altogether. 4 plus 3 is 7.',
    },
    {
      type: 'do',
      say: 'Now show 2 plus 5. 2 red, then 5 yellow.',
      caption: '2 + 5',
      model: frame(0, 0, { tray: { a: 2, b: 8 } }),
      goal: onFrame((s) => colourCount(s, 'a') === 2 && colourCount(s, 'b') === 5),
      solution: frame(2, 5, { tray: { a: 0, b: 3 } }),
      hint: frameHint((s) => {
        const red = colourCount(s, 'a');
        const yellow = colourCount(s, 'b');
        if (red < 2) return `Put in ${2 - red} more red.`;
        if (yellow < 5) return `You have ${yellow} yellow. Put in ${5 - yellow} more.`;
        return 'That is too many yellow. Tap one to send it back.';
      }),
      then: '2 and 5 make 7 altogether. Different numbers can make the same total!',
    },
    { type: 'ask', item: sumItem(1, 4) },
  ],
  practice: () => sumItem(...sumAtMost(5)),
  check: () => weighted([
    [3, () => sumItem(...sumAtMost(5), null)],
    [1, () => whichPictureShows(...sumAtMost(5))],
  ]),
};

// --- 2. Adding 1 and 0 --------------------------------------------------------

const ONE_AND_ZERO: Lesson = {
  id: 'add-one-and-zero',
  title: 'Adding 1 and 0',
  goal: 'Adds 1 as "the next number" and knows that adding 0 changes nothing, either way round.',
  standard: '1.OA.6',
  emoji: '☝️',
  placedBy: { track: 'plus', stage: 0 },
  teach: [
    { type: 'show', say: 'Here is 6 on the number line. Adding 1 is just one hop forward.', caption: '6 + 1', model: line(6) },
    { type: 'show', say: 'Hop 1. We land on 7. Adding 1 gives the very next number.', caption: '6 + 1 = 7', model: line(6, [7]) },
    { type: 'show', say: 'Adding 0 means no hops at all. We stay right on 6.', caption: '6 + 0 = 6', model: line(6) },
    {
      type: 'do',
      say: 'Your turn. Show 8 plus 1. Tap 8, then make 1 hop.',
      caption: '8 + 1',
      model: line(null),
      goal: hopGoal(8, 1),
      solution: line(8, [9]),
      hint: hopHint(8, 1),
      then: '8 and 1 more is 9. The next number!',
    },
    {
      type: 'do',
      say: 'Now 1 plus 7. Start on the bigger number, 7, then hop 1.',
      caption: '1 + 7',
      model: line(null),
      goal: hopGoal(7, 1),
      solution: line(7, [8]),
      hint: (s) => (s.model === 'numberLine' && s.start === 1
        ? 'Start on 7, the bigger number. Then there is only 1 hop to make.'
        : hopHint(7, 1)(s)),
      then: '1 plus 7 is the same as 7 plus 1. The next number after 7 is 8.',
    },
    { type: 'ask', item: sumItem(9, 0, line(9)) },
  ],
  practice: () => {
    const n = randomInt(1, 9);
    return weighted([
      [3, () => sumItem(n, 1, line(n))],
      [1, () => sumItem(1, n, line(n))],
      [1, () => sumItem(n, 0, line(n))],
      [1, () => sumItem(0, n, line(n))],
    ]);
  },
  check: () => {
    const n = randomInt(1, 9);
    return pick([sumItem(n, 1, null), sumItem(1, n, null), sumItem(n, 0, null), sumItem(0, n, null), trueOrFalse(n, '+', pick([0, 1]))]);
  },
};

// --- 3. Counting on -----------------------------------------------------------

const countOnPair = (): [number, number] => {
  const small = randomInt(1, 3);
  return [randomInt(4, 10 - small), small];
};

const COUNT_ON: Lesson = {
  id: 'add-count-on',
  title: 'Counting on',
  goal: 'Adds 1, 2 or 3 by starting on the bigger number and counting on, instead of counting from 1.',
  standard: '1.OA.5',
  emoji: '🐸',
  placedBy: { track: 'plus', stage: 3 },
  teach: [
    { type: 'show', say: "Let's add 5 and 3. Here's a trick: don't count from 1. Start right on 5!", caption: '5 + 3 = ?', model: line(5) },
    { type: 'show', say: 'Now hop forward and count the hops. 6.', caption: '5 … 6', model: line(5, [6]) },
    { type: 'show', say: '7, 8. That is 3 hops. We land on 8.', caption: '5 + 3 = 8', model: line(5, [6, 7, 8]) },
    { type: 'show', say: 'Count the hops, not the number you start on. You are already standing on 5.', caption: '3 hops', model: line(5, [6, 7, 8]) },
    {
      type: 'do',
      say: 'Your turn: 6 plus 2. Tap 6 to start, then hop 2.',
      caption: '6 + 2',
      model: line(null),
      goal: hopGoal(6, 2),
      solution: line(6, [7, 8]),
      hint: hopHint(6, 2),
      then: '7, 8. Two hops from 6 lands on 8. 6 plus 2 is 8.',
    },
    {
      type: 'do',
      say: 'Now 7 plus 3. Start on 7 and count on 3.',
      caption: '7 + 3',
      model: line(null),
      goal: hopGoal(7, 3),
      solution: line(7, [8, 9, 10]),
      hint: hopHint(7, 3),
      then: '8, 9, 10. 7 plus 3 is 10. No counting from 1!',
    },
    { type: 'ask', item: sumItem(4, 3, line(4)) },
  ],
  practice: () => {
    const [big, small] = countOnPair();
    return weighted([
      [4, () => sumItem(big, small, line(big))],
      [1, () => missingAdd(big, big + small, line(big), `Start on ${big} and hop until you reach ${big + small}. Count the hops.`)],
    ]);
  },
  check: () => weighted([
    [3, () => sumItem(...countOnPair(), null)],
    [1, () => { const [big, small] = countOnPair(); return trueOrFalse(big, '+', small); }],
  ]),
};

// --- 4. Turnaround facts ------------------------------------------------------

const turnPair = (): [number, number] => {
  const small = randomInt(1, 4);
  return [small, randomInt(small + 1, 10 - small)];
};

function sameFact(a: number, b: number) {
  // a is the smaller, b the bigger.
  const wrong = [`${b} − ${a}`, `${a} + ${a}`, `${b} + ${b}`];
  return choiceItem(
    {
      id: `turn-${a}+${b}`,
      say: `Which one is the same as ${a} plus ${b}?`,
      prompt: `${a} + ${b} is the same as…`,
      hint: 'Look for the same two numbers, still adding.',
    },
    { value: `${b} + ${a}`, label: `${b} + ${a}`, say: `${b} plus ${a}` },
    shuffle(wrong).slice(0, 2).map((w) => ({ value: w, label: w, say: w.replace('−', 'take away').replace('+', 'plus') })),
  );
}

const TURNAROUND: Lesson = {
  id: 'add-turnaround',
  title: 'Turnaround facts',
  goal: 'Knows that 3 + 5 and 5 + 3 make the same total, and starts on the bigger number to add.',
  standard: '1.OA.3',
  emoji: '🔄',
  placedBy: { track: 'plus', stage: 3 },
  teach: [
    { type: 'show', say: "Let's add 2 and 6. Start on 2 and hop 6 times. That is a lot of hops!", caption: '2 + 6', model: line(2, [3, 4, 5, 6, 7, 8]) },
    { type: 'show', say: 'Now turn it around. Start on 6 and hop just 2. We land on 8 again!', caption: '6 + 2 = 8', model: line(6, [7, 8]) },
    { type: 'show', say: '2 plus 6 and 6 plus 2 are turnaround facts. Same numbers, same answer.', caption: '2 + 6 = 6 + 2', model: line(6, [7, 8]) },
    { type: 'show', say: 'So always start on the bigger number. It is faster.', caption: 'Start big!', model: line(6) },
    {
      type: 'do',
      say: 'Show 1 plus 8 the fast way. Start on the bigger number.',
      caption: '1 + 8',
      model: line(null),
      goal: hopGoal(8, 1),
      solution: line(8, [9]),
      hint: (s) => (s.model === 'numberLine' && s.start === 1
        ? 'That works, but it is 8 hops! Start on 8 and hop just 1.'
        : hopHint(8, 1)(s)),
      then: 'One hop from 8 is 9. 1 plus 8 is 9, and so is 8 plus 1.',
    },
    {
      type: 'do',
      say: 'Now 3 plus 7. Which number do you start on?',
      caption: '3 + 7',
      model: line(null),
      goal: hopGoal(7, 3),
      solution: line(7, [8, 9, 10]),
      hint: (s) => (s.model === 'numberLine' && s.start === 3
        ? 'Start on 7, the bigger number. Then you only hop 3.'
        : hopHint(7, 3)(s)),
      then: '8, 9, 10. 3 plus 7 is 10, the same as 7 plus 3.',
    },
    { type: 'ask', item: sameAsItem(2, 5, 5, 'Turn it around. The same two numbers make the same total.') },
  ],
  practice: () => {
    const [a, b] = turnPair();
    return weighted([
      [4, () => sumItem(a, b, line(b))],
      [1, () => sameAsItem(a, b, b, 'Turn it around. The same two numbers make the same total.')],
    ]);
  },
  check: () => weighted([
    [3, () => sumItem(...turnPair(), null)],
    [1, () => sameFact(...turnPair())],
  ]),
};

// --- 5. Doubles ---------------------------------------------------------------

function whichDouble(n: number) {
  const wrong: [number, number][] = shuffle([[n, n + 1], [n + 1, n], [n, n - 1], [n - 1, n]] as [number, number][])
    .filter(([x, y]) => x >= 1 && y >= 1 && x <= 5 && y <= 5)
    .slice(0, 2);
  return choiceItem(
    {
      id: `which-double-${n}`,
      say: 'Which one is a double? Both rows the same.',
      prompt: 'Which is a double?',
      hint: 'A double has the same number in the top row and the bottom row.',
    },
    pictureChoice(`${n}+${n}`, rows(n, n)),
    wrong.map(([x, y]) => pictureChoice(`${x}+${y}`, rows(x, y))),
  );
}

function doubleHint(n: number) {
  return frameHint((s) => {
    const t = topRow(s);
    const b = bottomRow(s);
    if (t === n && b === n) return 'Both rows match.';
    if (t !== n) return `The top row has ${t}. Make it ${n}.`;
    return `The bottom row has ${b}. Make it ${n}, the same as the top.`;
  });
}

const DOUBLES: Lesson = {
  id: 'add-doubles',
  title: 'Doubles',
  goal: 'Knows the doubles from 1 + 1 to 5 + 5 by sight: the same number twice.',
  standard: '1.OA.6',
  emoji: '👯',
  placedBy: { track: 'plus', stage: 4 },
  teach: [
    { type: 'show', say: 'A double is the same number two times. 3 on top, and 3 on the bottom.', caption: '3 + 3', model: rows(3, 3) },
    { type: 'show', say: '3 and 3 make 6. Two rows that match.', caption: '3 + 3 = 6', model: rows(3, 3) },
    { type: 'show', say: '4 and 4. Two matching rows again. That makes 8.', caption: '4 + 4 = 8', model: rows(4, 4) },
    { type: 'show', say: '5 and 5 fill the whole frame. 10!', caption: '5 + 5 = 10', model: rows(5, 5) },
    {
      type: 'do',
      say: 'Your turn. Make 2 plus 2. Put 2 in the top row and 2 in the bottom row.',
      caption: '2 + 2',
      model: frame(0, 0, { tray: { a: 2, b: 2 } }),
      goal: onFrame((s) => topRow(s) === 2 && bottomRow(s) === 2),
      solution: rows(2, 2, { tray: { a: 0, b: 0 } }),
      hint: doubleHint(2),
      then: '2 and 2. The rows match. That makes 4.',
    },
    {
      type: 'do',
      say: 'Now make the double 4 plus 4.',
      caption: '4 + 4',
      model: frame(0, 0, { tray: { a: 4, b: 4 } }),
      goal: onFrame((s) => topRow(s) === 4 && bottomRow(s) === 4),
      solution: rows(4, 4, { tray: { a: 0, b: 0 } }),
      hint: doubleHint(4),
      then: '4 on top, 4 below. 4 plus 4 is 8.',
    },
  ],
  practice: () => {
    const n = randomInt(1, 5);
    return weighted([
      [4, () => sumItem(n, n, rows(n, n))],
      [1, () => sumItem(n, n, rows(n, n))],
    ]);
  },
  check: () => {
    const n = randomInt(1, 5);
    return weighted([
      [2, () => sumItem(n, n, null)],
      [1, () => whichDouble(n)],
      [1, () => trueOrFalse(n, '+', n)],
    ]);
  },
};

// --- 6. Pairs that make 10 ----------------------------------------------------

const tenHint = 'Count the empty spaces in the ten frame.';

const MAKE_TEN: Lesson = {
  id: 'add-make-ten',
  title: 'Pairs that make 10',
  goal: 'Knows the pairs that make 10 (7 and 3, 6 and 4...) by looking at the empty spaces in a ten frame.',
  standard: 'K.OA.4',
  emoji: '🔟',
  placedBy: { track: 'plus', stage: 4 },
  teach: [
    { type: 'show', say: 'Here are 7 counters. How many empty spaces? 1, 2, 3.', caption: '7 and 3 empty', model: frame(7) },
    { type: 'show', say: 'Fill them up with 3 more. Now the frame is full. 7 and 3 make 10!', caption: '7 + 3 = 10', model: frame(7, 3) },
    { type: 'show', say: '6 counters leave 4 empty spaces. So 6 and 4 make 10 too.', caption: '6 + 4 = 10', model: frame(6, 4) },
    {
      type: 'do',
      say: 'Here are 8. Put in just enough to fill the frame.',
      caption: '8 + ? = 10',
      model: frame(8, 0, { tray: { a: 0, b: 5 } }),
      goal: onFrame((s) => placed(s) === 10),
      solution: frame(8, 2, { tray: { a: 0, b: 3 } }),
      hint: fillHint(10),
      then: '8 needed 2 more. 8 and 2 make 10.',
    },
    {
      type: 'do',
      say: 'Now there are 4. Fill the ten.',
      caption: '4 + ? = 10',
      model: frame(4, 0, { tray: { a: 0, b: 8 } }),
      goal: onFrame((s) => placed(s) === 10),
      solution: frame(4, 6, { tray: { a: 0, b: 2 } }),
      hint: fillHint(10),
      then: '4 needed 6 more. 4 and 6 make 10.',
    },
    { type: 'ask', item: missingAdd(9, 10, frame(9), tenHint) },
  ],
  practice: () => {
    const a = randomInt(1, 9);
    return weighted([
      [3, () => missingAdd(a, 10, frame(a), tenHint)],
      [1, () => missingFirst(a, 10, frame(0, a), tenHint)],
      [1, () => sumItem(a, 10 - a)],
    ]);
  },
  check: () => {
    const a = randomInt(1, 9);
    return weighted([
      [2, () => missingAdd(a, 10)],
      [1, () => missingFirst(a, 10)],
      [1, () => trueOrFalse(a, '+', pick([10 - a, 10 - a + 1, 10 - a - 1].filter((x) => x >= 1)))],
    ]);
  },
  review: () => missingAdd(randomInt(1, 9), 10),
};

export const UNIT: Unit = {
  id: 'add-10',
  title: 'Adding to 10',
  emoji: '➕',
  about: 'What adding means, then the ways to stop counting from 1: count on from the bigger number, turnarounds, doubles and the pairs that make 10.',
  colour: '#1E9C8A',
  lessons: [PUT_TOGETHER, ONE_AND_ZERO, COUNT_ON, TURNAROUND, DOUBLES, MAKE_TEN],
};

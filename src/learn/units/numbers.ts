import { Item, Lesson, ModelState, Unit } from '../types';
import {
  allCounted, choiceItem, fillHint, frame, frameHint, frames2, hopGoal, hopHint, howMany, inFrame, line, objectsHint,
  onFrame, onObjects, pick, pictureChoice, placed, randomInt, shuffle, sumItem, things, topRow, weighted, whichFrame,
} from './helpers-arith';

// Unit: Numbers to 20.
//
// Before adding means anything they need number sense: that the last number
// counted is how many, that 7 is "5 and 2 more" on a ten frame, that a teen
// number is a ten and some ones, and where each number sits on the line. No
// lesson here is placed by the plus/minus path: none is a stage's facts.

const EMOJI = ['🦆', '🐟', '🍓', '⭐', '🐞', '🌼', '🍪', '🚗'] as const;
const LINE20 = (start: number | null, path: number[] = []) => line(start, path, 20);

// --- 1. Counting things -------------------------------------------------------

const countHint = 'Touch each one once as you count. The last number you say is how many.';

function countThings(n: number): Item {
  const emoji = pick(EMOJI);
  return howMany(`count-${n}`, `How many ${emoji}? Count them.`, things(emoji, n, [], Math.random() < 0.4), n, countHint);
}

function whichHas(n: number): Item {
  const emoji = pick(EMOJI);
  const wrong = shuffle([n - 1, n + 1].filter((k) => k >= 1)).slice(0, 2);
  return choiceItem(
    { id: `which-has-${n}`, say: `Which one has ${n}?`, prompt: `Which has ${n}?`, hint: countHint },
    pictureChoice(String(n), things(emoji, n)),
    wrong.map((k) => pictureChoice(String(k), things(emoji, k))),
  );
}

const COUNTING: Lesson = {
  id: 'num-counting',
  title: 'Counting things',
  goal: 'Counts up to 20 things by touching each one once, and knows the last number said is how many.',
  standard: 'K.CC.4',
  emoji: '🦆',
  teach: [
    { type: 'show', say: "Here are some ducks. Let's count them. Touch each duck just once.", caption: 'How many?', model: things('🦆', 5) },
    { type: 'show', say: '1, 2, 3.', caption: '1, 2, 3', model: things('🦆', 5, [0, 1, 2]) },
    { type: 'show', say: '4, 5. The last number we say tells how many. 5 ducks!', caption: '5 ducks', model: things('🦆', 5, [0, 1, 2, 3, 4]) },
    {
      type: 'do',
      say: 'Your turn. Tap each fish to count it.',
      caption: 'Count the fish',
      model: things('🐟', 7),
      goal: onObjects(allCounted),
      solution: things('🐟', 7, [0, 1, 2, 3, 4, 5, 6]),
      hint: objectsHint((s) => `You have counted ${new Set(s.counted).size}. Find a fish with no number yet.`),
      then: 'You touched every fish once. The last number was 7, so there are 7 fish.',
    },
    {
      type: 'do',
      say: 'These strawberries are all mixed up. Tap each one, just once.',
      caption: 'Count them all',
      model: things('🍓', 9, [], true),
      goal: onObjects(allCounted),
      solution: things('🍓', 9, [4, 0, 7, 2, 8, 1, 5, 3, 6], true),
      hint: objectsHint((s) => `You have counted ${new Set(s.counted).size}. Look for one with no number.`),
      then: 'Mixed up or in a row, the last number tells how many. 9 strawberries.',
    },
    {
      type: 'do',
      say: 'Here are lots of stars. Tap just 6 of them.',
      caption: 'Count out 6',
      model: things('⭐', 10),
      goal: onObjects((s) => s.counted.length === 6 && new Set(s.counted).size === 6),
      solution: things('⭐', 10, [0, 1, 2, 3, 4, 5]),
      hint: objectsHint((s) => (s.counted.length < 6
        ? `You have counted ${s.counted.length}. Keep going until you say 6.`
        : 'That is more than 6. Start again and stop when you say 6.')),
      then: 'You stopped when you said 6. That is how to count out 6.',
    },
  ],
  practice: () => countThings(randomInt(4, 15)),
  check: () => weighted([
    [3, () => countThings(randomInt(6, 20))],
    [1, () => whichHas(randomInt(5, 12))],
  ]),
};

// --- 2. Five and some more ----------------------------------------------------

const fiveHint = 'Find the full row of 5, then count on.';

const FIVE_AND_MORE: Lesson = {
  id: 'num-five-and-more',
  title: 'Five and some more',
  goal: 'Reads a number on a ten frame at a glance, as 5 and some more, without counting from 1.',
  standard: 'K.CC.5',
  emoji: '🖐️',
  teach: [
    { type: 'show', say: 'This is a ten frame. It has two rows of 5. The top row is full: 5.', caption: '5', model: frame(5) },
    { type: 'show', say: 'A full row and 2 more is 7. No need to count them all.', caption: '5 and 2 more = 7', model: frame(7) },
    { type: 'show', say: 'A full row and 3 more is 8.', caption: '5 and 3 more = 8', model: frame(8) },
    { type: 'show', say: 'Both rows full is 10.', caption: '10', model: frame(10) },
    {
      type: 'do',
      say: 'Your turn. Put 6 counters in the frame. Fill the top row first.',
      caption: 'Make 6',
      model: frame(0, 0, { tray: { a: 10, b: 0 } }),
      goal: onFrame((s) => placed(s) === 6 && topRow(s) === 5),
      solution: frame(6, 0, { tray: { a: 4, b: 0 } }),
      hint: frameHint((s) => (placed(s) === 6 && topRow(s) < 5 ? 'Fill the top row first, then go on to the bottom row.' : fillHint(6)(s))),
      then: 'A full row and 1 more. That is 6.',
    },
    {
      type: 'do',
      say: 'Now make 9.',
      caption: 'Make 9',
      model: frame(0, 0, { tray: { a: 10, b: 0 } }),
      goal: onFrame((s) => placed(s) === 9 && topRow(s) === 5),
      solution: frame(9, 0, { tray: { a: 1, b: 0 } }),
      hint: frameHint((s) => (placed(s) === 9 && topRow(s) < 5 ? 'Fill the top row first, then go on to the bottom row.' : fillHint(9)(s))),
      then: 'A full row and 4 more is 9. Just 1 space is empty.',
    },
    { type: 'ask', item: whichFrame(7) },
  ],
  practice: () => { const n = randomInt(3, 10); return howMany(`count-frame-${n}`, 'How many counters?', frame(n), n, fiveHint); },
  check: () => {
    const n = randomInt(4, 10);
    return weighted([
      [2, () => whichFrame(n)],
      [2, () => howMany(`count-frame-${n}`, 'How many counters?', frame(n), n, fiveHint)],
    ]);
  },
};

// --- 3. One more, one less ----------------------------------------------------

function moreOrLess(n: number, picture: boolean): Item {
  const more = Math.random() < 0.5 || n === 0;
  const item: Item = {
    id: `${more ? 'more' : 'less'}-${n}`,
    say: `What is 1 ${more ? 'more' : 'less'} than ${n}?`,
    prompt: `1 ${more ? 'more' : 'less'} than ${n} = ?`,
    answer: String(more ? n + 1 : n - 1),
    input: 'number',
    hint: more ? 'One more is the next number when you count.' : 'One less is the number just before, when you count.',
  };
  return picture ? { ...item, picture: LINE20(n) } : item;
}

const ONE_MORE_LESS: Lesson = {
  id: 'num-one-more-less',
  title: 'One more, one less',
  goal: 'Says the number 1 more or 1 less than any number to 20, using the number line.',
  standard: 'K.CC.4c',
  emoji: '↔️',
  teach: [
    { type: 'show', say: 'Here is 7 on the number line.', caption: '7', model: LINE20(7) },
    { type: 'show', say: 'One more is one hop forward. 8!', caption: '1 more than 7 = 8', model: LINE20(7, [8]) },
    { type: 'show', say: 'One less is one hop back. 6!', caption: '1 less than 7 = 6', model: LINE20(7, [6]) },
    {
      type: 'do',
      say: 'Your turn. Find 1 more than 12. Make one hop forward.',
      caption: '1 more than 12',
      model: LINE20(12),
      goal: hopGoal(12, 1),
      solution: LINE20(12, [13]),
      hint: hopHint(12, 1),
      then: '13 comes right after 12. 1 more than 12 is 13.',
    },
    {
      type: 'do',
      say: 'Now find 1 less than 15. Make one hop back.',
      caption: '1 less than 15',
      model: LINE20(15),
      goal: hopGoal(15, -1),
      solution: LINE20(15, [14]),
      hint: hopHint(15, -1),
      then: '14 comes just before 15. 1 less than 15 is 14.',
    },
    {
      type: 'do',
      say: 'Tap 19 to start. Then find 1 more.',
      caption: '1 more than 19',
      model: LINE20(null),
      goal: hopGoal(19, 1),
      solution: LINE20(19, [20]),
      hint: hopHint(19, 1),
      then: 'After 19 comes 20!',
    },
  ],
  practice: () => moreOrLess(randomInt(1, 19), true),
  check: () => moreOrLess(randomInt(1, 19), false),
};

// --- 4. Teen numbers ----------------------------------------------------------

function teenOnes(t: number, picture: boolean): Item {
  const item: Item = {
    id: `teen-ones-${t}`,
    say: `${t} is 10 and how many more?`,
    prompt: `${t} = 10 + ?`,
    answer: String(t - 10),
    input: 'number',
    hint: `${t} is a full ten and some ones. Count the ones.`,
  };
  return picture ? { ...item, picture: frame(10, t - 10) } : item;
}

const teenFrameHint = 'A full ten frame is 10. Count on the ones in the next frame.';

function buildTeen(t: number) {
  const ones = t - 10;
  return {
    model: frames2([0, 0], [0, 0], { tray: { a: 10, b: 10 } }),
    goal: onFrame((s) => inFrame(s, 0) === 10 && inFrame(s, 1) === ones),
    solution: frames2([10, 0], [0, ones], { tray: { a: 0, b: 10 - ones } }),
    hint: frameHint((s) => {
      const first = inFrame(s, 0);
      const second = inFrame(s, 1);
      if (first < 10) return `Fill the first frame first. It needs ${10 - first} more.`;
      if (second < ones) return `The ten is full. Put ${ones - second} more in the second frame.`;
      return 'That is too many ones. Tap one to send it back.';
    }),
  };
}

const TEENS: Lesson = {
  id: 'num-teens',
  title: 'Teen numbers',
  goal: 'Knows every number from 11 to 19 is a ten and some ones, and builds them on two ten frames.',
  standard: 'K.NBT.1',
  emoji: '🔟',
  teach: [
    { type: 'show', say: 'Here is a full ten frame. That is 10.', caption: '10', model: frame(10, 0, { frames: 2 }) },
    { type: 'show', say: 'Put 3 more in the next frame. 10 and 3 make 13.', caption: '13 = 10 + 3', model: frame(10, 3) },
    { type: 'show', say: '10 and 7 make 17. Every teen number is a ten and some ones.', caption: '17 = 10 + 7', model: frame(10, 7) },
    { type: 'show', say: 'Two full ten frames make 20.', caption: '20 = 10 + 10', model: frame(10, 10) },
    {
      type: 'do',
      say: 'Your turn. Build 14. Fill the first frame, then put the ones in the next frame.',
      caption: '14 = 10 + 4',
      ...buildTeen(14),
      then: 'A full ten and 4 ones. That is 14.',
    },
    {
      type: 'do',
      say: 'Now build 18.',
      caption: '18 = 10 + 8',
      ...buildTeen(18),
      then: 'A full ten and 8 ones. That is 18.',
    },
    { type: 'ask', item: teenOnes(16, true) },
  ],
  practice: () => {
    const ones = randomInt(1, 9);
    return weighted([
      [2, () => sumItem(10, ones)],
      [2, () => teenOnes(10 + ones, true)],
      [2, () => howMany(`count-frame-${10 + ones}`, 'How many counters?', frame(10, ones), 10 + ones, teenFrameHint)],
    ]);
  },
  check: () => {
    const ones = randomInt(1, 9);
    return weighted([
      [1, () => sumItem(10, ones, null)],
      [2, () => teenOnes(10 + ones, false)],
      [1, () => howMany(`count-frame-${10 + ones}`, 'How many counters?', frame(10, ones), 10 + ones, teenFrameHint)],
    ]);
  },
};

// --- 5. More, fewer, the same -------------------------------------------------

const compareRows = (x: number, y: number): ModelState => ({ model: 'compare', rows: [{ emoji: '🐶', count: x }, { emoji: '🐱', count: y }], matched: true });

function whichIs(word: 'more' | 'fewer', x: number, y: number, picture: boolean): Item {
  const right = word === 'more' ? Math.max(x, y) : Math.min(x, y);
  const wrong = right === x ? y : x;
  const [first, second] = shuffle([x, y]);
  const item = choiceItem(
    {
      id: `${word}-${Math.min(x, y)}-${Math.max(x, y)}`,
      say: `Which is ${word}, ${first} or ${second}?`,
      prompt: `Which is ${word}?`,
      hint: word === 'more' ? 'The number you say later when you count is more.' : 'The number you say first when you count is fewer.',
    },
    { value: String(right), label: String(right) },
    [{ value: String(wrong), label: String(wrong) }],
  );
  return picture ? { ...item, picture: compareRows(x, y) } : item;
}

/** Pairs that catch the "bigger last digit" slip: 9 against 13, 7 against 15. */
function trickyPair(): [number, number] {
  const d = randomInt(3, 9);
  return [d, 10 + randomInt(0, d - 1)];
}

function smallPair(): [number, number] {
  const x = randomInt(1, 10);
  let y = randomInt(1, 10);
  while (y === x) y = randomInt(1, 10);
  return [x, y];
}

function howManyMore(): Item {
  const [x, y] = smallPair();
  const big = Math.max(x, y);
  const small = Math.min(x, y);
  return {
    id: `how-many-more-${big}-${small}`,
    say: `${big} is how many more than ${small}? Match them up and count the extras.`,
    prompt: `${big} is ? more than ${small}`,
    answer: String(big - small),
    input: 'number',
    figure: compareRows(big, small),
    hint: 'Match them up in pairs. Count the ones with no partner.',
  };
}

const COMPARE: Lesson = {
  id: 'num-compare',
  title: 'More, fewer, the same',
  goal: 'Compares two groups by matching them up, and two numbers to 20 by where they come when counting.',
  standard: 'K.CC.6',
  emoji: '⚖️',
  teach: [
    { type: 'show', say: 'Leo has 5 dogs. Mia has 3 cats. Let us line them up.', caption: '5 and 3', model: { model: 'compare', rows: [{ emoji: '🐶', count: 5 }, { emoji: '🐱', count: 3 }] } },
    { type: 'show', say: 'Each cat gets a dog partner. 2 dogs have no partner. So there are more dogs.', caption: '5 is more than 3', model: compareRows(5, 3) },
    { type: 'show', say: 'Now Leo has 4 dogs and Mia has 4 cats. Everyone has a partner. They are the same!', caption: '4 = 4', model: compareRows(4, 4) },
    {
      type: 'do',
      say: 'Your turn. The first frame has 6. Make the second frame the same.',
      caption: 'Make them the same',
      model: frames2([6, 0], [0, 0], { tray: { a: 0, b: 10 } }),
      goal: onFrame((s) => inFrame(s, 0) === 6 && inFrame(s, 1) === 6),
      solution: frames2([6, 0], [0, 6], { tray: { a: 0, b: 4 } }),
      hint: frameHint((s) => {
        const n = inFrame(s, 1);
        if (n < 6) return `The second frame has ${n}. Put in ${6 - n} more so every counter has a partner.`;
        return 'That is too many. Tap one to send it back.';
      }),
      then: 'Every counter has a partner. 6 and 6 are the same.',
    },
    {
      type: 'do',
      say: 'Now make the second frame have 2 fewer than the first.',
      caption: '2 fewer than 6',
      model: frames2([6, 0], [0, 6], { tray: { a: 0, b: 4 } }),
      goal: onFrame((s) => inFrame(s, 0) === 6 && inFrame(s, 1) === 4),
      solution: frames2([6, 0], [0, 4], { tray: { a: 0, b: 6 } }),
      hint: frameHint((s) => {
        const n = inFrame(s, 1);
        if (n > 4) return 'Tap counters in the second frame to send them back. 2 fewer than 6.';
        return 'That is too few. Put one back in.';
      }),
      then: '4 is 2 fewer than 6. Two counters on top have no partner.',
    },
    { type: 'ask', item: whichIs('more', 9, 13, false) },
  ],
  practice: () => {
    const [x, y] = smallPair();
    return whichIs(pick(['more', 'fewer'] as const), x, y, true);
  },
  check: () => weighted([
    [2, () => whichIs(pick(['more', 'fewer'] as const), ...trickyPair(), false)],
    [1, () => whichIs(pick(['more', 'fewer'] as const), randomInt(11, 15), randomInt(16, 20), false)],
    [1, howManyMore],
  ]),
};

// --- 6. Number order to 20 ----------------------------------------------------

function orderItem(picture: boolean): Item {
  const kind = pick(['after', 'before', 'between'] as const);
  let item: Item;
  if (kind === 'after') {
    const n = randomInt(2, 17);
    item = { id: `after-${n}`, say: `Count on: ${n}, ${n + 1}, ${n + 2}, and then?`, prompt: `${n}, ${n + 1}, ${n + 2}, ?`, answer: String(n + 3), input: 'number', hint: 'Keep counting forward, one more each time.' };
  } else if (kind === 'before') {
    const n = randomInt(5, 20);
    item = { id: `before-${n}`, say: `Count back: ${n}, ${n - 1}, ${n - 2}, and then?`, prompt: `${n}, ${n - 1}, ${n - 2}, ?`, answer: String(n - 3), input: 'number', hint: 'Keep counting back, one less each time.' };
  } else {
    const n = randomInt(1, 19);
    item = { id: `between-${n}`, say: `What number comes between ${n - 1} and ${n + 1}?`, prompt: `${n - 1}, ?, ${n + 1}`, answer: String(n), input: 'number', hint: `Count from ${n - 1}. Which number do you say next?` };
  }
  return picture ? { ...item, picture: LINE20(null) } : item;
}

const ORDER: Lesson = {
  id: 'num-order',
  title: 'Number order to 20',
  goal: 'Counts forward and back from any number to 20, and says the number before, after or between.',
  standard: 'K.CC.2',
  emoji: '🔢',
  teach: [
    { type: 'show', say: 'Numbers go in order, one more each time. After 10 come 11, 12, 13.', caption: '10, 11, 12, 13', model: LINE20(10, [11, 12, 13]) },
    { type: 'show', say: 'What comes between 15 and 17? Count: 15, 16, 17. It is 16!', caption: '15, 16, 17', model: LINE20(15, [16, 17]) },
    { type: 'show', say: 'Counting back goes the other way. 20, 19, 18.', caption: '20, 19, 18', model: LINE20(20, [19, 18]) },
    {
      type: 'do',
      say: 'Your turn. Start on 9 and hop forward to 14. Say each number as you land.',
      caption: '9 to 14',
      model: LINE20(null),
      goal: hopGoal(9, 5),
      solution: LINE20(9, [10, 11, 12, 13, 14]),
      hint: hopHint(9, 5),
      then: '10, 11, 12, 13, 14. Each hop is one more.',
    },
    {
      type: 'do',
      say: 'Now start on 18 and hop back to 13.',
      caption: '18 back to 13',
      model: LINE20(null),
      goal: hopGoal(18, -5),
      solution: LINE20(18, [17, 16, 15, 14, 13]),
      hint: hopHint(18, -5),
      then: '17, 16, 15, 14, 13. Each hop back is one less.',
    },
  ],
  practice: () => orderItem(true),
  check: () => orderItem(false),
};

export const UNIT: Unit = {
  id: 'numbers-20',
  title: 'Numbers to 20',
  emoji: '🔢',
  about: 'Counting things, seeing 5 and some more on a ten frame, one more and one less, teen numbers as a ten and some ones, comparing, and number order.',
  colour: '#5B8DEF',
  lessons: [COUNTING, FIVE_AND_MORE, ONE_MORE_LESS, TEENS, COMPARE, ORDER],
};

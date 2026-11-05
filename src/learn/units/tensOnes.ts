import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { choiceItem, doStep, last, mix, modelItem, numberItem, randomInt, range, show } from './helpers-world';

// Unit: Tens and ones.
//
// Base-ten blocks carry the whole unit: ten loose ones snap into a rod, a
// two-digit number is built rod by rod and cube by cube, and comparing, 10
// more and adding tens are all done to the blocks before they are done to the
// digits. The number line, jumping by tens, is the second picture: counting
// to 120 and adding tens.

type Blocks = Extract<ModelState, { model: 'blocks' }>;
type Line = Extract<ModelState, { model: 'numberLine' }>;

export const blocks = (tens: number, ones: number, extra: Partial<Blocks> = {}): Blocks => ({ model: 'blocks', tens, ones, ...extra });
export const valueOf = (b: Blocks) => b.tens * 10 + b.ones;

const BUILD = { maxTens: 9 };

/** What to fix when building tens and ones. */
const fixBlocks = (t: number, o: number) => (s: Blocks) => {
  const n = t * 10 + o;
  if (s.tens !== t) return `Look at the tens first. ${n} has ${t} tens, and you have ${s.tens}.`;
  return `Now the ones. ${n} has ${o} ones, and you have ${s.ones}.`;
};

const tensWord = (t: number) => (t === 1 ? '1 ten' : `${t} tens`);
const onesWord = (o: number) => (o === 1 ? '1 one' : `${o} ones`);

// --- 1. Counting to 120 ---------------------------------------------------------

const tensLine = (path: number[], start: number | null = 0): Line => ({ model: 'numberLine', min: 0, max: 120, start, path, jumps: 10 });

/** "107, 108, 109, ?" -- three in a row, by ones or by tens, and what comes next. */
function nextItem(): Item {
  const byTens = Math.random() < 0.3;
  if (byTens) {
    const a = randomInt(0, 9) * 10;
    const seq = [a, a + 10, a + 20];
    return numberItem({
      id: `count-tens-${a}`,
      say: `Count by tens: ${seq.join(', ')}. What comes next?`,
      prompt: `${seq.join(', ')}, ?`,
      answer: a + 30,
      hint: 'Each hop is one more ten. Say the tens out loud and keep going.',
      picture: tensLine(seq.slice(1), a),
    });
  }
  // Mostly the hard places: crossing a ten, and the numbers past 100.
  const end = Math.random() < 0.5 ? randomInt(1, 11) * 10 + 9 : randomInt(97, 117);
  const seq = [end - 2, end - 1, end];
  return numberItem({
    id: `count-next-${end}`,
    say: `${seq.join(', ')}. What number comes next?`,
    prompt: `${seq.join(', ')}, ?`,
    answer: end + 1,
    hint: end % 10 === 9 ? 'After 9 ones comes a new ten, and the ones start again at 0.' : 'Say the numbers out loud and keep going, one more each time.',
    picture: { model: 'numberLine', min: Math.max(0, end - 5), max: end + 5, start: end - 2, path: [end - 1, end] },
  });
}

const countTo120: Lesson = {
  id: 'tens-count-to-120',
  title: 'Counting to 120',
  goal: 'Count to 120 by tens and by ones, starting from any number, including past 100.',
  standard: '1.NBT.1',
  emoji: '💯',
  teach: [
    show('Let\'s count by tens. Each big hop is 10.', '0', tensLine([])),
    show('10, 20, 30, 40, 50.', '10, 20, 30, 40, 50', tensLine([10, 20, 30, 40, 50])),
    show('60, 70, 80, 90, 100! Ten tens make 100.', '100', tensLine(range(1, 10).map((k) => k * 10))),
    show('The numbers keep going after 100: 110, 120.', '110, 120', tensLine(range(1, 12).map((k) => k * 10))),
    show('Now by ones from 100: 101, 102, 103, 104, 105. Like 1, 2, 3, 4, 5 again.', '101, 102, 103 …',
      { model: 'numberLine', min: 100, max: 120, start: 100, path: [101, 102, 103, 104, 105] }),
    doStep({
      say: 'Count by tens to 70. Tap 0, then hop by tens.',
      caption: '0, 10, 20 … 70',
      model: tensLine([], null),
      solution: tensLine([10, 20, 30, 40, 50, 60, 70]),
      goal: (s) => s.start === 0 && last(s.path) === 70,
      hint: (s) => (s.start !== 0 ? 'Tap 0 to start.' : (last(s.path) ?? 0) < 70 ? 'Keep hopping: say each ten as you land.' : 'You went past 70. Count the tens again.'),
      then: '10, 20, 30, 40, 50, 60, 70. Seven hops of ten make 70.',
    }),
    doStep({
      say: 'Start at 108 and count on 4 by ones.',
      caption: '108, then 4 more',
      model: { model: 'numberLine', min: 100, max: 120, start: null, path: [] },
      solution: { model: 'numberLine', min: 100, max: 120, start: 108, path: [109, 110, 111, 112] },
      goal: (s) => s.start === 108 && s.path.length === 4 && last(s.path) === 112,
      hint: (s) => (s.start !== 108 ? 'Tap 108 first.' : 'One hop at a time: 4 hops.'),
      then: '109, 110, 111, 112. After 109 comes 110: a new ten, just like after 9 comes 10.',
    }),
  ],
  practice: nextItem,
};

// --- 2. Ten ones make a ten -------------------------------------------------------

/** Blocks with ten or more loose ones: how many in all? */
function looseCount(): Item {
  const t = randomInt(0, 4), o = randomInt(10, 16);
  return numberItem({
    id: `blocks-loose-${t}-${o}`,
    say: `How many blocks are there in all? Make a ten from 10 ones first.`,
    prompt: 'How many in all?',
    answer: t * 10 + o,
    figure: blocks(t, o),
    hint: 'Make a ten from 10 of the ones. Count the tens by 10s, then the ones by 1s.',
  });
}

function tradeItem(): Item {
  const t = randomInt(0, 4), o = randomInt(10, 18);
  const n = t * 10 + o;
  return modelItem({
    id: `blocks-trade-${t}-${o}`,
    say: `Trade 10 ones for a ten. Make as many tens as you can.`,
    prompt: 'Trade 10 ones for a ten',
    answer: String(n),
    model: blocks(t, o, { canTrade: true }),
    solution: blocks(Math.floor(n / 10), n % 10, { canTrade: true }),
    goal: (s) => s.ones < 10 && valueOf(s) === n,
    hint: 'Count 10 loose ones and trade them for one ten.',
  });
}

const makeATen: Lesson = {
  id: 'tens-make-a-ten',
  title: 'Ten ones make a ten',
  goal: 'Bundle ten ones into a ten, and count tens and ones.',
  standard: '1.NBT.2a',
  emoji: '🧱',
  teach: [
    show('Here are some ones. Count them: 1, 2, 3 … 10. 10 ones.', '10 ones', blocks(0, 10)),
    show('Snap 10 ones together and they make one ten.', '10 ones = 1 ten', blocks(1, 0)),
    show('A ten is still 10. It is just quicker to count.', '1 ten = 10', blocks(1, 0)),
    show('Here are 13 ones. Snap 10 of them into a ten.', '13 ones', blocks(0, 13)),
    show('1 ten and 3 ones. 10, 11, 12, 13.', '13 = 1 ten 3 ones', blocks(1, 3)),
    doStep({
      say: 'Here are 12 ones. Trade 10 of them for a ten.',
      caption: '12 ones',
      model: blocks(0, 12, { canTrade: true }),
      solution: blocks(1, 2, { canTrade: true }),
      goal: (s) => s.tens === 1 && s.ones === 2,
      hint: 'Trade 10 loose ones for one ten.',
      then: '1 ten and 2 ones. That is 12: 10, 11, 12.',
    }),
    doStep({
      say: '2 tens and 14 ones. Make another ten, then count.',
      caption: '2 tens, 14 ones',
      model: blocks(2, 14, { canTrade: true }),
      solution: blocks(3, 4, { canTrade: true }),
      goal: (s) => s.tens === 3 && s.ones === 4,
      hint: (s) => (s.ones >= 10 ? 'There are 10 or more loose ones. Trade 10 for a ten.' : 'Keep every block: trade, don\'t take away.'),
      then: '3 tens and 4 ones: 10, 20, 30, 31, 32, 33, 34.',
    }),
  ],
  practice: mix([1, looseCount], [1, tradeItem]),
  check: looseCount,
};

// --- 3. Tens and ones in a number --------------------------------------------------

function readBlocks(): Item {
  const t = randomInt(1, 9), o = randomInt(0, 9);
  return numberItem({
    id: `blocks-read-${t}-${o}`,
    say: 'What number do the blocks show?',
    prompt: 'What number?',
    answer: t * 10 + o,
    figure: blocks(t, o),
    hint: 'Count the tens by 10s, then count on the ones.',
  });
}

function buildItem(): Item {
  const t = randomInt(1, 9), o = randomInt(0, 9);
  const n = t * 10 + o;
  return modelItem({
    id: `blocks-build-${n}`,
    say: `Build ${n} with tens and ones.`,
    prompt: `Build ${n}`,
    answer: String(n),
    model: blocks(0, 0, BUILD),
    solution: blocks(t, o, BUILD),
    goal: (s) => s.tens === t && s.ones === o,
    hint: 'The first digit says how many tens. The second says how many ones.',
  });
}

/** "4 tens and 7 ones" -- which number? The digits swapped, or added, are the mistakes. */
function wordsToNumber(): Item {
  const t = randomInt(1, 9), o = randomInt(1, 9);
  const n = t * 10 + o;
  const c = (v: number): Choice => ({ value: String(v), label: String(v) });
  return choiceItem({
    id: `pv-words-${t}-${o}`,
    say: `${tensWord(t)} and ${onesWord(o)}. Which number is that?`,
    prompt: `${tensWord(t)} and ${onesWord(o)}`,
    answer: c(n),
    wrong: [c(o * 10 + t), c(t + o), c(t * 100 + o), c(n + 10)],
    hint: 'The tens digit comes first, then the ones.',
  });
}

const buildNumber: Lesson = {
  id: 'tens-build-a-number',
  title: 'Tens and ones in a number',
  goal: 'Build and read two-digit numbers as tens and ones.',
  standard: '1.NBT.2',
  emoji: '🏗️',
  teach: [
    show('Let\'s build 34. The 3 tells how many tens.', '3 tens: 10, 20, 30', blocks(3, 0)),
    show('The 4 tells how many ones.', '30 and 4 more', blocks(3, 4)),
    show('3 tens and 4 ones make 34.', '34 = 3 tens 4 ones', blocks(3, 4)),
    show('43 is different! 43 is 4 tens and 3 ones. Same digits, swapped places.', '43 = 4 tens 3 ones', blocks(4, 3)),
    doStep({
      say: 'Build 26. Tap plus ten for each ten, and plus one for each one.',
      caption: 'Build 26',
      model: blocks(0, 0, BUILD),
      solution: blocks(2, 6, BUILD),
      goal: (s) => s.tens === 2 && s.ones === 6,
      hint: fixBlocks(2, 6),
      then: '2 tens and 6 ones: 10, 20, 21, 22, 23, 24, 25, 26.',
    }),
    doStep({
      say: 'Now build 52.',
      caption: 'Build 52',
      model: blocks(0, 0, BUILD),
      solution: blocks(5, 2, BUILD),
      goal: (s) => s.tens === 5 && s.ones === 2,
      hint: fixBlocks(5, 2),
      then: '5 tens and 2 ones make 52. Not 25: the tens come first.',
    }),
    doStep({
      say: 'Build 40. Think: how many ones does 40 have?',
      caption: 'Build 40',
      model: blocks(0, 0, BUILD),
      solution: blocks(4, 0, BUILD),
      goal: (s) => s.tens === 4 && s.ones === 0,
      hint: fixBlocks(4, 0),
      then: '4 tens and no ones. The 0 says there are no loose ones.',
    }),
  ],
  practice: mix([1, readBlocks], [1, buildItem]),
  check: mix([1, wordsToNumber], [1, readBlocks], [1, buildItem]),
};

// --- 4. Comparing ----------------------------------------------------------------------

/**
 * Two numbers worth comparing: the digits swapped (53, 35), more ones but
 * fewer tens (29, 31), or the same tens (46, 43).
 */
function pair(): [number, number] {
  const kind = randomInt(0, 2);
  if (kind === 0) {
    let a = randomInt(1, 9), b = randomInt(1, 9);
    while (b === a) b = randomInt(1, 9);
    return [a * 10 + b, b * 10 + a];
  }
  if (kind === 1) {
    const t = randomInt(1, 8);
    return [t * 10 + randomInt(6, 9), (t + 1) * 10 + randomInt(0, 4)];
  }
  const t = randomInt(1, 9);
  const a = randomInt(0, 9);
  let b = randomInt(0, 9);
  while (b === a) b = randomInt(0, 9);
  return [t * 10 + a, t * 10 + b];
}

const numChoice = (n: number, pictured: boolean): Choice =>
  ({ value: String(n), label: String(n), model: pictured ? blocks(Math.floor(n / 10), n % 10) : undefined });

function moreOrLess(pictured: boolean) {
  return (): Item => {
    const [a, b] = pair();
    const more = Math.random() < 0.6;
    const answer = more ? Math.max(a, b) : Math.min(a, b);
    const other = more ? Math.min(a, b) : Math.max(a, b);
    return choiceItem({
      id: `pv-${more ? 'more' : 'less'}-${a}-${b}`,
      say: more ? `Which is more, ${a} or ${b}?` : `Which is less, ${a} or ${b}?`,
      prompt: more ? 'Which is more?' : 'Which is less?',
      answer: numChoice(answer, pictured),
      wrong: [numChoice(other, pictured)],
      hint: 'Look at the tens first. Only if the tens are the same, look at the ones.',
    });
  };
}

const SIGNS: Record<string, Choice> = {
  '>': { value: '>', label: '>', say: 'is more than' },
  '<': { value: '<', label: '<', say: 'is less than' },
  '=': { value: '=', label: '=', say: 'is the same as' },
};

function signItem(): Item {
  let [a, b] = pair();
  if (Math.random() < 0.5) [a, b] = [b, a];
  if (Math.random() < 0.12) b = a;
  const right = a > b ? '>' : a < b ? '<' : '=';
  return choiceItem({
    id: `pv-sign-${a}-${b}`,
    say: `${a} and ${b}. Which sign goes in between?`,
    prompt: `${a} ◯ ${b}`,
    answer: SIGNS[right],
    wrong: ['>', '<', '='].filter((s) => s !== right).map((s) => SIGNS[s]),
    hint: 'Compare the tens first. The open side of the sign faces the bigger number.',
  });
}

const compareNumbers: Lesson = {
  id: 'tens-compare',
  title: 'Which is more?',
  goal: 'Compare two-digit numbers by their tens, then their ones, and write >, = or <.',
  standard: '1.NBT.3',
  emoji: '⚖️',
  teach: [
    show('Which is more, 42 or 38? Here is 42: 4 tens and 2 ones.', '42', blocks(4, 2)),
    show('Here is 38: 3 tens and 8 ones. Lots of ones!', '38', blocks(3, 8)),
    show('But look at the tens first. 38 has only 3 tens, and 42 has 4 tens.', '3 tens < 4 tens', blocks(3, 8)),
    show('More tens means more. 42 is more than 38. The open mouth faces the bigger number.', '42 > 38', { model: 'text', text: '42 > 38' }),
    show('Same tens? Then look at the ones. 46 is more than 43.', '46 > 43', { model: 'text', text: '46 > 43' }),
    doStep({
      say: 'Build 53. Then we\'ll compare it with 35.',
      caption: 'Build 53',
      model: blocks(0, 0, BUILD),
      solution: blocks(5, 3, BUILD),
      goal: (s) => s.tens === 5 && s.ones === 3,
      hint: fixBlocks(5, 3),
      then: '53 has 5 tens. 35 has only 3 tens. So 53 is more: 53 > 35.',
    }),
    doStep({
      say: 'Build 31. Is 31 more than 29?',
      caption: 'Build 31',
      model: blocks(0, 0, BUILD),
      solution: blocks(3, 1, BUILD),
      goal: (s) => s.tens === 3 && s.ones === 1,
      hint: fixBlocks(3, 1),
      then: '31 has 3 tens. 29 has only 2 tens, even with 9 ones. 31 is more.',
    }),
  ],
  // Signs three times as often: they have three buttons, which keeps every
  // button's share of right answers even.
  practice: mix([1, moreOrLess(true)], [3, signItem]),
  check: mix([1, moreOrLess(false)], [1, signItem]),
};

// --- 5. 10 more, 10 less -------------------------------------------------------------

function tenMoreLess(pictured: boolean) {
  return (): Item => {
    const more = Math.random() < 0.5;
    const n = more ? randomInt(10, 89) : randomInt(20, 99);
    return numberItem({
      id: more ? `tens-more-${n}` : `tens-less-${n}`,
      say: more ? `What is 10 more than ${n}?` : `What is 10 less than ${n}?`,
      prompt: more ? `${n} + 10 = ?` : `${n} − 10 = ?`,
      answer: more ? n + 10 : n - 10,
      hint: more ? 'Add one ten. The ones stay the same.' : 'Take away one ten. The ones stay the same.',
      picture: pictured ? blocks(Math.floor(n / 10), n % 10) : undefined,
    });
  };
}

const tenMoreTenLess: Lesson = {
  id: 'tens-ten-more-ten-less',
  title: '10 more, 10 less',
  goal: 'Find 10 more and 10 less than a two-digit number in their head, without counting by ones.',
  standard: '1.NBT.5',
  emoji: '🔟',
  teach: [
    show('Here is 34: 3 tens and 4 ones.', '34', blocks(3, 4)),
    show('10 more: add one ten. Now 4 tens and 4 ones. 44.', '34 + 10 = 44', blocks(4, 4)),
    show('Only the tens changed. The ones stayed 4.', '34 → 44', blocks(4, 4)),
    show('10 less than 34: take away one ten. 2 tens and 4 ones. 24.', '34 − 10 = 24', blocks(2, 4)),
    doStep({
      say: 'Here is 27. Show 10 more than 27.',
      caption: '27 + 10',
      model: blocks(2, 7, BUILD),
      solution: blocks(3, 7, BUILD),
      goal: (s) => s.tens === 3 && s.ones === 7,
      hint: (s) => (s.ones !== 7 ? 'Leave the ones alone. 10 more only changes the tens.' : 'Add just one ten.'),
      then: '3 tens and 7 ones: 37. The ones stayed 7.',
    }),
    doStep({
      say: 'Here is 52. Show 10 less than 52. Tap a ten to take it away.',
      caption: '52 − 10',
      model: blocks(5, 2, BUILD),
      solution: blocks(4, 2, BUILD),
      goal: (s) => s.tens === 4 && s.ones === 2,
      hint: (s) => (s.ones !== 2 ? 'Leave the ones alone. 10 less only changes the tens.' : 'Take away just one ten.'),
      then: '4 tens and 2 ones: 42. One ten fewer.',
    }),
  ],
  practice: tenMoreLess(true),
  check: tenMoreLess(false),
};

// --- 6. Adding tens -------------------------------------------------------------------------

function addTens(pictured: boolean) {
  return (): Item => {
    const kind = randomInt(0, 2);
    if (kind === 0) {
      // 34 + 20: a number and some tens.
      const t = randomInt(1, 6), o = randomInt(1, 9), k = randomInt(1, 9 - t);
      const n = t * 10 + o;
      return numberItem({
        id: `tens-add-${n}-${k * 10}`,
        say: `What is ${n} plus ${k * 10}?`,
        prompt: `${n} + ${k * 10} = ?`,
        answer: n + k * 10,
        hint: `${k * 10} is ${tensWord(k)}. Count on by tens from ${n}. The ones stay the same.`,
        picture: pictured ? blocks(t, o) : undefined,
      });
    }
    // 50 + 30 or 80 − 30: tens and tens, everything within 90.
    const plus = kind === 1;
    const whole = randomInt(2, 9), b = randomInt(1, whole - 1), a = whole - b;
    return numberItem({
      id: plus ? `tens-add-${a * 10}-${b * 10}` : `tens-sub-${whole * 10}-${b * 10}`,
      say: plus ? `What is ${a * 10} plus ${b * 10}?` : `What is ${whole * 10} minus ${b * 10}?`,
      prompt: plus ? `${a * 10} + ${b * 10} = ?` : `${whole * 10} − ${b * 10} = ?`,
      answer: plus ? whole * 10 : a * 10,
      hint: plus ? `Think in tens: ${tensWord(a)} and ${tensWord(b)}.` : `Think in tens: ${tensWord(whole)} take away ${tensWord(b)}.`,
      picture: pictured ? blocks(plus ? a : whole, 0) : undefined,
    });
  };
}

const addingTens: Lesson = {
  id: 'tens-adding-tens',
  title: 'Adding tens',
  goal: 'Add tens to a two-digit number, and add and take away multiples of 10, by thinking in tens.',
  standard: '1.NBT.4',
  emoji: '🦘',
  teach: [
    show('34 + 20. Start at 34.', '34', { model: 'numberLine', min: 4, max: 94, start: 34, path: [], jumps: 10 }),
    show('20 is 2 tens: hop 10, then 10 more. 44, 54.', '34 + 20 = 54', { model: 'numberLine', min: 4, max: 94, start: 34, path: [44, 54], jumps: 10 }),
    show('The tens went from 3 to 5. The ones stayed 4.', '3 tens + 2 tens = 5 tens', { model: 'numberLine', min: 4, max: 94, start: 34, path: [44, 54], jumps: 10 }),
    show('Taking away tens works the same way. 54 − 30: hop back 3 tens. 44, 34, 24.', '54 − 30 = 24', { model: 'numberLine', min: 4, max: 94, start: 54, path: [44, 34, 24], jumps: 10 }),
    doStep({
      say: 'Find 23 + 30. Tap 23, then hop by tens.',
      caption: '23 + 30',
      model: { model: 'numberLine', min: 3, max: 93, start: null, path: [], jumps: 10 },
      solution: { model: 'numberLine', min: 3, max: 93, start: 23, path: [33, 43, 53], jumps: 10 },
      goal: (s) => s.start === 23 && s.path.length === 3 && last(s.path) === 53,
      hint: (s) => (s.start !== 23 ? 'Tap 23 to start.' : '30 is 3 tens: make 3 hops of ten.'),
      then: '33, 43, 53. 23 + 30 = 53.',
    }),
    doStep({
      say: 'Here is 41. Add 3 tens.',
      caption: '41 + 30',
      model: blocks(4, 1, BUILD),
      solution: blocks(7, 1, BUILD),
      goal: (s) => s.tens === 7 && s.ones === 1,
      hint: (s) => (s.ones !== 1 ? 'Adding tens leaves the ones alone.' : s.tens < 7 ? 'Add a ten for each of the 3 tens.' : 'Only 3 more tens. Take one back.'),
      then: '4 tens and 3 tens make 7 tens. 41 + 30 = 71.',
    }),
    doStep({
      say: 'Here is 60. Take away 2 tens.',
      caption: '60 − 20',
      model: blocks(6, 0, BUILD),
      solution: blocks(4, 0, BUILD),
      goal: (s) => s.tens === 4 && s.ones === 0,
      hint: (s) => (s.tens > 4 ? 'Tap a ten to take it away: 2 tens in all.' : 'Only 2 tens go away. Put one back.'),
      then: '6 tens take away 2 tens is 4 tens. 60 − 20 = 40.',
    }),
  ],
  practice: addTens(true),
  check: addTens(false),
};

export const UNIT: Unit = {
  id: 'tens-ones',
  title: 'Tens and ones',
  emoji: '🧱',
  about: 'Counting to 120, ten ones making a ten, building and comparing two-digit numbers, 10 more and 10 less, and adding tens.',
  colour: '#7E57C2',
  lessons: [countTo120, makeATen, buildNumber, compareNumbers, tenMoreTenLess, addingTens],
};

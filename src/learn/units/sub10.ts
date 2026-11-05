import { Lesson, Unit } from '../types';
import {
  bond, bondHint, choiceItem, crossFrame, crossHint, diffItem, fillHint, frame, hopGoal, hopHint, line,
  missingAdd, missingFirst, missingSub, onBond, onFrame, crossedCount, pick, placed, randomInt, shuffle,
  sumItem, things, trueOrFalse, weighted,
} from './helpers-arith';

// Unit: Taking away to 10.
//
// Taking away as some leaving (crossed out), as hopping back, and then as the
// other side of adding: the missing part of a bond, "3 + ? = 8", and the four
// facts of a family. That last idea is what turns subtraction from counting
// back into knowing.

const diffWithin = (max: number, minB = 1): [number, number] => {
  const a = randomInt(Math.max(2, minB + 1), max);
  return [a, randomInt(minB, a - 1)];
};

// --- 1. Taking away -----------------------------------------------------------

const TAKE_AWAY: Lesson = {
  id: 'sub-take-away',
  title: 'Taking away',
  goal: 'Knows that taking away means some leave, and counts the ones that are left.',
  standard: 'K.OA.1',
  emoji: '🍎',
  placedBy: { track: 'minus', stage: 2 },
  teach: [
    { type: 'show', say: 'Mia has 6 apples.', caption: '6 apples', model: things('🍎', 6) },
    { type: 'show', say: 'Mia eats 2 apples. Cross them out. They are gone.', caption: '6 take away 2', model: { ...things('🍎', 6), crossed: [4, 5] } },
    { type: 'show', say: 'Count the apples left: 1, 2, 3, 4. Mia has 4 apples now.', caption: '6 − 2 = 4', model: { ...things('🍎', 6), crossed: [4, 5], counted: [0, 1, 2, 3] } },
    { type: 'show', say: 'Take away means some go away. The number gets smaller.', caption: '6 − 2 = 4', model: { ...things('🍎', 6), crossed: [4, 5] } },
    {
      type: 'do',
      say: 'Your turn. Here are 7 counters. Take away 3. Tap 3 counters to cross them out.',
      caption: '7 − 3',
      model: frame(7, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCount(s) === 3),
      solution: crossFrame(7, 3, { takeAway: true }),
      hint: crossHint(3),
      then: '3 are crossed out. Count the rest: 4 are left. 7 take away 3 is 4.',
    },
    {
      type: 'do',
      say: 'Here are 5. Take away 1.',
      caption: '5 − 1',
      model: frame(5, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCount(s) === 1),
      solution: crossFrame(5, 1, { takeAway: true }),
      hint: crossHint(1),
      then: '1 is gone and 4 are left. 5 take away 1 is 4.',
    },
    { type: 'ask', item: diffItem(4, 2) },
  ],
  practice: () => diffItem(...diffWithin(5)),
  check: () => weighted([
    [3, () => diffItem(...diffWithin(5), null)],
    [1, () => { const [a, b] = diffWithin(5); return trueOrFalse(a, '−', b); }],
  ]),
};

// --- 2. Counting back ---------------------------------------------------------

const backPair = (): [number, number] => {
  const b = randomInt(1, 3);
  return [randomInt(b + 2, 10), b];
};

const COUNT_BACK: Lesson = {
  id: 'sub-count-back',
  title: 'Counting back',
  goal: 'Takes away 1, 2 or 3 by starting on the bigger number and counting back.',
  standard: '1.OA.5',
  emoji: '🐰',
  placedBy: { track: 'minus', stage: 3 },
  teach: [
    { type: 'show', say: "Let's do 9 take away 3. Start on 9. Taking away means hopping back.", caption: '9 − 3 = ?', model: line(9) },
    { type: 'show', say: 'Hop back 1. We land on 8.', caption: '9 … 8', model: line(9, [8]) },
    { type: 'show', say: '7, 6. That is 3 hops back. We land on 6.', caption: '9 − 3 = 6', model: line(9, [8, 7, 6]) },
    { type: 'show', say: 'Do not count the 9. You are standing on it. Count the hops.', caption: '3 hops back', model: line(9, [8, 7, 6]) },
    {
      type: 'do',
      say: 'Your turn: 8 take away 2. Tap 8, then hop back 2.',
      caption: '8 − 2',
      model: line(null),
      goal: hopGoal(8, -2),
      solution: line(8, [7, 6]),
      hint: hopHint(8, -2),
      then: '7, 6. 8 take away 2 is 6.',
    },
    {
      type: 'do',
      say: 'Now 10 take away 3. Start on 10 and count back 3.',
      caption: '10 − 3',
      model: line(null),
      goal: hopGoal(10, -3),
      solution: line(10, [9, 8, 7]),
      hint: hopHint(10, -3),
      then: '9, 8, 7. 10 take away 3 is 7.',
    },
    { type: 'ask', item: diffItem(6, 2, line(6)) },
  ],
  practice: () => { const [a, b] = backPair(); return diffItem(a, b, line(a)); },
  check: () => weighted([
    [3, () => diffItem(...backPair(), null)],
    [1, () => { const [a, b] = backPair(); return trueOrFalse(a, '−', b); }],
  ]),
};

// --- 3. Take away none, one, or all -------------------------------------------

function noneOneAll(picture: boolean) {
  const n = randomInt(2, 10);
  const b = pick([0, 1, n]);
  return diffItem(n, b, picture ? crossFrame(n, b) : null);
}

const NONE_ONE_ALL: Lesson = {
  id: 'sub-none-one-all',
  title: 'Take away none, one, or all',
  goal: 'Knows at sight what is left after taking away 0, 1, or everything.',
  standard: '1.OA.6',
  emoji: '0️⃣',
  placedBy: { track: 'minus', stage: 4 },
  teach: [
    { type: 'show', say: 'Here are 5 counters.', caption: '5', model: frame(5) },
    { type: 'show', say: 'Take away all 5. None are left. 5 take away 5 is 0.', caption: '5 − 5 = 0', model: crossFrame(5, 5) },
    { type: 'show', say: 'Take away 0. Nothing goes. Still 5.', caption: '5 − 0 = 5', model: frame(5) },
    { type: 'show', say: 'Take away 1. It is the number just before: 4.', caption: '5 − 1 = 4', model: crossFrame(5, 1) },
    {
      type: 'do',
      say: 'Your turn. Show 8 take away 8. Cross them all out.',
      caption: '8 − 8',
      model: frame(8, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCount(s) === 8),
      solution: crossFrame(8, 8, { takeAway: true }),
      hint: crossHint(8),
      then: 'When you take them all, 0 are left. 8 take away 8 is 0.',
    },
    {
      type: 'do',
      say: 'Now 9 take away 1. Cross out just 1.',
      caption: '9 − 1',
      model: frame(9, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCount(s) === 1),
      solution: crossFrame(9, 1, { takeAway: true }),
      hint: crossHint(1),
      then: '8 are left. 8 comes just before 9.',
    },
    { type: 'ask', item: diffItem(7, 0) },
  ],
  practice: () => noneOneAll(true),
  check: () => noneOneAll(false),
};

// --- 4. The missing part ------------------------------------------------------

const partPair = (): [number, number] => {
  const whole = randomInt(5, 10);
  return [whole, randomInt(1, whole - 1)];
};

function splitTask(whole: number, left: number) {
  return {
    goal: onBond((s) => s.whole === whole && s.split === left),
    solution: bond(whole, [left, whole - left], left),
    hint: bondHint((s) => ((s.split ?? whole) > left
      ? `Move counters to the right side until ${left} are on the left.`
      : `Move counters back to the left side until there are ${left}.`)),
  };
}

const MISSING_PART: Lesson = {
  id: 'sub-missing-part',
  title: 'The missing part',
  goal: 'Finds the missing part of a number bond: 8 is 5 and how many?',
  standard: '1.OA.4',
  emoji: '🧩',
  placedBy: { track: 'minus', stage: 4 },
  teach: [
    { type: 'show', say: 'Here are 8 counters, in two parts. 5 here, 3 there. The parts make the whole.', caption: '5 + 3 = 8', model: bond(8, [5, 3], 5) },
    { type: 'show', say: 'Now one part is hiding. 8 in all, and 5 here. How many are hiding?', caption: '8 = 5 + ?', model: bond(8, [5, null], 5) },
    { type: 'show', say: '3 are hiding, because 5 and 3 make 8. So 8 take away 5 is 3.', caption: '8 − 5 = 3', model: bond(8, [5, 3], 5) },
    {
      type: 'do',
      say: 'Your turn. Here are 7. Move counters so 4 are on the left.',
      caption: '7 = 4 + ?',
      model: bond(7, [null, null], 7),
      ...splitTask(7, 4),
      then: '4 on the left, 3 on the right. 4 and 3 make 7.',
    },
    {
      type: 'do',
      say: 'Here are 9. Move counters so 6 are on the left. How many go on the right?',
      caption: '9 = 6 + ?',
      model: bond(9, [null, null], 9),
      ...splitTask(9, 6),
      then: '6 and 3 make 9. So the missing part is 3.',
    },
    { type: 'ask', item: missingAdd(6, 10, bond(10, [6, null])) },
  ],
  practice: () => {
    const [whole, a] = partPair();
    const hint = `The parts make ${whole}. Count up from ${a} to ${whole}.`;
    return weighted([
      [2, () => missingAdd(a, whole, bond(whole, [a, null]), hint)],
      [1, () => missingFirst(a, whole, bond(whole, [null, a]), hint)],
      [2, () => diffItem(whole, a, bond(whole, [a, null]))],
    ]);
  },
  check: () => {
    const [whole, a] = partPair();
    return weighted([
      [2, () => missingAdd(a, whole)],
      [1, () => missingFirst(a, whole)],
      [1, () => diffItem(whole, a, null)],
    ]);
  },
  review: () => { const [whole, a] = partPair(); return missingAdd(a, whole); },
};

// --- 5. Think addition --------------------------------------------------------

const thinkPair = (): [number, number] => {
  const a = randomInt(6, 10);
  return [a, randomInt(4, a - 2)];
};
const thinkHint = (a: number, b: number) => `Think adding: ${b} and how many more make ${a}?`;

const THINK_ADDITION: Lesson = {
  id: 'sub-think-addition',
  title: 'Think addition',
  goal: 'Subtracts by thinking of the adding fact: 8 − 3 is "3 and how many make 8?"',
  standard: '1.OA.4',
  emoji: '🤔',
  placedBy: { track: 'minus', stage: 4 },
  teach: [
    { type: 'show', say: '8 take away 3. Here is a trick. Think: 3 and how many more make 8?', caption: '8 − 3 = ?', model: frame(3) },
    { type: 'show', say: 'Put in more until there are 8. 4, 5, 6, 7, 8. That is 5 more.', caption: '3 + 5 = 8', model: frame(3, 5) },
    { type: 'show', say: '3 and 5 make 8. So 8 take away 3 is 5!', caption: '8 − 3 = 5', model: frame(3, 5) },
    {
      type: 'do',
      say: 'Your turn: 9 take away 4. Think 4 and how many make 9. Put in counters until there are 9.',
      caption: '4 + ? = 9',
      model: frame(4, 0, { tray: { a: 0, b: 7 } }),
      goal: onFrame((s) => placed(s) === 9),
      solution: frame(4, 5, { tray: { a: 0, b: 2 } }),
      hint: fillHint(9),
      then: 'You put in 5. 4 and 5 make 9, so 9 take away 4 is 5.',
    },
    {
      type: 'do',
      say: 'Now 10 take away 6. Put in counters until there are 10.',
      caption: '6 + ? = 10',
      model: frame(6, 0, { tray: { a: 0, b: 6 } }),
      goal: onFrame((s) => placed(s) === 10),
      solution: frame(6, 4, { tray: { a: 0, b: 2 } }),
      hint: fillHint(10),
      then: '6 and 4 make 10, so 10 take away 6 is 4.',
    },
    { type: 'ask', item: diffItem(7, 5, frame(5), thinkHint(7, 5)) },
  ],
  practice: () => {
    const [a, b] = thinkPair();
    return weighted([
      [3, () => diffItem(a, b, frame(b), thinkHint(a, b))],
      [2, () => missingAdd(b, a, frame(b))],
      [1, () => missingSub(a, a - b, frame(b), thinkHint(a, a - b))],
    ]);
  },
  check: () => { const [a, b] = thinkPair(); return diffItem(a, b, null, thinkHint(a, b)); },
};

// --- 6. Fact families ---------------------------------------------------------

const familyOf = (a: number, b: number): string[] =>
  [`${a} + ${b} = ${a + b}`, `${b} + ${a} = ${a + b}`, `${a + b} − ${a} = ${b}`, `${a + b} − ${b} = ${a}`];

/** "Which one belongs with 3 + 4 = 7?": the others are true-looking sentences from outside the family. */
function belongsWith(a: number, b: number) {
  const w = a + b;
  const family = familyOf(a, b);
  const right = pick(family.slice(1));
  const wrong = shuffle([
    `${w} + ${a} = ${w + a}`, // true, but adds to the whole
    `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}`, // true, but the parts taken from each other
    `${w} − ${a} = ${b + 1}`, // one off
  ].filter((x) => !family.includes(x))).slice(0, 2);
  const speak = (t: string) => t.replace('−', 'take away').replace('+', 'plus').replace('=', 'is');
  return choiceItem(
    {
      id: `family-${a}+${b}`,
      say: `${speak(family[0])}. Which one is in the same family?`,
      prompt: `${family[0]}. Same family?`,
      hint: `A family uses only ${a}, ${b} and ${w}.`,
    },
    { value: right, label: right, say: speak(right) },
    wrong.map((x) => ({ value: x, label: x, say: speak(x) })),
  );
}

const familyPair = (): [number, number] => {
  const a = randomInt(2, 7);
  return [a, randomInt(2, 10 - a)];
};

const FACT_FAMILIES: Lesson = {
  id: 'sub-fact-families',
  title: 'Fact families',
  goal: 'Sees that 3 + 4 = 7, 4 + 3 = 7, 7 − 3 = 4 and 7 − 4 = 3 are one family of facts.',
  standard: '1.OA.4',
  emoji: '👨‍👩‍👧',
  placedBy: { track: 'minus', stage: 4 },
  teach: [
    { type: 'show', say: 'Here is 7, made of 3 and 4. These three numbers are a family.', caption: '3, 4, 7', model: bond(7, [3, 4], 3) },
    { type: 'show', say: 'Put the parts together. 3 plus 4 is 7, and 4 plus 3 is 7.', caption: '3 + 4 = 7   4 + 3 = 7', model: bond(7, [3, 4], 3) },
    { type: 'show', say: 'Take a part away from 7, and the other part is left.', caption: '7 − 3 = 4   7 − 4 = 3', model: bond(7, [3, 4], 3) },
    { type: 'show', say: 'Four facts, one family. Know one, and you know them all!', caption: '4 facts', model: bond(7, [3, 4], 3) },
    {
      type: 'do',
      say: 'Your turn. Make 9 out of 2 and 7. Move counters so 2 are on the left.',
      caption: '9 = 2 + 7',
      model: bond(9, [null, null], 9),
      ...splitTask(9, 2),
      then: '2 plus 7 is 9, and so is 7 plus 2. 9 take away 2 is 7.',
    },
    {
      type: 'do',
      say: 'Now make 10 out of 6 and 4. Put 6 on the left.',
      caption: '10 = 6 + 4',
      model: bond(10, [null, null], 10),
      ...splitTask(10, 6),
      then: '6 and 4 make 10. So 10 take away 6 is 4, and 10 take away 4 is 6.',
    },
    { type: 'ask', item: belongsWith(3, 5) },
  ],
  practice: () => {
    const [a, b] = familyPair();
    const pic = bond(a + b, [a, b]);
    return pick([sumItem(a, b, pic), sumItem(b, a, pic), diffItem(a + b, a, pic), diffItem(a + b, b, pic)]);
  },
  check: () => {
    const [a, b] = familyPair();
    return weighted([
      [3, () => pick([diffItem(a + b, a, null), diffItem(a + b, b, null), sumItem(b, a, null)])],
      [1, () => belongsWith(a, b)],
    ]);
  },
  review: () => { const [a, b] = familyPair(); return diffItem(a + b, a, null); },
};

export const UNIT: Unit = {
  id: 'sub-10',
  title: 'Taking away to 10',
  emoji: '➖',
  about: 'What taking away means, counting back, and then using adding to subtract: missing parts, "think addition" and fact families.',
  colour: '#E37B2A',
  lessons: [TAKE_AWAY, COUNT_BACK, NONE_ONE_ALL, MISSING_PART, THINK_ADDITION, FACT_FAMILIES],
};

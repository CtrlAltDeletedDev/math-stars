import { additionHint } from '@/engine/questionGenerator';
import { Lesson, Unit } from '../types';
import {
  crossFrame, crossHint, crossedCells, diffItem, frame, frameHint, frames2, hopGoal, hopHint, inFrame, line,
  missingSub, onBond, onFrame, bond, bondHint, placed, randomInt, sameAsItem, sumItem, trayCount,
  trueOrFalse, weighted, FrameState, range, moveCounters,
} from './helpers-arith';

// Unit: Adding and taking away to 20.
//
// The facts that cross ten are the biggest step in first-grade arithmetic, and
// counting cannot replace a strategy for them. Each lesson is one family of
// facts, in the order of the plus / minus stages (src/core/stages.ts): teen
// numbers take away, doubles and near doubles, adding 9, making a ten, and
// going back through ten. Two ten frames are the model throughout -- the first
// frame is the ten -- and the number line for going back.

const either = (x: number, y: number): [number, number] => (Math.random() < 0.5 ? [x, y] : [y, x]);

/** The two numbers of a sum in their own frames: how the make-a-ten lessons picture a + b. */
const apart = (a: number, b: number): FrameState => frames2([a, 0], [0, b]);

/** The same, ready for them to move counters between the frames. */
const toMove = (a: number, b: number): FrameState => frames2([a, 0], [0, b], { tray: { a: 0, b: 0 } });

// --- 1. Teen numbers take away ------------------------------------------------

const teenPair = (): [number, number] => {
  const ones = randomInt(1, 9);
  return [10 + ones, Math.random() < 0.5 ? ones : 10];
};

const TEEN_TAKE_AWAY: Lesson = {
  id: 'w20-teen-take-away',
  title: 'Teen take away',
  goal: 'Takes the ones or the ten away from a teen number (14 − 4, 14 − 10) by seeing it as a ten and some ones.',
  standard: '1.NBT.2',
  emoji: '✂️',
  placedBy: { track: 'minus', stage: 5 },
  teach: [
    { type: 'show', say: '14 is a full ten, and 4 more.', caption: '14 = 10 + 4', model: frame(14) },
    { type: 'show', say: '14 take away 4. Cross out the 4 ones. The full ten is left!', caption: '14 − 4 = 10', model: crossFrame(14, 4) },
    { type: 'show', say: 'Now 14 take away 10. Cross out the whole ten. The 4 ones are left.', caption: '14 − 10 = 4', model: frame(14, 0, { crossed: range(0, 10) }) },
    {
      type: 'do',
      say: 'Your turn. Show 16 take away 6. Cross out the 6 ones.',
      caption: '16 − 6',
      model: frame(16, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCells(s).length === 6),
      solution: crossFrame(16, 6, { takeAway: true }),
      hint: crossHint(6),
      then: 'All the ones are gone. The full ten is left. 16 take away 6 is 10.',
    },
    {
      type: 'do',
      say: 'Now 13 take away 10. Cross out the whole ten frame.',
      caption: '13 − 10',
      model: frame(13, 0, { takeAway: true }),
      goal: onFrame((s) => crossedCells(s).length === 10 && crossedCells(s).every((i) => i < 10)),
      solution: frame(13, 0, { takeAway: true, crossed: range(0, 10) }),
      hint: frameHint((s) => {
        const c = crossedCells(s);
        if (c.some((i) => i >= 10)) return 'Leave the ones. Cross out only the full ten frame.';
        return `Cross out every counter in the full frame. ${10 - c.length} to go.`;
      }),
      then: 'The ten is gone. 3 ones are left. 13 take away 10 is 3.',
    },
    { type: 'ask', item: diffItem(18, 8) },
  ],
  practice: () => {
    const [a, b] = teenPair();
    return weighted([
      [4, () => diffItem(a, b)],
      [1, () => missingSub(a, 10, frame(a), 'Cross out the ones until just the full ten is left.')],
      [1, () => diffItem(a, a - 10)],
    ]);
  },
  check: () => weighted([
    [3, () => diffItem(...teenPair(), null)],
    [1, () => { const [a, b] = teenPair(); return trueOrFalse(a, '−', b); }],
  ]),
};

// --- 2. Doubles and near doubles ----------------------------------------------

const nearPair = (): [number, number] => {
  if (Math.random() < 0.4) { const n = randomInt(5, 10); return [n, n]; }
  const n = randomInt(4, 9);
  return either(n, n + 1);
};

function twoFramesHint(top: number, bottom: number) {
  return frameHint((s) => {
    const t = inFrame(s, 0);
    const b = inFrame(s, 1);
    if (t !== top) return `The first frame has ${t}. Make it ${top}.`;
    if (b !== bottom) return `The second frame has ${b}. Make it ${bottom}.`;
    return 'Count each frame.';
  });
}

const NEAR_DOUBLES: Lesson = {
  id: 'w20-near-doubles',
  title: 'Doubles and near doubles',
  goal: 'Knows the doubles to 10 + 10, and uses them for near doubles: 6 + 7 is 6 + 6 and 1 more.',
  standard: '1.OA.6',
  emoji: '👯',
  placedBy: { track: 'plus', stage: 6 },
  teach: [
    { type: 'show', say: '6 plus 6 is a double. 6 here and 6 here. Together they make 12.', caption: '6 + 6 = 12', model: apart(6, 6) },
    { type: 'show', say: 'Now 6 plus 7. Look, it is almost a double. 6 plus 6, and 1 more.', caption: '6 + 7 = 6 + 6 + 1', model: apart(6, 7) },
    { type: 'show', say: '6 plus 6 is 12. And 1 more makes 13.', caption: '6 + 7 = 13', model: apart(6, 7) },
    { type: 'show', say: 'When two numbers sit next to each other, use the double!', caption: 'Double, then 1 more', model: apart(6, 7) },
    {
      type: 'do',
      say: 'Make the double 7 plus 7. Put 7 in each frame.',
      caption: '7 + 7',
      model: frames2([0, 0], [0, 0], { tray: { a: 7, b: 7 } }),
      goal: onFrame((s) => inFrame(s, 0) === 7 && inFrame(s, 1) === 7),
      solution: frames2([7, 0], [0, 7], { tray: { a: 0, b: 0 } }),
      hint: twoFramesHint(7, 7),
      then: '7 and 7. A double. That is 14.',
    },
    {
      type: 'do',
      say: 'Now make it 7 plus 8. Add 1 more to the second frame.',
      caption: '7 + 8',
      model: frames2([7, 0], [0, 7], { tray: { a: 0, b: 1 } }),
      goal: onFrame((s) => inFrame(s, 0) === 7 && inFrame(s, 1) === 8),
      solution: frames2([7, 0], [0, 8], { tray: { a: 0, b: 0 } }),
      hint: twoFramesHint(7, 8),
      then: '7 plus 7 is 14, and 1 more is 15. 7 plus 8 is 15.',
    },
    { type: 'ask', item: sumItem(8, 9, apart(8, 9)) },
  ],
  practice: () => { const [a, b] = nearPair(); return sumItem(a, b, apart(a, b)); },
  check: () => weighted([
    [3, () => sumItem(...nearPair(), null)],
    [1, () => { const [a, b] = nearPair(); return trueOrFalse(a, '+', b); }],
  ]),
};

// --- 3. Adding 9 --------------------------------------------------------------

const ninePair = (): [number, number] => either(9, randomInt(2, 9));

/** Make the frame holding `full` a full ten by moving counters into it; nothing lost. */
function fillFrameGoal(k: 0 | 1, total: number) {
  return onFrame((s) => inFrame(s, k) === 10 && placed(s) === total);
}

function moveHint(k: 0 | 1, total: number) {
  const which = k === 0 ? 'first' : 'second';
  const other = k === 0 ? 'second' : 'first';
  return frameHint((s) => {
    if (trayCount(s) > 0) return `Now tap an empty space in the ${which} frame to put the counter there.`;
    if (inFrame(s, k) < 10) return `Tap a counter in the ${other} frame to pick it up.`;
    if (placed(s) < total) return 'Put the rest of the counters back on the frames.';
    return `The ${which} frame is full.`;
  });
}

const ADD_NINE: Lesson = {
  id: 'w20-add-nine',
  title: 'Adding 9',
  goal: 'Adds 9 by moving 1 over to make a ten: 9 + 6 is 10 + 5.',
  standard: '1.OA.6',
  emoji: '9️⃣',
  placedBy: { track: 'plus', stage: 7 },
  teach: [
    { type: 'show', say: '9 plus 5. Look at the 9. It is just 1 away from a full ten.', caption: '9 + 5 = ?', model: apart(9, 5) },
    { type: 'show', say: 'Move 1 counter up. Now there is a full ten, and 4 more.', caption: '10 + 4', model: frames2([9, 1], [0, 4]) },
    { type: 'show', say: '10 and 4 make 14. So 9 plus 5 is 14!', caption: '9 + 5 = 14', model: frames2([9, 1], [0, 4]) },
    {
      type: 'do',
      say: 'Your turn: 9 plus 7. Move 1 counter up to fill the ten.',
      caption: '9 + 7',
      model: toMove(9, 7),
      goal: fillFrameGoal(0, 16),
      solution: moveCounters(toMove(9, 7), [16], [9]),
      hint: moveHint(0, 16),
      then: 'A full ten and 6 more. 10 plus 6 is 16, so 9 plus 7 is 16.',
    },
    {
      type: 'do',
      say: 'Now 6 plus 9. Which frame is almost full? Fill that ten.',
      caption: '6 + 9',
      model: toMove(6, 9),
      goal: fillFrameGoal(1, 15),
      solution: moveCounters(toMove(6, 9), [5], [19]),
      hint: frameHint((s) => (inFrame(s, 0) === 10
        ? 'That works, but the 9 is closer. Fill the frame with 9 in it.'
        : moveHint(1, 15)(s))),
      then: 'The 9 took 1 from the 6. 10 and 5 make 15.',
    },
    { type: 'ask', item: sameAsItem(9, 8, 10, 'Move 1 over to the 9 to make 10. What is left of the 8?', frames2([9, 0], [0, 8])) },
  ],
  practice: () => {
    const [a, b] = ninePair();
    const other = a === 9 ? b : a;
    return weighted([
      [4, () => sumItem(a, b, apart(a, b))],
      [2, () => sameAsItem(9, other, 10, `Move 1 over to the 9 to make 10. What is left of the ${other}?`, apart(9, other))],
    ]);
  },
  check: () => sumItem(...ninePair(), null),
};

// --- 4. Make a ten ------------------------------------------------------------

const bridgePair = (): [number, number] => {
  const a = randomInt(3, 8);
  return [a, randomInt(11 - a, 9)];
};

const MAKE_TEN: Lesson = {
  id: 'w20-make-ten',
  title: 'Make a ten',
  goal: 'Adds across ten by making a ten first: 8 + 5 is 8 + 2 + 3, which is 10 + 3.',
  standard: '1.OA.6',
  emoji: '🔟',
  placedBy: { track: 'plus', stage: 8 },
  teach: [
    { type: 'show', say: "Let's add 8 and 5. 8 needs 2 more to fill its ten frame.", caption: '8 + 5 = ?', model: apart(8, 5) },
    { type: 'show', say: 'Move 2 counters up. Now the ten is full, and 3 are left over.', caption: '8 + 2 = 10', model: frames2([8, 2], [0, 3]) },
    { type: 'show', say: 'A ten and 3 more is 13. So 8 plus 5 is 13!', caption: '10 + 3 = 13', model: frames2([8, 2], [0, 3]) },
    {
      type: 'do',
      say: 'Your turn: 7 plus 6. Move counters up until the first frame is full.',
      caption: '7 + 6',
      model: toMove(7, 6),
      goal: fillFrameGoal(0, 13),
      solution: moveCounters(toMove(7, 6), [15, 14, 13], [7, 8, 9]),
      hint: moveHint(0, 13),
      then: '7 needed 3. That left 3 more. 10 and 3 make 13.',
    },
    {
      type: 'do',
      say: '6 plus 8. Fill the frame that is closer to 10.',
      caption: '6 + 8',
      model: toMove(6, 8),
      goal: fillFrameGoal(1, 14),
      solution: moveCounters(toMove(6, 8), [5, 4], [18, 19]),
      hint: frameHint((s) => (inFrame(s, 0) === 10
        ? 'That works too, but 8 is closer to 10. Fill the frame with 8 in it.'
        : moveHint(1, 14)(s))),
      then: '8 needed 2, so the 6 gave 2. 10 and 4 make 14.',
    },
    {
      type: 'do',
      say: 'For 8 plus 5, the 8 needs 2. Split the 5: move counters so 2 are on the left.',
      caption: '5 = 2 + ?',
      model: bond(5, [null, null], 5),
      goal: onBond((s) => s.whole === 5 && s.split === 2),
      solution: bond(5, [2, 3], 2),
      hint: bondHint((s) => ((s.split ?? 0) > 2 ? 'Move counters to the right until just 2 are on the left.' : 'Move counters to the left until 2 are there.')),
      then: '5 is 2 and 3. 8 and 2 make 10, and 3 more is 13.',
    },
    { type: 'ask', item: sameAsItem(8, 6, 10, 'Fill the ten first. 8 needs 2. What is left of the 6?', apart(8, 6)) },
  ],
  practice: () => {
    const [a, b] = bridgePair();
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return weighted([
      [4, () => sumItem(a, b, apart(a, b))],
      [2, () => sameAsItem(big, small, 10, `Fill the ten first. ${big} needs ${10 - big}. What is left of the ${small}?`, apart(big, small))],
    ]);
  },
  check: () => sumItem(...bridgePair(), null),
  review: () => { const [a, b] = bridgePair(); return sumItem(a, b, null); },
};

// --- 5. Back through ten ------------------------------------------------------

const backPair = (): [number, number] => {
  const a = randomInt(11, 17);
  return [a, randomInt(a - 9, 9)];
};

const BACK_THROUGH_TEN: Lesson = {
  id: 'w20-back-through-ten',
  title: 'Back through ten',
  goal: 'Takes away across ten by stopping at 10 on the way: 13 − 5 is 13 − 3, then 2 more.',
  standard: '1.OA.6',
  emoji: '⬅️',
  placedBy: { track: 'minus', stage: 8 },
  teach: [
    { type: 'show', say: "Let's do 13 take away 5. We hop back, and we stop at 10 on the way.", caption: '13 − 5 = ?', model: line(13, [], 20) },
    { type: 'show', say: '12, 11, 10. 3 hops back gets us to 10.', caption: '13 − 3 = 10', model: line(13, [12, 11, 10], 20) },
    { type: 'show', say: '5 is 3 and 2. So 2 more hops: 9, 8.', caption: '10 − 2 = 8', model: line(13, [12, 11, 10, 9, 8], 20) },
    { type: 'show', say: 'We landed on 8. 13 take away 5 is 8.', caption: '13 − 5 = 8', model: line(13, [12, 11, 10, 9, 8], 20) },
    {
      type: 'do',
      say: 'Your turn: 14 take away 6. First, hop back to 10.',
      caption: '14 − 6',
      model: line(14, [], 20),
      goal: hopGoal(14, -4),
      solution: line(14, [13, 12, 11, 10], 20),
      hint: hopHint(14, -4),
      then: 'That was 4 hops. 6 is 4 and 2, so 2 hops are still to go.',
    },
    {
      type: 'do',
      say: 'Now hop back 2 more.',
      caption: '10 − 2',
      model: line(14, [13, 12, 11, 10], 20),
      goal: hopGoal(14, -6),
      solution: line(14, [13, 12, 11, 10, 9, 8], 20),
      hint: hopHint(14, -6),
      then: '9, 8. 14 take away 6 is 8.',
    },
    { type: 'ask', item: diffItem(12, 4, line(12, [], 20)) },
  ],
  practice: () => {
    const [a, b] = backPair();
    return weighted([
      [4, () => diffItem(a, b, line(a, [], 20))],
      [2, () => missingSub(a, 10, line(a, [], 20), `Start on ${a} and hop back until you reach 10. Count the hops.`)],
    ]);
  },
  check: () => weighted([
    [3, () => diffItem(...backPair(), null)],
    [1, () => { const [a, b] = backPair(); return trueOrFalse(a, '−', b); }],
  ]),
};

// --- 6. Choose a way ----------------------------------------------------------

/** One fact from any family in this unit, each with the hint for its own strategy. */
function anyFact(picture: boolean) {
  return weighted([
    [1, () => { const [a, b] = nearPair(); return sumItem(a, b, picture ? apart(a, b) : null); }],
    [1, () => { const [a, b] = ninePair(); return sumItem(a, b, picture ? apart(a, b) : null); }],
    [2, () => { const [a, b] = bridgePair(); return sumItem(a, b, picture ? apart(a, b) : null); }],
    [1, () => { const [a, b] = teenPair(); return diffItem(a, b, picture ? crossFrame(a, b) : null); }],
    [2, () => { const [a, b] = backPair(); return diffItem(a, b, picture ? crossFrame(a, b) : null); }],
    [1, () => { const n = randomInt(6, 9); return diffItem(2 * n, n, picture ? crossFrame(2 * n, n) : null, `Think of a double. What number plus itself makes ${2 * n}?`); }],
  ]);
}

const CHOOSE_A_WAY: Lesson = {
  id: 'w20-choose-a-way',
  title: 'Choose a way',
  goal: 'Picks a strategy for any fact within 20: a double, make a ten, or go back through ten.',
  standard: '1.OA.6',
  emoji: '🧠',
  // Mixed plus and minus: known only once they are past both.
  placedBy: [{ track: 'plus', stage: 9 }, { track: 'minus', stage: 9 }],
  teach: [
    { type: 'show', say: '7 plus 8. The numbers sit next to each other. A near double! 7 plus 7, and 1 more.', caption: '7 + 8 = 7 + 7 + 1', model: apart(7, 8) },
    { type: 'show', say: '9 plus 6. The 9 is almost a ten. Move 1 up: 10 plus 5.', caption: '9 + 6 = 10 + 5', model: frames2([9, 1], [0, 5]) },
    { type: 'show', say: '15 take away 6. Take the 5 ones to get to 10. Then 1 more.', caption: '15 − 5 − 1', model: frame(15, 0, { crossed: [9, ...range(10, 15)] }) },
    { type: 'show', say: 'Every fact has a quick way. Look at the numbers first!', caption: 'Look first', model: frame(15, 0, { crossed: [9, ...range(10, 15)] }) },
    {
      type: 'do',
      say: '17 take away 8. Cross out the 7 ones first, then 1 from the ten.',
      caption: '17 − 8',
      model: frame(17, 0, { takeAway: true }),
      goal: onFrame((s) => {
        const c = crossedCells(s);
        return c.length === 8 && range(10, 17).every((i) => c.includes(i));
      }),
      solution: frame(17, 0, { takeAway: true, crossed: range(9, 17) }),
      hint: frameHint((s) => {
        const c = crossedCells(s);
        const ones = c.filter((i) => i >= 10).length;
        if (ones < 7) return `Cross out all the ones in the second frame first. ${7 - ones} to go.`;
        if (c.length < 8) return 'Now cross out 1 from the full ten.';
        if (c.length > 8) return 'That is too many crossed out. Tap a crossed one to bring it back.';
        return 'Count the ones you crossed out.';
      }),
      then: '7 ones took us to 10, and 1 more is 9. 17 take away 8 is 9.',
    },
    {
      type: 'do',
      say: 'Show 6 plus 7 as a near double. Put 6 in the first frame and 7 in the second.',
      caption: '6 + 7',
      model: frames2([0, 0], [0, 0], { tray: { a: 6, b: 8 } }),
      goal: onFrame((s) => inFrame(s, 0) === 6 && inFrame(s, 1) === 7),
      solution: frames2([6, 0], [0, 7], { tray: { a: 0, b: 1 } }),
      hint: twoFramesHint(6, 7),
      then: '6 plus 6 is 12, and the extra 1 makes 13.',
    },
    { type: 'ask', item: sumItem(9, 4, apart(9, 4), additionHint(9, 4)) },
  ],
  practice: () => anyFact(true),
  check: () => anyFact(false),
};

export const UNIT: Unit = {
  id: 'within-20',
  title: 'Adding and taking away to 20',
  emoji: '🔟',
  about: 'The facts that cross ten: teen numbers as a ten and ones, doubles and near doubles, adding 9, making a ten, and going back through ten.',
  colour: '#2E9E5B',
  lessons: [TEEN_TAKE_AWAY, NEAR_DOUBLES, ADD_NINE, MAKE_TEN, BACK_THROUGH_TEN, CHOOSE_A_WAY],
};

import type { Lesson } from '../learn';

// Skip Counting (counting-up) lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// Skip counting the way first grade does it: by 2s with pairs of shoes, by 5s
// with the fingers on a hand and with nickels, by 10s with full ten frames and
// tens rods, and in second grade equal groups, where "5, 10, 15" becomes the
// start of the times tables. The wrong choices are the ones the skip-count and
// times-table questions offer in play (questionGenerator.ts): counting on by
// 1s, jumping a step too far, saying the last number again, one group too many
// or too few, and adding the two numbers instead.
//
// Every hop line counts from a multiple of its step, so each hop lands on a
// number she says out loud.

const COUNT_BY_2S: Lesson = {
  id: 'skip-count-2s',
  title: 'Counting by 2s',
  emoji: '👟',
  places: [{ skillId: 'counting-up', rung: 0 }],
  practiceLevelId: 'skip-2',
  // "That's counting by 1s" is written for counting on by ones
  // (counted-the-wrong-thing); "too far, that's 2 hops" and "8 is already
  // there" for skipping a step or repeating the last number (wrong-multiple).
  helpsWith: ['counted-the-wrong-thing', 'wrong-multiple'],
  steps: [
    {
      kind: 'watch',
      say: 'Shoes come in pairs. Each pair is 2 shoes. You can count them 2 at a time!',
      caption: 'Pairs of 👟',
      scene: { kind: 'groups', groups: 5, size: 2, emoji: '👟' },
    },
    {
      kind: 'watch',
      say: 'Say one number for each pair. 2, 4, 6, 8, 10. There are 10 shoes!',
      caption: '2, 4, 6, 8, 10',
      scene: { kind: 'groups', groups: 5, size: 2, emoji: '👟', counting: true },
    },
    {
      kind: 'watch',
      say: 'On the number line, each hop is 2 long. You jump over a number every time. 2, 4, 6, 8, 10, 12.',
      caption: 'Hop by 2s',
      scene: { kind: 'numberLine', max: 20, start: 0, hops: 6, dir: 1, step: 2, animate: true },
    },
    {
      kind: 'try',
      say: 'Your turn. 2, 4, 6, 8. What comes next?',
      caption: '2, 4, 6, 8, ?',
      scene: { kind: 'groups', groups: 4, size: 2, emoji: '👟' },
      choices: ['10', '9', '12', '8'],
      answer: '10',
      hints: {
        '9': "That's counting by 1s. Counting by 2s jumps over a number: from 8, jump over 9.",
        '12': "Too far! That's 2 hops. Hop just once, 2 more than 8.",
        '8': '8 is already there. What comes after 8 when you count by 2s?',
      },
      then: {
        say: 'Yes! 8 and 2 more is 10. 2, 4, 6, 8, 10.',
        caption: '2, 4, 6, 8, 10',
        scene: { kind: 'groups', groups: 5, size: 2, emoji: '👟', counting: true },
      },
    },
    {
      kind: 'try',
      say: 'This one starts in the middle. 12, 14, 16. What comes next?',
      caption: '12, 14, 16, ?',
      scene: { kind: 'numberLine', max: 20, start: 16 },
      choices: ['18', '17', '20', '16'],
      answer: '18',
      hints: {
        '17': "That's counting by 1s. Hop 2 from 16: jump over 17.",
        '20': "Too far! That's 2 hops. Hop just once, 2 more than 16.",
        '16': '16 is the last number you can see. Hop 2 more!',
      },
      then: {
        say: 'Yes! 12, 14, 16, 18. Each hop is 2 more.',
        caption: '12, 14, 16, 18',
        scene: { kind: 'numberLine', max: 20, start: 12, hops: 3, dir: 1, step: 2, animate: true },
      },
    },
  ],
};

const COUNT_BY_5S: Lesson = {
  id: 'skip-count-5s',
  title: 'Counting by 5s',
  emoji: '🖐️',
  places: [{ skillId: 'counting-up', rung: 1 }],
  practiceLevelId: 'skip-5',
  // "That's counting by 1s" answers counted-the-wrong-thing; "you jumped 2
  // hops" and "20 is the last number you can see" answer wrong-multiple.
  helpsWith: ['counted-the-wrong-thing', 'wrong-multiple'],
  steps: [
    {
      kind: 'watch',
      say: 'Hold up your hand. It has 5 fingers! Here are 4 hands. Let\'s count all the fingers by 5s.',
      caption: '4 hands, 5 fingers each',
      scene: { kind: 'big', text: '🖐️🖐️🖐️🖐️' },
    },
    {
      kind: 'watch',
      say: 'Each hop is one hand: 5 more fingers. 5, 10, 15, 20. 4 hands have 20 fingers!',
      caption: '5, 10, 15, 20',
      scene: { kind: 'numberLine', max: 50, start: 0, hops: 4, dir: 1, step: 5, animate: true },
    },
    {
      kind: 'watch',
      say: 'Nickels count by 5s too. Each nickel is worth 5 cents. 5, 10, 15, 20, 25. 5 nickels make 25 cents!',
      caption: '5 nickels = 25¢',
      scene: { kind: 'coins', coins: [5, 5, 5, 5, 5], counting: true, names: true },
    },
    {
      kind: 'try',
      say: 'Your turn. 5, 10, 15, 20. What comes next?',
      caption: '5, 10, 15, 20, ?',
      scene: { kind: 'numberLine', max: 50, start: 20 },
      choices: ['25', '21', '30', '20'],
      answer: '25',
      hints: {
        '21': "That's counting by 1s. A hop of 5 from 20 goes 21, 22, 23, 24, 25.",
        '30': 'You jumped 2 hops. Just one hop of 5 from 20.',
        '20': '20 is the last number you can see. Count 5 more!',
      },
      then: {
        say: 'Yes! 20 and 5 more is 25. 5, 10, 15, 20, 25.',
        caption: '5, 10, 15, 20, 25',
        scene: { kind: 'numberLine', max: 50, start: 0, hops: 5, dir: 1, step: 5, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'This one starts in the middle. 30, 35, 40. What comes next?',
      caption: '30, 35, 40, ?',
      scene: { kind: 'numberLine', max: 50, start: 40 },
      choices: ['45', '41', '50', '40'],
      answer: '45',
      hints: {
        '41': "That's counting by 1s. Hop a whole 5 from 40.",
        '50': 'Too far! That is 2 hops of 5. Hop just once.',
        '40': '40 is the last number you can see. Count 5 more!',
      },
      then: {
        say: 'Yes! 30, 35, 40, 45. Counting by 5s, the numbers end in 5, then 0, then 5.',
        caption: '30, 35, 40, 45',
        scene: { kind: 'numberLine', max: 50, start: 30, hops: 3, dir: 1, step: 5, animate: true },
      },
    },
  ],
};

const COUNT_BY_10S: Lesson = {
  id: 'skip-count-10s',
  title: 'Counting by 10s',
  emoji: '🧱',
  places: [{ skillId: 'counting-up', rung: 2 }],
  practiceLevelId: 'skip-10',
  // "41 is just 1 more" and "that's counting by 1s" answer
  // counted-the-wrong-thing; "you jumped 2 tens", "too far" and "the last
  // number" answer wrong-multiple.
  helpsWith: ['counted-the-wrong-thing', 'wrong-multiple'],
  steps: [
    {
      kind: 'watch',
      say: "A full ten frame holds 10 dots. Here are 3 full ten frames. Let's count the dots by 10s!",
      caption: '3 full tens',
      scene: { kind: 'groups', groups: 3, size: 10, emoji: '🔴' },
    },
    {
      kind: 'watch',
      say: 'Say one number for each ten frame. 10, 20, 30. There are 30 dots!',
      caption: '10, 20, 30',
      scene: { kind: 'groups', groups: 3, size: 10, emoji: '🔴', counting: true },
    },
    {
      kind: 'watch',
      say: 'Tens rods count the same way. Each rod is 10 cubes. 10, 20, 30, 40, 50. 5 rods make 50!',
      caption: '5 tens = 50',
      scene: { kind: 'tensOnes', numbers: [50] },
    },
    {
      kind: 'try',
      say: 'Your turn. 10, 20, 30, 40. What comes next?',
      caption: '10, 20, 30, 40, ?',
      scene: { kind: 'tensOnes', numbers: [40] },
      choices: ['50', '41', '60', '40'],
      answer: '50',
      hints: {
        '41': '41 is just 1 more. Add a whole ten: 1 more rod.',
        '60': 'You jumped 2 tens. Just 1 more ten after 40.',
        '40': '40 is the last number you can see. Add 1 more ten!',
      },
      then: {
        say: 'Yes! 4 tens and 1 more ten make 5 tens. 50!',
        caption: '10, 20, 30, 40, 50',
        scene: { kind: 'tensOnes', numbers: [50] },
      },
    },
    {
      kind: 'try',
      say: 'This one starts in the middle. 60, 70. What comes next?',
      caption: '60, 70, ?',
      scene: { kind: 'tensOnes', numbers: [70] },
      choices: ['80', '71', '90', '70'],
      answer: '80',
      hints: {
        '71': "That's counting by 1s. Add a whole ten to 70.",
        '90': 'Too far! That is 2 more tens. Add just 1 ten.',
        '70': '70 is the last number you can see. Count 10 more!',
      },
      then: {
        say: 'Yes! 60, 70, 80. Each hop is 10 more.',
        caption: '60, 70, 80',
        scene: { kind: 'numberLine', max: 100, start: 60, hops: 2, dir: 1, step: 10, animate: true },
      },
    },
  ],
};

const EQUAL_GROUPS: Lesson = {
  id: 'equal-groups',
  title: 'Equal Groups',
  emoji: '🍪',
  places: [{ skillId: 'counting-up', rung: 4 }],
  practiceLevelId: 'times-5',
  // "That's 4 plus 5" and "that's 2 plus 6" are written for adding the two
  // numbers instead (wrong-operation); "that's only 3 plates" and "that's 5
  // plates" for one group too few or too many (wrong-multiple).
  helpsWith: ['wrong-operation', 'wrong-multiple'],
  steps: [
    {
      kind: 'watch',
      say: 'Here are 3 plates. Each plate has 5 cookies. Every plate has the same number, so these are equal groups.',
      caption: '3 groups of 5',
      scene: { kind: 'groups', groups: 3, size: 5, emoji: '🍪' },
    },
    {
      kind: 'watch',
      say: 'Count the cookies by 5s. Say one number for each plate. 5, 10, 15. 3 groups of 5 make 15!',
      caption: '5, 10, 15',
      scene: { kind: 'groups', groups: 3, size: 5, emoji: '🍪', counting: true },
    },
    {
      kind: 'watch',
      say: 'You can add them: 5 plus 5 plus 5 is 15. The short way to write 3 groups of 5 is 3 times 5. 3 times 5 is 15.',
      caption: '3 × 5 = 15',
      scene: { kind: 'big', text: '5 + 5 + 5 = 15\n3 × 5 = 15' },
    },
    {
      // Play asks the table first ("5 × 3"), and school will read that as 5
      // groups of 3. Turning it around keeps the convention and still lets her
      // count by the number she knows.
      kind: 'watch',
      say: 'Turn it around, and the answer stays the same. 5 times 3 is 15 too. So for 5 times 3, count by 5s, 3 times. 5, 10, 15.',
      caption: '5 × 3 = 15 too',
      scene: { kind: 'big', text: '3 × 5 = 15\n5 × 3 = 15' },
    },
    {
      kind: 'try',
      say: 'Your turn. 4 plates, with 5 cookies on each. How many cookies?',
      caption: '4 groups of 5',
      scene: { kind: 'groups', groups: 4, size: 5, emoji: '🍪' },
      choices: ['20', '9', '15', '25'],
      answer: '20',
      hints: {
        '9': "That's 4 plus 5. Every plate has 5 cookies! Count by 5s, one number for each plate.",
        '15': "That's only 3 plates. Say one number for each of the 4 plates: 5, 10, 15, 20.",
        '25': "That's 5 plates. There are just 4. Count again: 5, 10, 15, 20.",
      },
      then: {
        say: 'Yes! 5, 10, 15, 20. 4 groups of 5 make 20.',
        caption: '4 × 5 = 20',
        scene: { kind: 'groups', groups: 4, size: 5, emoji: '🍪', counting: true },
      },
    },
    {
      kind: 'try',
      say: 'What is 2 times 6? Turn it around: 6 groups of 2. Count by 2s, one number for each group.',
      caption: '2 × 6 = ?',
      scene: { kind: 'groups', groups: 6, size: 2, emoji: '🍓' },
      choices: ['12', '8', '10', '14'],
      answer: '12',
      hints: {
        '8': "That's 2 plus 6. Times is not plus! Count by 2s, one number for each of the 6 groups.",
        '10': "That's only 5 groups. Say one number for each of the 6 groups.",
        '14': "That's 7 groups. There are just 6. Count again by 2s.",
      },
      then: {
        say: 'Yes! 2, 4, 6, 8, 10, 12. 2 times 6 is 12.',
        caption: '2 × 6 = 12',
        scene: { kind: 'groups', groups: 6, size: 2, emoji: '🍓', counting: true },
      },
    },
  ],
};

export const COUNTING_UP_LESSONS: Lesson[] = [COUNT_BY_2S, COUNT_BY_5S, COUNT_BY_10S, EQUAL_GROUPS];

import type { Lesson } from '../learn';

// Counting lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The four ideas a kindergarten and first-grade class builds counting from:
// one number for each thing and the last number says how many; a teen number
// is a ten and some more; next is one more and before is one less; and after
// 9 ones comes a new ten, all the way to 100. The wrong choices are the ones
// countGen.ts offers in play: a missed or doubled thing, the whole when asked
// for one kind, 81 for 18, the last number on screen said again, and 30 after
// 39.

const TOUCH_AND_COUNT: Lesson = {
  id: 'touch-and-count',
  title: 'Touch and Count',
  emoji: '👆',
  places: [{ skillId: 'counting', rung: 0 }],
  practiceLevelId: 'count-1',
  // "Did you miss one?" and "did you count one frog twice?" are written for
  // landing one off, and "7 is all the fruit" for counting every thing when
  // asked for one kind.
  helpsWith: ['off-by-one', 'answered-the-whole'],
  steps: [
    {
      kind: 'watch',
      say: "Let's count the ducks. Touch each duck one time, and say one number for each duck.",
      caption: 'How many 🦆?',
      scene: { kind: 'objects', n: 7, emoji: '🦆' },
    },
    {
      kind: 'watch',
      say: '1, 2, 3, 4, 5, 6, 7. The last number you say tells how many. There are 7 ducks!',
      caption: '7 ducks',
      scene: { kind: 'objects', n: 7, emoji: '🦆', counting: true },
    },
    {
      kind: 'watch',
      say: 'Sometimes two kinds are mixed up. To count the dogs, touch only the dogs. 1, 2, 3. There are 3 dogs. The ducks do not count!',
      caption: 'Only the 🐶: 3',
      scene: { kind: 'big', text: '🐶🦆🐶🦆🐶🦆🦆' },
    },
    {
      kind: 'try',
      say: 'Your turn. Touch each frog and count. How many frogs are there?',
      caption: 'How many 🐸?',
      scene: { kind: 'objects', n: 8, emoji: '🐸' },
      choices: ['8', '7', '9'],
      answer: '8',
      hints: {
        '7': 'Did you miss one? Touch every frog, so none gets left out.',
        '9': 'Did you count one frog twice? Each frog gets just one number.',
      },
      then: {
        say: 'Yes! 1, 2, 3, 4, 5, 6, 7, 8. The last number is 8, so there are 8 frogs.',
        caption: '8 frogs',
        scene: { kind: 'objects', n: 8, emoji: '🐸', counting: true },
      },
    },
    {
      kind: 'try',
      say: 'Now count only the apples. How many apples are there?',
      caption: 'How many 🍎?',
      scene: { kind: 'big', text: '🍎🍎🍌🍎🍌🍎🍌' },
      choices: ['4', '7', '3'],
      answer: '4',
      hints: {
        '7': '7 is all the fruit. You counted the bananas too! Touch only the apples.',
        '3': '3 is how many bananas there are. Count the apples this time.',
      },
      then: {
        say: 'Yes! 1, 2, 3, 4. There are 4 apples. The bananas are not apples.',
        caption: '4 apples',
        scene: { kind: 'objects', n: 4, emoji: '🍎', counting: true },
      },
    },
  ],
};

const TEN_AND_SOME_MORE: Lesson = {
  id: 'ten-and-some-more',
  title: 'A Ten and Some More',
  emoji: '🌸',
  places: [{ skillId: 'counting', rung: 1 }],
  practiceLevelId: 'count-2',
  // "61 is a much bigger number" and "31 is 3 tens" are written for writing
  // the digit she hears first, "6 is just the extra row" and "3 is just the
  // eggs outside" for dropping the ten — both tagged place-value. "Did you
  // count one twice?" and "count on just 3" are for landing one off.
  helpsWith: ['place-value', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'Counting lots of things? Make a ten first. A full ten frame holds 10.',
      caption: 'A full ten: 10',
      scene: { kind: 'tenFrame', first: 10, emoji: '🌸' },
    },
    {
      kind: 'watch',
      say: "Here is a full ten, and 8 more flowers. You don't need to count the ten again. Start at 10 and count on: 11, 12, 13, 14, 15, 16, 17, 18.",
      caption: '10 and 8 more',
      scene: { kind: 'tenFrame', first: 10, outside: 8, emoji: '🌸' },
    },
    {
      kind: 'watch',
      say: '10 and 8 make 18. When you write 18, the 1 comes first. The 1 is for the ten. Then comes the 8.',
      caption: '18 = 1 ten and 8',
      scene: { kind: 'tensOnes', numbers: [18] },
    },
    {
      kind: 'try',
      say: 'How many stars are there? The top row is a full 10. Count on from there.',
      caption: 'How many ⭐?',
      scene: { kind: 'objects', n: 16, emoji: '⭐' },
      choices: ['16', '61', '6', '17'],
      answer: '16',
      hints: {
        '61': '61 is a much bigger number! There is 1 ten and 6 more. Write the 1 for the ten first.',
        '6': '6 is just the extra row. Don\'t forget the full 10! 10 and 6 more.',
        '17': 'Did you count one star twice? Start at 10 and count on: 11, 12, 13, 14, 15, 16.',
      },
      then: {
        say: 'Yes! A full ten and 6 more. 16 stars!',
        caption: '10 + 6 = 16',
        scene: { kind: 'objects', n: 16, emoji: '⭐', counting: true },
      },
    },
    {
      kind: 'try',
      say: 'A full ten frame of eggs, and 3 more eggs. How many eggs?',
      caption: '10 + 3 = ?',
      scene: { kind: 'tenFrame', first: 10, outside: 3, emoji: '🥚' },
      choices: ['13', '31', '3', '14'],
      answer: '13',
      hints: {
        '31': '31 is 3 tens and 1. Here there is just 1 ten, and 3 more. The 1 comes first.',
        '3': '3 is just the eggs outside. Don\'t forget the full ten!',
        '14': 'Start at 10 and count on just 3: 11, 12, 13.',
      },
      then: {
        say: 'Yes! 10 and 3 more is 13. 1 ten and 3 ones.',
        caption: '10 + 3 = 13',
        scene: { kind: 'objects', n: 13, emoji: '🥚', counting: true },
      },
    },
  ],
};

const NEXT_AND_BEFORE: Lesson = {
  id: 'next-and-before',
  title: 'Next and Before',
  emoji: '👣',
  places: [{ skillId: 'counting', rung: 2 }],
  practiceLevelId: 'count-3',
  // "17 is the last number you can see" and "14 is already there" are written
  // for answering with a number on screen; "you skipped one" and "too far
  // back" for landing one off; "19 is bigger than 10" (?, 10, 11) and "31 is 3
  // tens" for keeping or swapping the ten.
  helpsWith: ['answered-a-given-number', 'off-by-one', 'place-value'],
  steps: [
    {
      kind: 'watch',
      say: 'Numbers go in order, like on a number line. What comes after 13? Put your finger on 13, and hop forward 1. You land on 14!',
      caption: 'After 13 comes 14',
      scene: { kind: 'numberLine', max: 20, start: 13, hops: 1, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'What comes before 13? Hop back 1. You land on 12. Next is 1 more. Before is 1 less.',
      caption: 'Before 13 comes 12',
      scene: { kind: 'numberLine', max: 20, start: 13, hops: 1, dir: -1, animate: true },
    },
    {
      kind: 'try',
      say: 'Your turn. 15, 16, 17. What number comes next?',
      caption: '15, 16, 17, ?',
      scene: { kind: 'numberLine', max: 20, start: 17 },
      choices: ['18', '17', '19', '14'],
      answer: '18',
      hints: {
        '17': '17 is the last number you can see. What do you say after 17?',
        '19': 'You skipped one! Say the very next number after 17.',
        '14': '14 comes before 15. Next means go forward!',
      },
      then: {
        say: 'Yes! 15, 16, 17, 18. 18 is 1 more than 17.',
        caption: '15, 16, 17, 18',
        scene: { kind: 'numberLine', max: 20, start: 17, hops: 1, dir: 1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'Now go back. What number comes just before 10?',
      caption: '?, 10, 11',
      scene: { kind: 'numberLine', max: 20, start: 10 },
      choices: ['9', '19', '8', '12'],
      answer: '9',
      hints: {
        '19': '19 is bigger than 10. The number before 10 is smaller! Hop back just 1.',
        '8': 'Too far back! Hop back just 1 from 10.',
        '12': '12 comes after 11. Before means go back!',
      },
      then: {
        say: 'Yes! Hop back 1 from 10, and you land on 9. 9, 10, 11.',
        caption: '9, 10, 11',
        scene: { kind: 'numberLine', max: 20, start: 10, hops: 1, dir: -1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'What number is missing? What goes between 12 and 14?',
      caption: '12, ?, 14',
      scene: { kind: 'numberLine', max: 20, start: 12 },
      choices: ['13', '31', '14'],
      answer: '13',
      hints: {
        '31': '31 is 3 tens and 1, a much bigger number. 13 is 1 ten and 3, so the 1 comes first.',
        '14': '14 is already there, after the gap. What comes right after 12?',
      },
      then: {
        say: 'Yes! 12, 13, 14. 13 is 1 more than 12.',
        caption: '12, 13, 14',
        scene: { kind: 'numberLine', max: 20, start: 12, hops: 1, dir: 1, animate: true },
      },
    },
  ],
};

const COUNT_PAST_A_TEN: Lesson = {
  id: 'count-past-a-ten',
  title: 'Counting Past a Ten',
  emoji: '💯',
  places: [{ skillId: 'counting', rung: 3 }],
  // No Counting level goes past 20 yet; this is the nearest.
  practiceLevelId: 'count-3',
  // "30 is smaller than 39" and "after 49 comes 50, not 40" are written for
  // the ones rolling over while the ten stays (place-value); "39 is the last
  // number you can see" for saying it again; "did you count 47 as a hop?" for
  // landing one short; "that's counting back" for going the wrong way.
  helpsWith: ['place-value', 'answered-a-given-number', 'off-by-one', 'wrong-operation'],
  steps: [
    {
      kind: 'watch',
      say: "Let's count on. 26, 27, 28, 29. What comes after 29?",
      caption: '26, 27, 28, 29, ?',
      scene: { kind: 'tensOnes', numbers: [29] },
    },
    {
      kind: 'watch',
      say: '29 is 2 tens and 9 ones. 1 more makes 10 ones, and 10 ones make a new ten! Now there are 3 tens. That is 30.',
      caption: '29 + 1 = 30',
      scene: { kind: 'tensOnes', numbers: [30] },
    },
    {
      kind: 'watch',
      say: 'After 29 comes 30. The tens go up by 1, and the ones start again at 0. 29, 30, 31.',
      caption: '29, 30, 31',
      scene: { kind: 'numberLine', max: 40, start: 29, hops: 2, dir: 1, animate: true },
    },
    {
      kind: 'try',
      say: 'Your turn. 37, 38, 39. What number comes next?',
      caption: '37, 38, 39, ?',
      scene: { kind: 'tensOnes', numbers: [39] },
      choices: ['40', '30', '39', '41'],
      answer: '40',
      hints: {
        '30': '30 is smaller than 39! After 39, the ones start again at 0 and the tens go up. 3 tens become 4 tens.',
        '39': '39 is the last number you can see. What do you say after 39?',
        '41': 'You skipped one! 40 comes first, then 41.',
      },
      then: {
        say: 'Yes! 39 and 1 more is 40. 4 tens, and 0 ones.',
        caption: '37, 38, 39, 40',
        scene: { kind: 'tensOnes', numbers: [40] },
      },
    },
    {
      kind: 'try',
      say: 'Start at 47 and count on 4. Where do you land?',
      caption: '47 + 4 = ?',
      scene: { kind: 'numberLine', max: 60, start: 47 },
      choices: ['51', '50', '41', '43'],
      answer: '51',
      hints: {
        '50': 'Did you count 47 as a hop? You start on 47. Your first hop lands on 48: 48, 49, 50, 51.',
        '41': 'After 49 comes 50, not 40! The tens go up. Count again: 48, 49, 50, 51.',
        '43': "That's counting back. Count on means go forward: 48, 49, 50, 51.",
      },
      then: {
        say: 'Yes! 48, 49, 50, 51. You went past the ten and landed on 51.',
        caption: '47 + 4 = 51',
        scene: { kind: 'numberLine', max: 60, start: 47, hops: 4, dir: 1, animate: true },
      },
    },
  ],
};

export const COUNTING_LESSONS: Lesson[] = [TOUCH_AND_COUNT, TEN_AND_SOME_MORE, NEXT_AND_BEFORE, COUNT_PAST_A_TEN];

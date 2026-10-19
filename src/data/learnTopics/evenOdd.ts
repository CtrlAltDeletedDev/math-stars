import type { Lesson } from '../learn';

// Even & Odd lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// Second grade finds out whether a number is even the two ways the standard
// names: by pairing things up (a thing left without a partner means odd) and by
// counting by 2s (the numbers you land on are even, the ones you hop over are
// odd). Past 10 the counting by 2s shows that even numbers end in 0, 2, 4, 6 or
// 8, and that the 1 at the front of a teen number is a ten, which always pairs
// up: so 14 is even, whatever the 1 makes it look like. The wrong choices are
// the ones evenOddGen.ts offers in play: the number next to the answer, odd
// numbers that look big, teens whose 1 makes them look odd, and 0.
//
// No `helpsWith` in this file. Every wrong answer this topic's questions offer
// is tagged 'unknown' (see the note at the top of evenOddGen.ts), so there is no
// mistake for a lesson to be the answer to. Play still offers these on a
// demotion, nearest rung first.

const PAIR_THEM_UP: Lesson = {
  id: 'pair-them-up',
  title: 'Pair Them Up',
  emoji: '👟',
  places: [{ skillId: 'even-odd', rung: 0 }],
  practiceLevelId: 'eo-id',
  steps: [
    {
      kind: 'watch',
      say: 'Shoes come in pairs. Here are 6 shoes, put 2 by 2. Every shoe has a partner. That means 6 is even.',
      caption: '6 shoes: even',
      scene: { kind: 'pairs', n: 6, emoji: '👟' },
    },
    {
      kind: 'watch',
      say: 'Now here are 7 shoes, put 2 by 2. Oh no! 1 shoe has no partner. When 1 is left over, the number is odd. 7 is odd.',
      caption: '7 shoes: odd',
      scene: { kind: 'pairs', n: 7, emoji: '👟' },
    },
    {
      kind: 'try',
      say: 'Is 8 even or odd? Look at the end of the row. Is 1 apple left over?',
      caption: 'Is 8 even or odd?',
      scene: { kind: 'pairs', n: 8, emoji: '🍎' },
      choices: ['Even', 'Odd'],
      answer: 'Even',
      hints: {
        Odd: 'Look at the end of the row. Every apple has a partner. No apple is left over!',
      },
      then: {
        say: 'Yes! Every apple has a partner. 8 is even.',
        caption: '8 is even',
        scene: { kind: 'pairs', n: 8, emoji: '🍎' },
      },
    },
    {
      kind: 'try',
      say: 'These ducks are not in pairs yet. Is 5 even or odd? Put them 2 by 2 in your head.',
      caption: 'Is 5 even or odd?',
      scene: { kind: 'objects', n: 5, emoji: '🦆' },
      choices: ['Even', 'Odd'],
      answer: 'Odd',
      hints: {
        Even: 'Make the pairs: 1 pair, 2 pairs. Then 1 duck is left, with no partner.',
      },
      then: {
        say: 'Yes! 2 pairs, and 1 duck left over. 5 is odd.',
        caption: '5 is odd',
        scene: { kind: 'pairs', n: 5, emoji: '🦆' },
      },
    },
    {
      kind: 'try',
      say: 'No picture this time. Is 9 even or odd? Picture 9 shoes, 2 by 2.',
      caption: 'Is 9 even or odd?',
      scene: { kind: 'big', text: '9' },
      choices: ['Even', 'Odd'],
      answer: 'Odd',
      hints: {
        Even: 'Picture 9 shoes 2 by 2: 2, 4, 6, 8. Then 1 shoe is left, with no partner.',
      },
      then: {
        say: 'Yes! 4 pairs, and 1 shoe left over. 9 is odd.',
        caption: '9 is odd',
        scene: { kind: 'pairs', n: 9, emoji: '👟' },
      },
    },
  ],
};

const HOP_BY_2S: Lesson = {
  id: 'even-hops-by-2',
  title: 'Count by 2s',
  emoji: '🦘',
  places: [{ skillId: 'even-odd', rung: 0 }],
  practiceLevelId: 'eo-id',
  steps: [
    {
      kind: 'watch',
      say: 'Count by 2s on the number line. Start on 0, and hop 2 each time. 2, 4, 6, 8, 10.',
      caption: '2, 4, 6, 8, 10',
      scene: { kind: 'numberLine', max: 10, start: 0, hops: 5, step: 2, animate: true },
    },
    {
      kind: 'watch',
      say: 'Every number you land on is even. 2, 4, 6, 8 and 10 are even.',
      caption: 'Even: 2, 4, 6, 8, 10',
      scene: { kind: 'numberLine', max: 10, start: 0, hops: 5, step: 2 },
    },
    {
      kind: 'watch',
      say: 'The numbers you hop over are odd. 1, 3, 5, 7 and 9 are odd. Even, odd, even, odd. They take turns!',
      caption: 'Odd: 1, 3, 5, 7, 9',
      scene: { kind: 'big', text: '1  3  5  7  9' },
    },
    {
      kind: 'try',
      say: 'Which number is even? Count by 2s from 0 to check.',
      caption: 'Which number is even?',
      scene: { kind: 'numberLine', max: 10, start: 0 },
      choices: ['8', '9', '3'],
      answer: '8',
      hints: {
        '9': '9 is big, but big does not mean even. Count by 2s: 6, 8, 10. You hop right over 9!',
        '3': 'Count by 2s: 2, 4. You hop right over 3, so 3 is odd.',
      },
      then: {
        say: 'Yes! 2, 4, 6, 8. You land on 8, so 8 is even.',
        caption: '8 is even',
        scene: { kind: 'numberLine', max: 10, start: 0, hops: 4, step: 2, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'Now find the odd one. Which number is odd?',
      caption: 'Which number is odd?',
      scene: { kind: 'numberLine', max: 10, start: 0 },
      choices: ['7', '6', '10'],
      answer: '7',
      hints: {
        '6': 'Count by 2s: 2, 4, 6. You land on 6, so 6 is even. Find a number you hop over.',
        '10': '10 is big, but you land on it when you count by 2s: 2, 4, 6, 8, 10. 10 is even.',
      },
      then: {
        say: 'Yes! 2, 4, 6, 8. You hop right over 7, so 7 is odd.',
        caption: '7 is odd',
        scene: { kind: 'numberLine', max: 10, start: 0, hops: 4, step: 2, animate: true },
      },
    },
  ],
};

const LAST_DIGIT: Lesson = {
  id: 'even-odd-last-digit',
  title: 'Look at the Last Digit',
  emoji: '🔍',
  places: [{ skillId: 'even-odd', rung: 1 }],
  practiceLevelId: 'eo-find',
  steps: [
    {
      kind: 'watch',
      say: 'Keep counting by 2s, past 10. 12, 14, 16, 18, 20. Look at the last digits: 2, 4, 6, 8, 0. Even numbers always end in 0, 2, 4, 6 or 8.',
      caption: '12, 14, 16, 18, 20',
      scene: { kind: 'numberLine', max: 20, start: 10, hops: 5, step: 2, animate: true },
    },
    {
      kind: 'watch',
      say: 'Here is 14. 14 is 1 ten and 4 ones. Does the 1 make 14 odd? No! A ten is 5 pairs, so a ten never has 1 left over. Look at the last digit, 4.',
      caption: '14 = 1 ten and 4',
      scene: { kind: 'tensOnes', numbers: [14] },
    },
    {
      kind: 'watch',
      say: 'Put 14 in pairs. The ten makes 5 pairs, and the 4 ones make 2 more. Every one has a partner! 14 ends in 4, and 14 is even.',
      caption: '14 is even',
      scene: { kind: 'pairs', n: 14 },
    },
    {
      kind: 'try',
      say: 'Is 16 even or odd? Look at the last digit.',
      caption: 'Is 16 even or odd?',
      scene: { kind: 'tensOnes', numbers: [16] },
      choices: ['Even', 'Odd'],
      answer: 'Even',
      hints: {
        Odd: 'Did the 1 make it look odd? The 1 is a ten, and a ten is all pairs. Look at the last digit, 6.',
      },
      then: {
        say: 'Yes! 16 ends in 6, and 6 is even. Every one has a partner.',
        caption: '16 is even',
        scene: { kind: 'pairs', n: 16 },
      },
    },
    {
      kind: 'try',
      say: 'Which number is odd? Look at the last digit of each one.',
      caption: 'Which number is odd?',
      choices: ['15', '12', '18', '0'],
      answer: '15',
      hints: {
        '12': '12 ends in 2, so 12 is even. The 1 in front is just a ten.',
        '18': '18 ends in 8, so 18 is even. The 1 in front is just a ten.',
        '0': '0 is even! When you count by 2s, you start on 0: 0, 2, 4.',
      },
      then: {
        say: 'Yes! 15 ends in 5. Odd numbers end in 1, 3, 5, 7 or 9. Put 15 in pairs, and 1 is left over.',
        caption: '15 is odd',
        scene: { kind: 'pairs', n: 15 },
      },
    },
    {
      kind: 'try',
      say: 'What is the next even number after 14?',
      caption: 'Next even after 14?',
      scene: { kind: 'numberLine', max: 20, start: 14 },
      choices: ['16', '15', '18'],
      answer: '16',
      hints: {
        '15': '15 comes right after 14, but 15 ends in 5, so 15 is odd. Hop 2, not 1!',
        '18': '18 is even, but you hopped past 16. Hop just once, by 2.',
      },
      then: {
        say: 'Yes! Hop 2 from 14, and you land on 16. 16 ends in 6, so 16 is even.',
        caption: '14 → 16',
        scene: { kind: 'numberLine', max: 20, start: 14, hops: 1, step: 2, animate: true },
      },
    },
  ],
};

export const EVEN_ODD_LESSONS: Lesson[] = [PAIR_THEM_UP, HOP_BY_2S, LAST_DIGIT];

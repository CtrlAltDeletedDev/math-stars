import type { Lesson } from '../learn';

// Fractions lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// Shares the way first and second grade meet them (1.G.3, 2.G.3): a shape cut
// into 2 equal parts is cut into halves, and 2 parts that are not the same size
// are not halves at all; 4 equal parts are fourths, and cutting the same shape
// into more equal parts makes each part smaller; then, in second grade, thirds.
// Each lesson writes the fraction the way play does, 1 on top for the parts
// shaded and the number of equal parts underneath, and every "try" asks one of
// play's two questions ("What fraction is shaded?", "Which fraction means one
// half?") with wrong choices play offers on that picture (learn-money.test.ts
// checks them): the empty parts counted instead of the shaded ones, the shaded
// parts counted against the empty ones (1 shaded, 3 not: "1/3"), and the parts
// miscounted.
//
// No `helpsWith` here: fractions questions at these rungs carry no tags, so
// there is no mistake for a lesson to be the answer to. Play still offers them
// on a demotion, nearest rung first. Fractions has no levels, so there is no
// practiceLevelId either: "Practice it now" opens Play on fractions.

const HALVES: Lesson = {
  id: 'halves',
  title: 'Halves',
  emoji: '🥪',
  places: [{ skillId: 'fractions', rung: 0 }],
  steps: [
    {
      kind: 'watch',
      say: 'This square is cut into 2 parts. The 2 parts are the same size. They are equal parts. 2 equal parts are called halves.',
      caption: '2 equal parts = halves',
      scene: { kind: 'fraction', shape: 'square', parts: 2, shaded: 0 },
    },
    {
      kind: 'watch',
      say: 'This circle is cut into 2 parts too. But look! 1 part is big, and 1 part is small. The parts are not equal, so they are not halves.',
      caption: 'Not equal: not halves',
      scene: { kind: 'fraction', shape: 'circle', parts: 2, shaded: 1, unequal: true },
    },
    {
      kind: 'watch',
      say: 'This bar is cut into 2 equal parts, and 1 part is shaded. That is 1 half. We write it with a 2 on the bottom, for the 2 equal parts, and a 1 on top, for the 1 part shaded.',
      caption: '1 of 2 equal parts = 1/2',
      scene: { kind: 'fraction', shape: 'bar', parts: 2, shaded: 1 },
    },
    {
      kind: 'try',
      say: 'Your turn! Is this bar cut into halves?',
      caption: 'Is it cut into halves?',
      scene: { kind: 'fraction', shape: 'bar', parts: 2, shaded: 0, unequal: true },
      choices: ['Yes', 'No'],
      answer: 'No',
      hints: {
        Yes: 'It has 2 parts, but look at their sizes. 1 part is much bigger than the other. Halves are the same size.',
      },
      then: {
        say: 'Right! The 2 parts are not the same size, so they are not halves. Halves are 2 equal parts, like this.',
        caption: 'Halves: 2 equal parts',
        scene: { kind: 'fraction', shape: 'bar', parts: 2, shaded: 1 },
      },
    },
    {
      kind: 'try',
      say: 'This circle is cut into equal parts. What fraction of it is shaded?',
      caption: 'What fraction is shaded?',
      scene: { kind: 'fraction', shape: 'circle', parts: 2, shaded: 1 },
      choices: ['1/2', '1/3', '1/4'],
      answer: '1/2',
      hints: {
        '1/3': 'The bottom number counts all the equal parts. Count them: 1, 2. There are 2 parts, not 3.',
        '1/4': 'That is 1 fourth. It would have 4 equal parts. Count the parts in this circle: there are just 2.',
      },
      then: {
        say: 'Yes! 1 of the 2 equal parts is shaded. That is 1 half.',
        caption: '1 of 2 parts = 1/2',
        scene: { kind: 'fraction', shape: 'circle', parts: 2, shaded: 1 },
      },
    },
    {
      kind: 'try',
      say: 'Which fraction means 1 half?',
      caption: 'Which one is 1 half?',
      scene: { kind: 'big', text: '1 half = ?' },
      choices: ['1/2', '1/4', '1/3'],
      answer: '1/2',
      hints: {
        '1/4': 'That is 1 fourth. It has a 4 on the bottom, for 4 equal parts. A half is 1 of 2 equal parts.',
        '1/3': 'That is 1 third. It has a 3 on the bottom, for 3 equal parts. A half is 1 of 2 equal parts.',
      },
      then: {
        say: 'Yes! Halves are 2 equal parts. So 1 half has a 2 on the bottom, and a 1 on top.',
        caption: '1 half = 1/2',
        scene: { kind: 'fraction', shape: 'bar', parts: 2, shaded: 1 },
      },
    },
  ],
};

const FOURTHS: Lesson = {
  id: 'fourths',
  title: 'Fourths',
  emoji: '🍕',
  places: [{ skillId: 'fractions', rung: 1 }],
  steps: [
    {
      kind: 'watch',
      say: 'This square is cut into 4 parts. All 4 parts are the same size. 4 equal parts are called fourths. You can call them quarters, too.',
      caption: '4 equal parts = fourths',
      scene: { kind: 'fraction', shape: 'square', parts: 4, shaded: 0 },
    },
    {
      kind: 'watch',
      say: '1 part is shaded. That is 1 fourth. The 4 on the bottom counts all the equal parts. The 1 on top counts the part that is shaded.',
      caption: '1 of 4 equal parts = 1/4',
      scene: { kind: 'fraction', shape: 'square', parts: 4, shaded: 1 },
    },
    {
      kind: 'watch',
      say: 'Here is a bar cut into halves. 1 half is shaded.',
      caption: '1/2 of the bar',
      scene: { kind: 'fraction', shape: 'bar', parts: 2, shaded: 1 },
    },
    {
      kind: 'watch',
      say: 'Now cut the same bar into 4 equal parts. More parts means smaller parts! 1 fourth is smaller than 1 half.',
      caption: '1/4 is smaller than 1/2',
      scene: { kind: 'fraction', shape: 'bar', parts: 4, shaded: 1 },
    },
    {
      kind: 'try',
      say: 'Your turn! This circle is cut into equal parts. What fraction of it is shaded?',
      caption: 'What fraction is shaded?',
      scene: { kind: 'fraction', shape: 'circle', parts: 4, shaded: 1 },
      choices: ['1/4', '1/3', '3/4'],
      answer: '1/4',
      hints: {
        '1/3': 'Did you count only the parts that are not shaded? The bottom number counts all the parts. There are 4.',
        '3/4': '3 is how many parts are not shaded. The top number counts the shaded parts. Just 1 part is shaded.',
      },
      then: {
        say: 'Yes! 1 of the 4 equal parts is shaded. That is 1 fourth.',
        caption: '1 of 4 parts = 1/4',
        scene: { kind: 'fraction', shape: 'circle', parts: 4, shaded: 1 },
      },
    },
    {
      kind: 'try',
      say: 'Now 3 parts are shaded. What fraction of the bar is shaded?',
      caption: 'What fraction is shaded?',
      scene: { kind: 'fraction', shape: 'bar', parts: 4, shaded: 3 },
      choices: ['3/4', '1/4', '2/4'],
      answer: '3/4',
      hints: {
        '1/4': '1 is the part that is not shaded. The top number counts the shaded parts. Count them: 1, 2, 3.',
        '2/4': 'Count the shaded parts again. Touch each one: 1, 2, 3.',
      },
      then: {
        say: 'Yes! 3 of the 4 equal parts are shaded. That is 3 fourths.',
        caption: '3 of 4 parts = 3/4',
        scene: { kind: 'fraction', shape: 'bar', parts: 4, shaded: 3 },
      },
    },
    {
      kind: 'try',
      say: 'Which is bigger, 1 half or 1 fourth?',
      caption: 'Which is bigger?',
      scene: { kind: 'big', text: '1/2   or   1/4' },
      choices: ['1/2', '1/4'],
      answer: '1/2',
      hints: {
        '1/4': '4 is a bigger number, but it means more parts. More parts means each part is smaller.',
      },
      then: {
        say: 'Yes! 1 half is bigger. Cut a pizza into 2 equal parts, and each part is big. Cut it into 4, and each part is smaller.',
        caption: '1/2 is bigger than 1/4',
        scene: { kind: 'fraction', shape: 'circle', parts: 2, shaded: 1 },
      },
    },
  ],
};

const THIRDS: Lesson = {
  id: 'thirds',
  title: 'Thirds',
  emoji: '🥧',
  places: [{ skillId: 'fractions', rung: 2 }],
  steps: [
    {
      kind: 'watch',
      say: 'This pie is cut into 3 parts. All 3 parts are the same size. 3 equal parts are called thirds.',
      caption: '3 equal parts = thirds',
      scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 0 },
    },
    {
      kind: 'watch',
      say: '1 part is shaded. That is 1 third. The 3 on the bottom counts all the equal parts. The 1 on top counts the part that is shaded.',
      caption: '1 of 3 equal parts = 1/3',
      scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 1 },
    },
    {
      kind: 'watch',
      say: 'Now 2 parts of this bar are shaded. That is 2 thirds. The top number counts the shaded parts. The bottom number still counts all the equal parts.',
      caption: '2 of 3 equal parts = 2/3',
      scene: { kind: 'fraction', shape: 'bar', parts: 3, shaded: 2 },
    },
    {
      kind: 'try',
      say: 'Your turn! This square is cut into equal parts. What fraction of it is shaded?',
      caption: 'What fraction is shaded?',
      scene: { kind: 'fraction', shape: 'square', parts: 3, shaded: 1 },
      choices: ['1/3', '1/2', '2/3', '1/4'],
      answer: '1/3',
      hints: {
        '1/2': 'Did you count only the parts that are not shaded? There are 2 of those. The bottom number counts all the parts. There are 3.',
        '2/3': '2 is how many parts are not shaded. The top number counts the shaded part. Just 1 part is shaded.',
        '1/4': 'Count all the parts again. Touch each one: 1, 2, 3. The bottom number is 3.',
      },
      then: {
        say: 'Yes! 1 of the 3 equal parts is shaded. That is 1 third.',
        caption: '1 of 3 parts = 1/3',
        scene: { kind: 'fraction', shape: 'square', parts: 3, shaded: 1 },
      },
    },
    {
      kind: 'try',
      say: 'What fraction of this circle is shaded?',
      caption: 'What fraction is shaded?',
      scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 2 },
      choices: ['2/3', '1/3', '2/4'],
      answer: '2/3',
      hints: {
        '1/3': '1 is the part that is not shaded. The top number counts the shaded parts. Count them: 1, 2.',
        '2/4': 'Count all the parts. Touch each one: 1, 2, 3. The bottom number is 3.',
      },
      then: {
        say: 'Yes! 2 of the 3 equal parts are shaded. That is 2 thirds.',
        caption: '2 of 3 parts = 2/3',
        scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 2 },
      },
    },
    {
      kind: 'try',
      say: 'Is this circle cut into thirds? Look at the size of each part.',
      caption: 'Is it cut into thirds?',
      scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 0, unequal: true },
      choices: ['Yes', 'No'],
      answer: 'No',
      hints: {
        Yes: 'It has 3 parts, but they are not the same size. Thirds must be 3 equal parts.',
      },
      then: {
        say: 'Right! These 3 parts are not equal, so they are not thirds. Thirds are 3 equal parts, like this.',
        caption: 'Thirds: 3 equal parts',
        scene: { kind: 'fraction', shape: 'circle', parts: 3, shaded: 0 },
      },
    },
  ],
};

export const FRACTION_LESSONS: Lesson[] = [HALVES, FOURTHS, THIRDS];

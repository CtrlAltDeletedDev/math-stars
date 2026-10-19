import type { Lesson } from '../learn';

// Number Bonds lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The three ideas first grade builds number bonds from: a bond is a whole and
// the two parts inside it (on one hand, 5 fingers are some up and the rest
// down); the partners of 10 are the full and empty spaces of a ten frame; and a
// bond to 20 is a bond to 10 with a ten on (13 needs 7 because 3 needs 7). The
// wrong choices are the ones bondGen.ts offers in play: the whole, the part
// already shown, the two numbers shown added together, one off, and on the
// bonds to 20 a ten too many.
//
// Which lesson a mistake opens is decided by `helpsWith`, nearest rung first and
// then in this file's order, so at rung 0 the tags are split between the two
// lessons rather than both claiming them: Parts of 5 is the lesson for mixing up
// the whole and a part, Partners of 10 the one for adding the numbers shown and
// for counting one off.

const PARTS_OF_5: Lesson = {
  id: 'number-bond-5',
  title: 'Parts of 5',
  emoji: '🖐️',
  places: [{ skillId: 'number-bonds', rung: 0 }],
  practiceLevelId: 'nb-bonds-5',
  // "5 is the whole hand, in the top circle" and "5 is the whole, at the top"
  // are written for giving the whole; "2 is how many went down" and "1 is the
  // part we already know" for giving back the part she was shown.
  helpsWith: ['answered-the-whole', 'answered-a-given-number'],
  steps: [
    {
      kind: 'watch',
      say: 'Here are 5 apples. 3 are red and 2 are green. All together, there are 5 apples.',
      caption: '5 apples: 3 red, 2 green',
      scene: { kind: 'big', text: '🍎🍎🍎🍏🍏' },
    },
    {
      kind: 'watch',
      say: 'A number bond shows this. The whole, 5, goes in the top circle. The 2 parts go below it: 3 and 2. 3 and 2 make 5.',
      caption: '3 and 2 make 5',
      scene: { kind: 'bond', whole: 5, parts: [3, 2] },
    },
    {
      kind: 'watch',
      say: 'Your hand has 5 fingers. Hold it up! Now put 1 finger down. 4 fingers are still up. 4 and 1 make 5.',
      caption: '4 and 1 make 5',
      scene: { kind: 'bond', whole: 5, parts: [4, 1] },
    },
    {
      kind: 'try',
      say: 'Hold up 5 fingers again. Put 2 fingers down. How many fingers are still up?',
      caption: '2 + ? = 5',
      scene: { kind: 'bond', whole: 5, parts: [2, null] },
      choices: ['3', '5', '2', '7'],
      answer: '3',
      hints: {
        '5': '5 is the whole hand, in the top circle. 2 fingers went down, so not all 5 are up.',
        '2': '2 is how many went down. How many fingers are still up?',
        '7': '7 is 2 and 5 put together. That is more fingers than 1 hand has! The 2 parts fit inside the 5.',
      },
      then: {
        say: 'Yes! 2 fingers are down and 3 are still up. 2 and 3 make 5.',
        caption: '2 + 3 = 5',
        scene: { kind: 'bond', whole: 5, parts: [2, 3] },
      },
    },
    {
      kind: 'try',
      say: 'What goes with 1 to make 5?',
      caption: '? + 1 = 5',
      scene: { kind: 'bond', whole: 5, parts: [null, 1] },
      choices: ['4', '5', '1', '3'],
      answer: '4',
      hints: {
        '5': '5 is the whole, at the top. Which part goes with 1 to make it?',
        '1': '1 is the part we already know. What goes with 1 to make 5?',
        '3': '3 and 1 make 4, not 5. Hold up 1 finger, then count on to 5: 2, 3, 4, 5.',
      },
      then: {
        say: 'Yes! 4 fingers and 1 finger make 5.',
        caption: '4 + 1 = 5',
        scene: { kind: 'bond', whole: 5, parts: [4, 1] },
      },
    },
  ],
};

const PARTNERS_OF_10: Lesson = {
  id: 'number-bond-10',
  title: 'Partners of 10',
  emoji: '🙌',
  places: [{ skillId: 'number-bonds', rung: 0 }],
  practiceLevelId: 'nb-bonds-10',
  // "16 is 6 and 10 put together" and "18 is 8 and 10 put together" are written
  // for adding the two numbers shown; "touch each space just once" and "1 too
  // many, count on from 8" for landing one off. Its hints for the whole and the
  // part shown are there too, but Parts of 5 is the lesson for those.
  helpsWith: ['wrong-operation', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'A ten frame has 10 spaces. Here are 7 counters in it. How many more make 10?',
      caption: '7 + ? = 10',
      scene: { kind: 'tenFrame', first: 7 },
    },
    {
      kind: 'watch',
      say: 'Count the empty spaces. 1, 2, 3. 7 needs 3 more to make 10.',
      caption: '3 empty spaces',
      scene: { kind: 'tenFrame', first: 7, askEmpty: true },
    },
    {
      kind: 'watch',
      say: 'Fill them up. Now the frame is full! 7 and 3 are partners. Together they make 10.',
      caption: '7 + 3 = 10',
      scene: { kind: 'tenFrame', first: 7, second: 3 },
    },
    {
      kind: 'try',
      say: 'Here are 6 counters. How many more make 10?',
      caption: '6 + ? = 10',
      scene: { kind: 'tenFrame', first: 6, askEmpty: true },
      choices: ['4', '16', '5', '10'],
      answer: '4',
      hints: {
        '16': '16 is 6 and 10 put together. That is more than the frame can hold! Count only the empty spaces.',
        '5': 'Count the empty spaces again. Touch each space just once.',
        '10': '10 is the whole frame. 6 spaces are full already. How many are empty?',
      },
      then: {
        say: 'Yes! 4 empty spaces. 6 and 4 make 10.',
        caption: '6 + 4 = 10',
        scene: { kind: 'tenFrame', first: 6, second: 4 },
      },
    },
    {
      kind: 'try',
      say: 'No frame this time. What goes with 8 to make 10? Picture 8 counters in a ten frame.',
      caption: '? + 8 = 10',
      scene: { kind: 'bond', whole: 10, parts: [null, 8] },
      choices: ['2', '18', '3', '8'],
      answer: '2',
      hints: {
        '18': '18 is 8 and 10 put together. The 8 is a part inside the 10, so the missing part is small.',
        '3': '3 and 8 make 11. That is 1 too many! Count on from 8 to 10: 9, 10.',
        '8': '8 is the part we already know. What goes with 8 to make 10?',
      },
      then: {
        say: 'Yes! 8 counters leave 2 empty spaces. 2 and 8 make 10.',
        caption: '2 + 8 = 10',
        scene: { kind: 'tenFrame', first: 8, second: 2 },
      },
    },
  ],
};

const BONDS_TO_20: Lesson = {
  id: 'number-bond-20',
  title: 'Bonds to 20',
  emoji: '🧩',
  places: [{ skillId: 'number-bonds', rung: 1 }],
  practiceLevelId: 'nb-bonds-20',
  // "Did you put in another ten? 14 already has its ten" (and 17's) is written
  // for a ten too many, 'place-value'; "4 and 7 make 11" and "4 and 17 make 21"
  // for landing one off; "20 is the whole, in the top circle" for giving the
  // whole; "37 is 17 and 20 put together" for adding the two numbers shown.
  helpsWith: ['place-value', 'off-by-one', 'answered-the-whole', 'wrong-operation'],
  steps: [
    {
      kind: 'watch',
      say: '20 is 2 tens. 10 and 10 make 20.',
      caption: '10 + 10 = 20',
      scene: { kind: 'tensOnes', numbers: [20] },
    },
    {
      kind: 'watch',
      say: 'Here is 13. 13 is 1 ten and 3 ones. How many more make 20?',
      caption: '13 + ? = 20',
      scene: { kind: 'tensOnes', numbers: [13] },
    },
    {
      kind: 'watch',
      say: 'The ten is done already. Look at the 3 ones. Put them in a ten frame and count the empty spaces. 3 needs 7 more to make the next ten.',
      caption: '3 + 7 = 10',
      scene: { kind: 'tenFrame', first: 3, askEmpty: true },
    },
    {
      kind: 'watch',
      say: '3 and 7 make 10. So 13 and 7 make 20! The ten in 13 and the new ten make 2 tens.',
      caption: '13 + 7 = 20',
      scene: { kind: 'bond', whole: 20, parts: [13, 7] },
    },
    {
      kind: 'try',
      say: 'Your turn. 14 plus what makes 20? Look at the 4 ones. What does 4 need to make 10?',
      caption: '14 + ? = 20',
      scene: { kind: 'bond', whole: 20, parts: [14, null] },
      choices: ['6', '16', '7', '20'],
      answer: '6',
      hints: {
        '16': 'Did you put in another ten? 14 already has its ten. Just fill up the 4 ones to make 10.',
        '7': '4 and 7 make 11. That is 1 too many. What makes 10 with 4?',
        '20': '20 is the whole, in the top circle. 14 is one part. How many more does 14 need?',
      },
      then: {
        say: 'Yes! 4 and 6 make 10, so 14 and 6 make 20.',
        caption: '14 + 6 = 20',
        scene: { kind: 'bond', whole: 20, parts: [14, 6] },
      },
    },
    {
      kind: 'try',
      say: 'One more. What plus 17 makes 20?',
      caption: '? + 17 = 20',
      scene: { kind: 'bond', whole: 20, parts: [null, 17] },
      choices: ['3', '13', '4', '37'],
      answer: '3',
      hints: {
        '13': 'Did you put in another ten? 17 already has its ten. What goes with the 7 ones to make 10?',
        '4': '4 and 17 make 21. That is 1 too many. What goes with 7 to make 10?',
        '37': '37 is 17 and 20 put together. 17 is a part inside the 20, so the missing part is small.',
      },
      then: {
        say: 'Yes! 7 and 3 make 10, so 17 and 3 make 20.',
        caption: '3 + 17 = 20',
        scene: { kind: 'bond', whole: 20, parts: [3, 17] },
      },
    },
  ],
};

export const NUMBER_BOND_LESSONS: Lesson[] = [PARTS_OF_5, PARTNERS_OF_10, BONDS_TO_20];

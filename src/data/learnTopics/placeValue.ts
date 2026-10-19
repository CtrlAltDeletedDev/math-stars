import type { Lesson } from '../learn';

// Tens & Ones (place-value) lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// Rods and cubes first (a ten is 10 cubes stuck together), then the digits:
// the one on the left counts the rods, the one on the right counts the cubes.
// Every wrong choice is the mistake play's questions are built to catch,
// treating the two digits as if they could swap places: 36 for 63, the ones
// digit for the tens, "38 beats 52 because 8 is big".
//
// A "what number is this?" try draws the rods and cubes with the number hidden,
// and writes it in once she has it.

const TENS_AND_ONES: Lesson = {
  id: 'tens-and-ones',
  title: 'Tens and Ones',
  emoji: '🧱',
  places: [{ skillId: 'place-value', rung: 0 }],
  practiceLevelId: 'pv-ones-tens',
  // "7 is the ones, the loose cubes" and "6 is the tens digit, on the left" are
  // written for giving the other digit ('place-value'); "47 is the whole
  // number" for tapping the number she was shown ('answered-a-given-number').
  helpsWith: ['place-value', 'answered-a-given-number'],
  steps: [
    {
      kind: 'watch',
      say: 'Here are 10 cubes, stuck together in a stick. 10 ones make 1 ten.',
      caption: '10 ones = 1 ten',
      scene: { kind: 'tensOnes', numbers: [10] },
    },
    {
      kind: 'watch',
      say: 'This is 34. It has 3 tens and 4 ones. Count the tens: 10, 20, 30. Then count on the ones: 31, 32, 33, 34.',
      caption: '34 = 3 tens and 4 ones',
      scene: { kind: 'tensOnes', numbers: [34] },
    },
    {
      kind: 'watch',
      say: 'When we write 34, the digit on the left tells the tens. That is the 3. The digit on the right tells the ones. That is the 4.',
      caption: 'Left is tens, right is ones',
      scene: { kind: 'big', text: '34\n3 tens, 4 ones' },
    },
    {
      kind: 'try',
      say: 'How many tens are in 47? Count the sticks of ten.',
      caption: 'How many tens in 47?',
      scene: { kind: 'tensOnes', numbers: [47] },
      choices: ['4', '7', '47'],
      answer: '4',
      hints: {
        '7': '7 is the ones. Those are the loose cubes. How many sticks of ten are there?',
        '47': '47 is the whole number. How many sticks of ten are in it?',
      },
      then: {
        say: 'Yes! 4 tens: 10, 20, 30, 40. And 7 ones. 47 is 4 tens and 7 ones.',
        caption: '47 = 4 tens and 7 ones',
        scene: { kind: 'big', text: '47\n4 tens, 7 ones' },
      },
    },
    {
      kind: 'try',
      say: 'Now just the number. What is the ones digit of 62?',
      caption: 'Ones digit of 62?',
      scene: { kind: 'big', text: '62' },
      choices: ['2', '6', '62'],
      answer: '2',
      hints: {
        '6': '6 is the tens digit, on the left. The ones digit is on the right.',
        '62': '62 is the whole number. Which digit tells the ones?',
      },
      then: {
        say: 'Yes! The ones digit is on the right. 62 is 6 tens and 2 ones.',
        caption: '62 = 6 tens and 2 ones',
        scene: { kind: 'big', text: '62\n6 tens, 2 ones' },
      },
    },
  ],
};

const BUILD_A_NUMBER: Lesson = {
  id: 'build-a-number',
  title: 'Building Numbers',
  emoji: '🏗️',
  places: [{ skillId: 'place-value', rung: 1 }],
  practiceLevelId: 'pv-building',
  // The hints on 36, 96 and 34 are written for swapping the digits, and those
  // on 9 and 7 for counting each ten as a one: both 'place-value'. "60 is
  // where you start" answers giving back the 60 she was shown
  // ('answered-a-given-number'), and "one too far" landing on 70 ('off-by-one').
  helpsWith: ['place-value', 'answered-a-given-number', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: "Let's build a number. Here are 5 tens. Count them by tens: 10, 20, 30, 40, 50.",
      caption: '5 tens = 50',
      scene: { kind: 'tensOnes', numbers: [50] },
    },
    {
      kind: 'watch',
      say: 'Now put 2 ones with them. 51, 52. 5 tens and 2 ones make 52.',
      caption: '5 tens and 2 ones = 52',
      scene: { kind: 'tensOnes', numbers: [52] },
    },
    {
      kind: 'watch',
      say: 'The tens digit is written first, then the ones. 5, then 2: 52. And 5 tens is 50, so 50 plus 2 is 52 too.',
      caption: '50 + 2 = 52',
      scene: { kind: 'big', text: '5 tens, 2 ones\n50 + 2 = 52' },
    },
    {
      kind: 'try',
      say: '6 tens and 3 ones. What number is that?',
      caption: '6 tens and 3 ones = ?',
      scene: { kind: 'tensOnes', numbers: [63], hide: true },
      choices: ['63', '36', '9', '60'],
      answer: '63',
      hints: {
        '36': '36 starts with 3 tens. We have 6 tens, so the 6 goes first.',
        '9': 'Did you count each ten as 1? Each ten is 10: 10, 20, 30, 40, 50, 60. Then the 3 ones.',
        '60': '60 is just the tens. Now put the 3 ones with it: 61, 62, 63.',
      },
      then: {
        say: 'Yes! 6 tens is 60, and 3 ones more is 63.',
        caption: '6 tens and 3 ones = 63',
        scene: { kind: 'tensOnes', numbers: [63] },
      },
    },
    {
      kind: 'try',
      say: 'What is 60 plus 9? Start with 6 tens.',
      caption: '60 + 9 = ?',
      scene: { kind: 'tensOnes', numbers: [60] },
      choices: ['69', '96', '60', '70'],
      answer: '69',
      hints: {
        '96': '96 has 9 tens. 60 is 6 tens, so the 6 goes first, then the 9 ones.',
        '60': '60 is where you start. Now put the 9 ones with it.',
        '70': 'One too far! 60 and 10 more is 70. We only put 9 more with the 60.',
      },
      then: {
        say: 'Yes! 60 is 6 tens. Put 9 ones with it, and 6 tens and 9 ones is 69.',
        caption: '60 + 9 = 69',
        scene: { kind: 'tensOnes', numbers: [69] },
      },
    },
    {
      kind: 'try',
      say: 'Careful, the ones come first this time! 3 ones and 4 tens. What number is that?',
      caption: '3 ones and 4 tens = ?',
      scene: { kind: 'tensOnes', numbers: [43], hide: true },
      choices: ['43', '34', '7', '40'],
      answer: '43',
      hints: {
        '34': 'You wrote the digits in the order you heard them. Find the tens first: 4 tens. The tens digit goes first.',
        '7': 'Did you count each ten as 1? 4 tens is 40. Then the 3 ones.',
        '40': '40 is just the tens. Now put the 3 ones with it: 41, 42, 43.',
      },
      then: {
        say: 'Yes! Find the tens first. 4 tens is 40, then 3 ones makes 43.',
        caption: '4 tens and 3 ones = 43',
        scene: { kind: 'tensOnes', numbers: [43] },
      },
    },
  ],
};

const TENS_FIRST: Lesson = {
  id: 'tens-first',
  title: 'Look at the Tens First',
  emoji: '🔍',
  places: [{ skillId: 'place-value', rung: 2 }],
  practiceLevelId: 'pv-comparing',
  // "Did you look at the 6 ones?" and "41 has only 1 one, but look at the tens
  // first" are written for comparing the ones instead of the tens, which play
  // tags 'place-value' when the ones point the other way (36 and 63, 29 and 41).
  helpsWith: ['place-value'],
  steps: [
    {
      kind: 'watch',
      say: 'Here are 45 and 54. Look at the tens first. 45 has 4 tens. 54 has 5 tens. More tens makes a number greater, so 54 is greater than 45.',
      caption: '54 > 45',
      scene: { kind: 'tensOnes', numbers: [45, 54] },
    },
    {
      kind: 'watch',
      say: "38 has 8 ones. That's a lot of ones! But 38 has only 3 tens, and 52 has 5 tens. The tens decide. 52 is greater than 38.",
      caption: '52 > 38',
      scene: { kind: 'tensOnes', numbers: [38, 52] },
    },
    {
      kind: 'watch',
      say: 'When the tens are the same, look at the ones. 43 and 47 both have 4 tens. 3 ones is less than 7 ones, so 43 is less than 47.',
      caption: '43 < 47',
      scene: { kind: 'tensOnes', numbers: [43, 47] },
    },
    {
      kind: 'try',
      say: 'Which is greater, 36 or 63?',
      caption: 'Which is greater: 36 or 63?',
      scene: { kind: 'tensOnes', numbers: [36, 63] },
      choices: ['63', '36'],
      answer: '63',
      hints: {
        '36': 'Did you look at the 6 ones? Look at the tens first. 36 has 3 tens. 63 has 6 tens.',
      },
      then: {
        say: 'Yes! 6 tens is more than 3 tens, so 63 is greater than 36.',
        caption: '63 > 36',
      },
    },
    {
      kind: 'try',
      say: 'Now just the numbers. Which is less, 29 or 41?',
      caption: 'Which is less: 29 or 41?',
      scene: { kind: 'big', text: '29  or  41' },
      choices: ['29', '41'],
      answer: '29',
      hints: {
        '41': '41 has only 1 one, but look at the tens first! 41 has 4 tens, and 29 has just 2 tens.',
      },
      then: {
        say: 'Yes! 2 tens is less than 4 tens. 29 is less than 41, even with all those ones.',
        caption: '29 < 41',
        scene: { kind: 'tensOnes', numbers: [29, 41] },
      },
    },
    {
      kind: 'try',
      say: 'Which is greater, 72 or 75?',
      caption: 'Which is greater: 72 or 75?',
      scene: { kind: 'big', text: '72  or  75' },
      choices: ['75', '72'],
      answer: '75',
      hints: {
        '72': 'Both have 7 tens, so the tens are a tie. Now look at the ones: 5 ones is more than 2 ones.',
      },
      then: {
        say: 'Yes! The tens are the same, so the ones decide. 75 is greater than 72.',
        caption: '75 > 72',
        scene: { kind: 'tensOnes', numbers: [72, 75] },
      },
    },
  ],
};

export const PLACE_VALUE_LESSONS: Lesson[] = [TENS_AND_ONES, BUILD_A_NUMBER, TENS_FIRST];

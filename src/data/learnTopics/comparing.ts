import type { Lesson } from '../learn';

// Comparing lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The order a kindergarten class meets it in: line two groups up and see which
// runs out first; then numbers on their own, where the one you say later when
// counting is bigger; then the signs; then, in first grade, numbers past ten,
// where a ten beats any ones. The tries ask what play asks ("Which is more?",
// "12 ☐ 9"), so the lesson and the questions look like the same thing.

const LINE = 20;

const MATCH_AND_COMPARE: Lesson = {
  id: 'match-and-compare',
  title: 'More or Fewer?',
  emoji: '🍎',
  places: [{ skillId: 'comparing', rung: 0 }],
  practiceLevelId: 'count-4',
  steps: [
    {
      kind: 'watch',
      say: 'Mia has 7 apples. Leo has 4 apples. Who has more?',
      caption: '7 apples and 4 apples',
      scene: { kind: 'compare', rows: [{ label: 'Mia', count: 7, emoji: '🍎' }, { label: 'Leo', count: 4, emoji: '🍏' }] },
    },
    {
      kind: 'watch',
      say: "Line them up! Each of Leo's apples gets a partner from Mia's row. 3 of Mia's apples have no partner. So Mia has more. 7 is more than 4.",
      caption: '7 is more than 4',
      scene: { kind: 'compare', rows: [{ label: 'Mia', count: 7, emoji: '🍎' }, { label: 'Leo', count: 4, emoji: '🍏' }], match: true },
    },
    {
      kind: 'watch',
      say: 'Sam has 5 stars, and Ava has 5 stars. Line them up. Every star has a partner, and none are left over. 5 and 5 are the same. They are equal.',
      caption: '5 and 5 are equal',
      scene: { kind: 'compare', rows: [{ label: 'Sam', count: 5, emoji: '⭐' }, { label: 'Ava', count: 5, emoji: '🌟' }], match: true },
    },
    {
      kind: 'try',
      say: 'Zoe has 6 shells. Max has 8 shells. Which is more, 6 or 8?',
      caption: 'Which is more: 6 or 8?',
      scene: { kind: 'compare', rows: [{ label: 'Zoe', count: 6, emoji: '🐚' }, { label: 'Max', count: 8, emoji: '🐚' }] },
      choices: ['8', '6'],
      answer: '8',
      hints: {
        '6': "Look along the rows. Zoe's 6 shells run out first, so 6 is fewer. Which row has some left over?",
      },
      then: {
        say: 'Yes! Line them up, and Max has 2 extra shells. 8 is more than 6.',
        caption: '8 is more than 6',
        scene: { kind: 'compare', rows: [{ label: 'Zoe', count: 6, emoji: '🐚' }, { label: 'Max', count: 8, emoji: '🐚' }], match: true },
      },
    },
    {
      kind: 'try',
      say: 'Kai has 9 cars. Lily has 5 cars. Which is less, 9 or 5?',
      caption: 'Which is less: 9 or 5?',
      scene: { kind: 'compare', rows: [{ label: 'Kai', count: 9, emoji: '🚗' }, { label: 'Lily', count: 5, emoji: '🚙' }] },
      choices: ['5', '9'],
      answer: '5',
      hints: {
        '9': "Kai's row is the long one, with cars left over. That makes 9 more. Less is the row that runs out first.",
      },
      then: {
        say: "Yes! Lily's row runs out first, so Lily has fewer cars. 5 is less than 9.",
        caption: '5 is less than 9',
        scene: { kind: 'compare', rows: [{ label: 'Kai', count: 9, emoji: '🚗' }, { label: 'Lily', count: 5, emoji: '🚙' }], match: true },
      },
    },
  ],
};

const FURTHER_IS_BIGGER: Lesson = {
  id: 'further-is-bigger',
  title: 'Bigger Numbers Come Later',
  emoji: '🦘',
  places: [{ skillId: 'comparing', rung: 0 }],
  practiceLevelId: 'count-4',
  // "Did you look at the 1 in 10?" is written for reading the ten in 10 as a
  // one, which is what play tags 'place-value' when she picks 7 over 10.
  helpsWith: ['place-value'],
  steps: [
    {
      kind: 'watch',
      say: 'When we count, the numbers get bigger. 1, 2, 3, 4, 5. Each number is 1 more than the one before.',
      caption: '1, 2, 3, 4, 5',
      scene: { kind: 'numberLine', max: 10, start: 0, hops: 5, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'Start on 4 and hop forward to 7. 7 is further along the line. You say 7 after 4 when you count, so 7 is bigger than 4.',
      caption: '7 is further along',
      scene: { kind: 'numberLine', max: 10, start: 4, hops: 3, dir: 1, animate: true },
    },
    {
      kind: 'try',
      say: 'Which is bigger, 6 or 9? You can tap the number line to hop from 6.',
      caption: 'Which is bigger: 6 or 9?',
      scene: { kind: 'numberLine', max: 10, start: 6, interactive: true },
      choices: ['9', '6'],
      answer: '9',
      hints: {
        '6': 'You say 6 first when you count: 6, 7, 8, 9. The one you say later is bigger.',
      },
      then: {
        say: 'Yes! Hop forward from 6, and you get to 9. 9 is further along, so 9 is bigger than 6.',
        caption: '9 is bigger than 6',
        scene: { kind: 'numberLine', max: 10, start: 6, hops: 3, dir: 1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'Now which is smaller, 8 or 3?',
      caption: 'Which is smaller: 8 or 3?',
      scene: { kind: 'numberLine', max: 10, start: 8, interactive: true },
      choices: ['3', '8'],
      answer: '3',
      hints: {
        '8': '8 is further along the line, so 8 is bigger. The smaller number comes first when you count.',
      },
      then: {
        say: 'Yes! Hop back from 8, all the way to 3. 3 comes first when you count, so 3 is smaller than 8.',
        caption: '3 is smaller than 8',
        scene: { kind: 'numberLine', max: 10, start: 8, hops: 5, dir: -1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'This one is tricky. Which is bigger, 10 or 7?',
      caption: 'Which is bigger: 10 or 7?',
      scene: { kind: 'numberLine', max: 10, start: 7, interactive: true },
      choices: ['10', '7'],
      answer: '10',
      hints: {
        '7': 'Did you look at the 1 in 10? 10 is not 1. Count on from 7: 8, 9, 10. 10 comes later.',
      },
      then: {
        say: 'Yes! 8, 9, 10. 10 comes after 7, so 10 is bigger. It is the biggest number on this line!',
        caption: '10 is bigger than 7',
        scene: { kind: 'numberLine', max: 10, start: 7, hops: 3, dir: 1, animate: true },
      },
    },
  ],
};

const GREATER_LESS_SIGNS: Lesson = {
  id: 'greater-less-signs',
  title: 'Greater Than, Less Than',
  emoji: '🐊',
  places: [{ skillId: 'comparing', rung: 0 }],
  practiceLevelId: 'cmp-to10',
  steps: [
    {
      kind: 'watch',
      say: '8 is more than 5. We can write that with a sign. The sign is like a hungry mouth, and the open side faces the bigger number. We read it: 8 is greater than 5.',
      caption: '8 > 5',
      scene: { kind: 'compare', rows: [{ label: 'red', count: 8, emoji: '🔴' }, { label: 'blue', count: 5, emoji: '🔵' }], match: true },
    },
    {
      kind: 'watch',
      say: 'Now write the 5 first. The sign turns around, but the open side still faces 8, the bigger number. We read it: 5 is less than 8.',
      caption: '5 < 8',
      scene: { kind: 'compare', rows: [{ label: 'blue', count: 5, emoji: '🔵' }, { label: 'red', count: 8, emoji: '🔴' }], match: true },
    },
    {
      kind: 'watch',
      say: 'When both numbers are the same, use the equals sign. 6 is equal to 6.',
      caption: '6 = 6',
      scene: { kind: 'balance', left: '6', right: '6' },
    },
    {
      kind: 'try',
      say: 'Which sign goes in the box? Is 9 greater than, less than, or equal to 4?',
      caption: '9 ☐ 4',
      scene: { kind: 'big', text: '9 ☐ 4' },
      choices: ['>', '<', '='],
      answer: '>',
      hints: {
        '<': 'That sign says 9 is less than 4. Which number is bigger? Make the open side face it.',
        '=': 'Equals means the same. 9 and 4 are not the same.',
      },
      then: {
        say: 'Yes! 9 is the bigger number, so the open side faces 9. 9 is greater than 4.',
        caption: '9 > 4',
        scene: { kind: 'compare', rows: [{ label: 'red', count: 9, emoji: '🔴' }, { label: 'blue', count: 4, emoji: '🔵' }], match: true },
      },
    },
    {
      kind: 'try',
      say: 'Which sign goes in the box? Is 3 greater than, less than, or equal to 7?',
      caption: '3 ☐ 7',
      scene: { kind: 'big', text: '3 ☐ 7' },
      choices: ['<', '>', '='],
      answer: '<',
      hints: {
        '>': 'That sign says 3 is greater than 7. But 7 is bigger! The open side faces the bigger number.',
        '=': 'Equals means the same. 3 and 7 are not the same.',
      },
      then: {
        say: 'Yes! The open side faces 7, the bigger number. 3 is less than 7.',
        caption: '3 < 7',
        scene: { kind: 'compare', rows: [{ label: 'blue', count: 3, emoji: '🔵' }, { label: 'red', count: 7, emoji: '🔴' }], match: true },
      },
    },
    {
      kind: 'try',
      say: 'One more. Which sign goes in the box? Is 5 greater than, less than, or equal to 5?',
      caption: '5 ☐ 5',
      scene: { kind: 'big', text: '5 ☐ 5' },
      choices: ['=', '>', '<'],
      answer: '=',
      hints: {
        '>': 'Is one 5 bigger than the other 5? Look again. They are the same number.',
        '<': 'Is one 5 smaller than the other 5? Look again. They are the same number.',
      },
      then: {
        say: 'Yes! 5 and 5 are the same, so we use the equals sign. 5 is equal to 5.',
        caption: '5 = 5',
        scene: { kind: 'balance', left: '5', right: '5' },
      },
    },
  ],
};

const COMPARE_TEENS: Lesson = {
  id: 'compare-teens',
  title: 'Comparing Teen Numbers',
  emoji: '🧮',
  places: [{ skillId: 'comparing', rung: 1 }],
  practiceLevelId: 'cmp-to20',
  // "Did you look at just the 5?" and "Did you look at the 9?" are written for
  // comparing the ones and losing the ten (15 against 8, 20 against 19), which
  // is the mistake play tags 'place-value' on this rung.
  helpsWith: ['place-value'],
  steps: [
    {
      kind: 'watch',
      say: 'Which is bigger, 12 or 9? 12 is 1 ten and 2 ones. 9 is just 9 ones. It has no ten at all.',
      caption: '12 = 1 ten and 2 ones',
      scene: { kind: 'tensOnes', numbers: [12, 9] },
    },
    {
      kind: 'watch',
      say: "Don't let the 2 trick you! Count on from 9: 10, 11, 12. 12 comes later, so 12 is greater than 9. A ten is more than any ones.",
      caption: '12 > 9',
      scene: { kind: 'numberLine', max: LINE, start: 9, hops: 3, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'Now 14 and 17. Both have 1 ten. When the tens are the same, look at the ones. 4 ones is less than 7 ones, so 14 is less than 17.',
      caption: '14 < 17',
      scene: { kind: 'tensOnes', numbers: [14, 17] },
    },
    {
      kind: 'try',
      say: 'Which sign goes in the box? Is 15 greater than, less than, or equal to 8?',
      caption: '15 ☐ 8',
      scene: { kind: 'tensOnes', numbers: [15, 8] },
      choices: ['>', '<', '='],
      answer: '>',
      hints: {
        '<': 'Did you look at just the 5? 15 has a ten, and 8 has no ten. A ten is more than any ones.',
        '=': 'Equals means the same. 15 and 8 are not the same.',
      },
      then: {
        say: 'Yes! 15 is 1 ten and 5 ones. 8 is only 8 ones. Count on from 8, and 15 comes later. 15 is greater than 8.',
        caption: '15 > 8',
        scene: { kind: 'numberLine', max: LINE, start: 8, hops: 7, dir: 1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'Which is less, 13 or 18?',
      caption: 'Which is less: 13 or 18?',
      scene: { kind: 'tensOnes', numbers: [13, 18] },
      choices: ['13', '18'],
      answer: '13',
      hints: {
        '18': 'Both have 1 ten, so look at the ones. 8 ones is more than 3 ones, so 18 is more.',
      },
      then: {
        say: 'Yes! The tens are the same, so the ones decide. 3 ones is less than 8 ones. 13 is less than 18.',
        caption: '13 < 18',
      },
    },
    {
      kind: 'try',
      say: 'Last one, and it is tricky. Which is more, 20 or 19?',
      caption: 'Which is more: 20 or 19?',
      scene: { kind: 'big', text: '20  or  19' },
      choices: ['20', '19'],
      answer: '20',
      hints: {
        '19': 'Did you look at the 9? Look at the tens first. 20 has 2 tens. 19 has only 1 ten.',
      },
      then: {
        say: 'Yes! 2 tens is more than 1 ten. 20 comes right after 19 when you count. 20 is more than 19.',
        caption: '20 > 19',
        scene: { kind: 'tensOnes', numbers: [20, 19] },
      },
    },
  ],
};

export const COMPARING_LESSONS: Lesson[] = [MATCH_AND_COMPARE, FURTHER_IS_BIGGER, GREATER_LESS_SIGNS, COMPARE_TEENS];

import type { Lesson } from '../learn';

// Clocks lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The order first grade meets it in: the two hands, and the long hand on 12
// for o'clock; then the long hand on 6 for half past, where the short hand sits
// between two numbers and the hour is the one it has just passed; then, in
// second grade, the long hand on 3 and on 9, counted by 5s; and the time an
// hour or half an hour later. Every "try" asks one of the questions play asks
// on the same face ("What time does the clock show?", "It is 6:00. What time
// will it be in one hour?"), and every wrong button is a misreading play offers
// on that face (learn-clocks.test.ts checks both).

const O_CLOCK: Lesson = {
  id: 'o-clock',
  title: "O'Clock",
  emoji: '🕒',
  places: [{ skillId: 'clocks', rung: 0 }],
  practiceLevelId: 'time-oclock',
  // "The short hand points right at 7, 8 is the next number round" and "the
  // short hand has not moved on to 1" are written for reading the hour one
  // number off, which play tags 'off-by-one'.
  helpsWith: ['off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'This is a clock. It has 2 hands. The short hand is the hour hand. It tells you the hour.',
      caption: 'Short hand: the hour',
      scene: { kind: 'clock', hour: 3, minute: 0, highlight: 'hour' },
    },
    {
      kind: 'watch',
      say: "The long hand is the minute hand. When the long hand points straight up at 12, we say o'clock.",
      caption: "Long hand on 12: o'clock",
      scene: { kind: 'clock', hour: 3, minute: 0, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: "The long hand is on 12, and the short hand points at 3. So it is 3 o'clock! We write it with a 3, then 2 zeros.",
      caption: "3 o'clock = 3:00",
      scene: { kind: 'clock', hour: 3, minute: 0 },
    },
    {
      kind: 'try',
      say: 'Your turn! What time does the clock show? Look at the short hand.',
      caption: 'What time is it?',
      scene: { kind: 'clock', hour: 7, minute: 0 },
      choices: ['7:00', '8:00', '6:00', '12:00'],
      answer: '7:00',
      hints: {
        '8:00': 'Look again. The short hand points right at 7. 8 is the next number round.',
        '6:00': 'Look again. The short hand points right at 7. 6 is the number before it.',
        '12:00': "12 is where the long hand points. The long hand on 12 just means o'clock. Which number is the short hand on?",
      },
      then: {
        say: "Yes! The long hand is on 12, and the short hand is on 7. It is 7 o'clock.",
        caption: "7 o'clock = 7:00",
        scene: { kind: 'clock', hour: 7, minute: 0, highlight: 'hour' },
      },
    },
    {
      kind: 'try',
      say: 'This one is tricky. Look closely. Where is the short hand hiding? What time is it?',
      caption: 'What time is it now?',
      scene: { kind: 'clock', hour: 12, minute: 0 },
      choices: ['12:00', '1:00', '11:00'],
      answer: '12:00',
      hints: {
        '1:00': 'The short hand has not moved on to 1. It is right on 12, under the long hand.',
        '11:00': '11 is the number before 12. The short hand is right on 12, under the long hand.',
      },
      then: {
        say: "Yes! Both hands point straight up at 12. It is 12 o'clock. That comes in the middle of the day, and again in the middle of the night.",
        caption: "12 o'clock = 12:00",
        scene: { kind: 'clock', hour: 12, minute: 0, highlight: 'hour' },
      },
    },
  ],
};

const HALF_PAST: Lesson = {
  id: 'half-past',
  title: 'Half Past',
  emoji: '🕞',
  places: [{ skillId: 'clocks', rung: 1 }],
  practiceLevelId: 'time-halfpast',
  // "It is halfway to 9, it has not got there yet" and "the short hand has not
  // got to 1 yet" are written for reading the next hour (9:30 for 8:30), and
  // "it has gone past 8 now, not 7" for the one before: play tags both
  // 'off-by-one'.
  helpsWith: ['off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: "It is 3 o'clock. The long hand points straight up at 12.",
      caption: "3 o'clock = 3:00",
      scene: { kind: 'clock', hour: 3, minute: 0, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: 'Now 30 minutes go by. The long hand goes halfway round the clock, down to 6. When the long hand is on 6, we say half past.',
      caption: 'Long hand on 6: half past',
      scene: { kind: 'clock', hour: 3, minute: 30, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: 'The short hand moved too! It went halfway from 3 to 4. It has gone past 3, but it has not got to 4 yet.',
      caption: 'Between 3 and 4',
      scene: { kind: 'clock', hour: 3, minute: 30, highlight: 'hour' },
    },
    {
      kind: 'watch',
      say: 'The hour is the number the short hand has just gone past. That is 3. So it is half past 3. You can say 3 30, too.',
      caption: 'Half past 3 = 3:30',
      scene: { kind: 'clock', hour: 3, minute: 30 },
    },
    {
      kind: 'try',
      say: 'Your turn! What time does the clock show? Look at the long hand first.',
      caption: 'What time is it?',
      scene: { kind: 'clock', hour: 8, minute: 30 },
      choices: ['8:30', '9:30', '7:30', '8:00'],
      answer: '8:30',
      hints: {
        '9:30': 'The short hand is halfway to 9, but it has not got there yet. Which number has it just gone past?',
        '7:30': 'The short hand has gone past 8 now, not 7. Look: it is between 8 and 9.',
        '8:00': 'Look at the long hand. It points down at 6, not up at 12. That means half past.',
      },
      then: {
        say: 'Yes! The long hand is on 6, so it is half past. The short hand has just gone past 8. It is half past 8.',
        caption: 'Half past 8 = 8:30',
        scene: { kind: 'clock', hour: 8, minute: 30, highlight: 'hour' },
      },
    },
    {
      kind: 'try',
      say: 'This one is tricky. What time does the clock show?',
      caption: 'What time is it now?',
      scene: { kind: 'clock', hour: 12, minute: 30 },
      choices: ['12:30', '1:30', '11:30', '12:00'],
      answer: '12:30',
      hints: {
        '1:30': 'The short hand is halfway between 12 and 1. It has not got to 1 yet, so the hour is still 12.',
        '11:30': 'The short hand has gone past 12, not 11. The hour is the number it has just gone past.',
        '12:00': 'The long hand is down on 6, not up on 12. That means half past.',
      },
      then: {
        say: 'Yes! The long hand is on 6, and the short hand has just gone past 12. It is half past 12.',
        caption: 'Half past 12 = 12:30',
        scene: { kind: 'clock', hour: 12, minute: 30, highlight: 'hour' },
      },
    },
  ],
};

const QUARTER_PAST_AND_TO: Lesson = {
  id: 'quarter-past-and-to',
  title: 'Quarter Past and Quarter To',
  emoji: '⏰',
  places: [{ skillId: 'clocks', rung: 2 }],
  practiceLevelId: 'time-quarter',
  // "The short hand has only just left 7" is written for reading the next hour
  // at quarter past (8:15 for 7:15), and "it is very close to 3, but it has not
  // got there yet" for the same slip at quarter to (3:45 for 2:45), the one
  // every second grader makes: play tags both 'off-by-one'.
  helpsWith: ['off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'The long hand has gone from 12 to 3. Each time the long hand moves on one number, 5 minutes go by. Count by 5s: 5, 10, 15. It is 15 minutes past 4.',
      caption: 'Long hand on 3: 15 minutes',
      scene: { kind: 'clock', hour: 4, minute: 15, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: '15 minutes is a quarter of the way round the clock. So we call it quarter past 4. You can say 4 15, too.',
      caption: 'Quarter past 4 = 4:15',
      scene: { kind: 'clock', hour: 4, minute: 15 },
    },
    {
      kind: 'watch',
      say: 'Now the long hand is on 9. Count by 5s to the 9. 5, 10, 15, 20, 25, 30, 35, 40, 45. It is 45 minutes past 4.',
      caption: 'Long hand on 9: 4:45',
      scene: { kind: 'clock', hour: 4, minute: 45, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: "Look at the short hand. It is nearly at 5, but it has not got there yet. So the hour is still 4. There is just a quarter of the way to go until 5 o'clock. So 4 45 is also called quarter to 5.",
      caption: '4:45 = quarter to 5',
      scene: { kind: 'clock', hour: 4, minute: 45, highlight: 'hour' },
    },
    {
      kind: 'try',
      say: 'Your turn! What time does the clock show? Look at the long hand first.',
      caption: 'What time is it?',
      scene: { kind: 'clock', hour: 7, minute: 15 },
      choices: ['7:15', '7:45', '8:15', '3:15'],
      answer: '7:15',
      hints: {
        '7:45': 'Look at the long hand. It is on 3, not 9. Count by 5s to the 3: 5, 10, 15.',
        '8:15': 'The short hand has only just left 7. It still has a long way to go to get to 8.',
        '3:15': '3 is where the long hand points. The long hand tells the minutes. The short hand tells the hour.',
      },
      then: {
        say: 'Yes! The long hand is on 3, so it is 15 minutes past. The short hand has just gone past 7. It is quarter past 7.',
        caption: 'Quarter past 7 = 7:15',
        scene: { kind: 'clock', hour: 7, minute: 15, highlight: 'hour' },
      },
    },
    {
      kind: 'try',
      say: 'One more. What time does the clock show? Look at both hands.',
      caption: 'What time is it now?',
      scene: { kind: 'clock', hour: 2, minute: 45 },
      choices: ['2:45', '3:45', '2:15', '9:45'],
      answer: '2:45',
      hints: {
        '3:45': 'The short hand is very close to 3, but it has not got there yet. So the hour is still 2.',
        '2:15': 'Look at the long hand. It is on 9, not 3. Count by 5s round to the 9. That is 45 minutes.',
        '9:45': '9 is where the long hand points. The short hand tells the hour. Which number has it just gone past?',
      },
      then: {
        say: 'Yes! The long hand is on 9, so it is 45 minutes past. The short hand has gone past 2, but it is not at 3 yet. It is 2 45. That is quarter to 3.',
        caption: '2:45 = quarter to 3',
        scene: { kind: 'clock', hour: 2, minute: 45, highlight: 'hour' },
      },
    },
  ],
};

const ONE_HOUR_LATER: Lesson = {
  id: 'one-hour-later',
  title: 'One Hour Later',
  emoji: '⏳',
  places: [{ skillId: 'clocks', rung: 2 }],
  // No level asks for a later time: only Play's quarter-hour rung does. Mixed
  // Clocks is that rung's level, with every kind of face.
  practiceLevelId: 'time-mixed',
  // "That is the time now" is written for giving back the time on the clock
  // ('answered-a-given-number'); "that is one hour before" and "half an hour
  // before" for going back instead of on ('wrong-operation'); and "that is 2
  // hours later" for counting two hours on, which play tags 'off-by-one'.
  helpsWith: ['answered-a-given-number', 'wrong-operation', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: "It is 3 o'clock. What time will it be in one hour? In one hour, the long hand goes all the way round the clock, and comes back to 12.",
      caption: '3:00. In 1 hour?',
      scene: { kind: 'clock', hour: 3, minute: 0, highlight: 'minute' },
    },
    {
      kind: 'watch',
      say: "While the long hand goes round once, the short hand moves on just one number, from 3 to 4. One hour after 3 o'clock, it is 4 o'clock.",
      caption: '1 hour later: 4:00',
      scene: { kind: 'clock', hour: 4, minute: 0, highlight: 'hour' },
    },
    {
      kind: 'try',
      say: "Your turn! It is 6 o'clock. What time will it be in one hour?",
      caption: '6:00. In 1 hour?',
      scene: { kind: 'clock', hour: 6, minute: 0 },
      choices: ['7:00', '6:00', '5:00', '8:00'],
      answer: '7:00',
      hints: {
        '6:00': 'That is the time now. In one hour, the short hand moves on to the next number.',
        '5:00': "That is one hour before 6 o'clock. Later means the hands go forward, the way the numbers count: 6, then 7.",
        '8:00': 'That is 2 hours later. In one hour, the short hand moves on just one number.',
      },
      then: {
        say: "Yes! The long hand goes all the way round, and the short hand moves on from 6 to 7. It will be 7 o'clock.",
        caption: '1 hour later: 7:00',
        scene: { kind: 'clock', hour: 7, minute: 0, highlight: 'hour' },
      },
    },
    {
      kind: 'watch',
      say: "Half an hour is shorter. In half an hour, the long hand goes only halfway round, from 12 down to 6. Half an hour after 3 o'clock, it is half past 3.",
      caption: 'Half an hour later: 3:30',
      scene: { kind: 'clock', hour: 3, minute: 30, highlight: 'minute' },
    },
    {
      kind: 'try',
      say: "It is 5 o'clock. What time will it be in half an hour?",
      caption: '5:00. In half an hour?',
      scene: { kind: 'clock', hour: 5, minute: 0 },
      choices: ['5:30', '5:00', '4:30', '6:00'],
      answer: '5:30',
      hints: {
        '5:00': 'That is the time now. Move the long hand halfway round, down to 6.',
        '4:30': "That is half an hour before 5 o'clock. Later means the long hand goes forward, the way the numbers count.",
        '6:00': 'That is a whole hour later. In half an hour, the long hand goes only halfway round, to the 6.',
      },
      then: {
        say: "Yes! The long hand goes halfway round, down to 6. Half an hour after 5 o'clock, it is half past 5.",
        caption: 'Half an hour later: 5:30',
        scene: { kind: 'clock', hour: 5, minute: 30, highlight: 'minute' },
      },
    },
    {
      kind: 'try',
      say: 'Now a harder one. It is half past 9. What time will it be in one hour?',
      caption: '9:30. In 1 hour?',
      scene: { kind: 'clock', hour: 9, minute: 30 },
      choices: ['10:30', '9:30', '8:30', '10:00'],
      answer: '10:30',
      hints: {
        '9:30': 'That is the time now. In one hour, the short hand moves on one number.',
        '8:30': 'That is one hour before. Later means the hands go forward: from 9, on to 10.',
        '10:00': 'That is only half an hour later. In one hour, the long hand goes all the way round, and ends up back on 6.',
      },
      then: {
        say: 'Yes! The long hand goes all the way round, back to 6. The short hand moves on one number. One hour after half past 9, it is half past 10.',
        caption: '1 hour later: 10:30',
        scene: { kind: 'clock', hour: 10, minute: 30, highlight: 'hour' },
      },
    },
  ],
};

export const CLOCK_LESSONS: Lesson[] = [O_CLOCK, HALF_PAST, QUARTER_PAST_AND_TO, ONE_HOUR_LATER];

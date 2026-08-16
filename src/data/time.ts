import { Question } from '@/types';

// Telling time on a drawn clock face.
//
// This used to show a Unicode clock emoji (🕒). That was tiny, rendered
// differently on every device, and — because the emoji already names the hour —
// let her answer without reading hands at all. Now every question draws a real
// face, and the hint tells her *how to look* instead of announcing the answer.
//
// Choice order doesn't matter here: buildSession shuffles per session.

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const wrap = (h: number) => ((h - 1 + 12) % 12) + 1;
const label = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

/** Distractors are the misreadings that actually happen at this age. */
function timeChoices(hour: number, minute: number): string[] {
  const correct = label(hour, minute);
  const candidates = [
    label(wrap(hour + 1), minute), // read the hour hand as the next number
    label(wrap(hour - 1), minute), // ...or the previous one
    label(hour, minute === 0 ? 30 : 0), // read the minute hand wrong
    label(wrap(hour + 1), minute === 0 ? 30 : 0),
    label(hour, minute === 15 ? 45 : 15),
    label(wrap(hour + 2), minute),
  ];
  const wrong: string[] = [];
  for (const c of candidates) {
    if (c !== correct && !wrong.includes(c)) wrong.push(c);
    if (wrong.length === 3) break;
  }
  return [correct, ...wrong];
}

function timeQuestion(hour: number, minute: number, difficulty: number, hint: string): Question {
  return {
    id: `time-${hour}-${minute}`,
    type: 'tell_time',
    prompt: 'What time does the clock show?',
    correctAnswer: label(hour, minute),
    choices: timeChoices(hour, minute),
    difficulty,
    hint,
    speakText: 'What time does the clock show?',
    visual: { kind: 'clock', hour, minute },
  };
}

const oClock = (h: number) =>
  timeQuestion(h, 0, 1, 'When the long hand points straight up at 12, it is exactly on the hour. Which number is the short hand on?');

const halfPast = (h: number) =>
  timeQuestion(h, 30, 2, 'The long hand on 6 means half past. The short hand sits between two numbers — the hour is the one it has already passed.');

const quarterPast = (h: number) =>
  timeQuestion(h, 15, 3, 'The long hand on 3 means fifteen minutes past. Read the hour from the short hand.');

const quarterTo = (h: number) =>
  timeQuestion(h, 45, 3, 'The long hand on 9 means forty-five minutes past — nearly the next hour. The hour is still the number the short hand has passed.');

export const OCLOCK_QUESTIONS: Question[] = HOURS.map(oClock);
export const HALF_PAST_QUESTIONS: Question[] = HOURS.map(halfPast);
export const QUARTER_QUESTIONS: Question[] = [
  ...HOURS.map(quarterPast),
  ...HOURS.map(quarterTo),
];

export const ALL_TIME_QUESTIONS: Question[] = [
  ...OCLOCK_QUESTIONS,
  ...HALF_PAST_QUESTIONS,
  ...QUARTER_QUESTIONS,
];

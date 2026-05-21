import { Question } from '@/types';

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Unicode clock emoji for o'clock hours 1-12
function clockEmoji(hour: number, half: boolean): string {
  const clocks: Record<string, string> = {
    '1:00': '🕐', '1:30': '🕜', '2:00': '🕑', '2:30': '🕝',
    '3:00': '🕒', '3:30': '🕞', '4:00': '🕓', '4:30': '🕟',
    '5:00': '🕔', '5:30': '🕠', '6:00': '🕕', '6:30': '🕡',
    '7:00': '🕖', '7:30': '🕢', '8:00': '🕗', '8:30': '🕣',
    '9:00': '🕘', '9:30': '🕤', '10:00': '🕙', '10:30': '🕥',
    '11:00': '🕚', '11:30': '🕦', '12:00': '🕛', '12:30': '🕧',
  };
  const key = `${hour}:${half ? '30' : '00'}`;
  return clocks[key] ?? '🕛';
}

function makeOClockQuestion(hour: number): Question {
  const correct = `${hour}:00`;
  const wrongs = new Set<string>();
  const candidates = [hour - 2, hour - 1, hour + 1, hour + 2].map((h) => {
    const fixed = ((h - 1 + 12) % 12) + 1;
    return `${fixed}:00`;
  });
  for (const c of candidates) {
    if (c !== correct) wrongs.add(c);
    if (wrongs.size === 3) break;
  }

  return {
    id: `time-oclock-${hour}`,
    type: 'tell_time',
    prompt: 'What time does the clock show?',
    promptEmoji: clockEmoji(hour, false),
    correctAnswer: correct,
    choices: shuffle([correct, ...Array.from(wrongs)]),
    difficulty: 1,
    hint: `The short hand points to ${hour}, the long hand points to 12.`,
    speakText: `What time does the clock show?`,
  };
}

function makeHalfPastQuestion(hour: number): Question {
  const correct = `${hour}:30`;
  const wrongs = new Set<string>();
  const candidates = [
    `${hour}:00`,
    `${((hour % 12) + 1)}:30`,
    `${((hour - 2 + 12) % 12) + 1}:30`,
    `${hour}:00`,
  ];
  for (const c of candidates) {
    if (c !== correct) wrongs.add(c);
    if (wrongs.size === 3) break;
  }

  return {
    id: `time-half-${hour}`,
    type: 'tell_time',
    prompt: 'What time does the clock show?',
    promptEmoji: clockEmoji(hour, true),
    correctAnswer: correct,
    choices: shuffle([correct, ...Array.from(wrongs)]),
    difficulty: 2,
    hint: `The long hand points to 6, which means 30 minutes. The short hand is between ${hour} and ${(hour % 12) + 1}.`,
    speakText: `What time does the clock show?`,
  };
}

export const OCLOCK_QUESTIONS: Question[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(makeOClockQuestion);
export const HALF_PAST_QUESTIONS: Question[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(makeHalfPastQuestion);
export const ALL_TIME_QUESTIONS: Question[] = [...OCLOCK_QUESTIONS, ...HALF_PAST_QUESTIONS];

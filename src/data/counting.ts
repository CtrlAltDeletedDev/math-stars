import { Question } from '@/types';

function makeCountQ(
  id: string,
  count: number,
  emoji: string,
  difficulty: number,
  choices?: string[],
): Question {
  const correct = String(count);
  const wrong = choices ?? [
    String(count - 1),
    String(count + 1),
    String(count + 2),
  ];
  const allChoices = shuffle([correct, ...wrong.slice(0, 3)]);
  return {
    id,
    type: 'counting',
    prompt: `How many ${emoji} are there?`,
    promptEmoji: emoji.repeat(count),
    correctAnswer: correct,
    choices: allChoices,
    difficulty,
  };
}

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const COUNTING_QUESTIONS: Question[] = [
  makeCountQ('count-1', 3, '⭐', 1, ['2', '4', '5']),
  makeCountQ('count-2', 5, '🍎', 1, ['4', '6', '3']),
  makeCountQ('count-3', 2, '🐱', 1, ['1', '3', '4']),
  makeCountQ('count-4', 4, '🌸', 1, ['3', '5', '6']),
  makeCountQ('count-5', 6, '🐢', 1, ['5', '7', '4']),
  makeCountQ('count-6', 7, '🍓', 2, ['6', '8', '5']),
  makeCountQ('count-7', 8, '🦋', 2, ['7', '9', '6']),
  makeCountQ('count-8', 9, '🌟', 2, ['8', '10', '7']),
  makeCountQ('count-9', 10, '🐸', 2, ['9', '11', '8']),
  makeCountQ('count-10', 1, '🐶', 1, ['2', '3', '0']),
  makeCountQ('count-11', 12, '🍦', 3, ['11', '13', '10']),
  makeCountQ('count-12', 15, '🌈', 3, ['14', '16', '13']),
  makeCountQ('count-13', 14, '🦄', 3, ['13', '15', '12']),
  makeCountQ('count-14', 18, '🌺', 3, ['17', '19', '16']),
  makeCountQ('count-15', 20, '🐠', 3, ['19', '21', '18']),
];

const COMPARE_QUESTIONS: Question[] = [
  {
    id: 'cmp-1',
    type: 'number_compare',
    prompt: 'Which number is bigger?',
    promptEmoji: '5  or  3',
    correctAnswer: '5',
    choices: ['5', '3', '4', '2'],
    difficulty: 1,
  },
  {
    id: 'cmp-2',
    type: 'number_compare',
    prompt: 'Which number is bigger?',
    promptEmoji: '7  or  9',
    correctAnswer: '9',
    choices: ['9', '7', '8', '6'],
    difficulty: 1,
  },
  {
    id: 'cmp-3',
    type: 'number_compare',
    prompt: 'Which number is smaller?',
    promptEmoji: '4  or  8',
    correctAnswer: '4',
    choices: ['4', '8', '6', '2'],
    difficulty: 1,
  },
  {
    id: 'cmp-4',
    type: 'number_compare',
    prompt: 'Which number is bigger?',
    promptEmoji: '12  or  15',
    correctAnswer: '15',
    choices: ['15', '12', '14', '11'],
    difficulty: 2,
  },
  {
    id: 'cmp-5',
    type: 'number_compare',
    prompt: 'Which number is smaller?',
    promptEmoji: '13  or  17',
    correctAnswer: '13',
    choices: ['13', '17', '15', '10'],
    difficulty: 2,
  },
  {
    id: 'cmp-6',
    type: 'number_compare',
    prompt: 'Which number is bigger?',
    promptEmoji: '20  or  18',
    correctAnswer: '20',
    choices: ['20', '18', '19', '17'],
    difficulty: 2,
  },
  {
    id: 'ord-1',
    type: 'number_order',
    prompt: 'What number comes next?',
    promptEmoji: '1, 2, 3, ?',
    correctAnswer: '4',
    choices: ['4', '5', '3', '6'],
    difficulty: 1,
  },
  {
    id: 'ord-2',
    type: 'number_order',
    prompt: 'What number comes next?',
    promptEmoji: '5, 6, 7, ?',
    correctAnswer: '8',
    choices: ['8', '9', '7', '10'],
    difficulty: 1,
  },
  {
    id: 'ord-3',
    type: 'number_order',
    prompt: 'What number comes next?',
    promptEmoji: '8, 9, 10, ?',
    correctAnswer: '11',
    choices: ['11', '12', '10', '13'],
    difficulty: 2,
  },
  {
    id: 'ord-4',
    type: 'number_order',
    prompt: 'What number is missing?',
    promptEmoji: '3, ?, 5',
    correctAnswer: '4',
    choices: ['4', '6', '2', '3'],
    difficulty: 2,
  },
  {
    id: 'ord-5',
    type: 'number_order',
    prompt: 'What number is missing?',
    promptEmoji: '10, ?, 12',
    correctAnswer: '11',
    choices: ['11', '13', '9', '14'],
    difficulty: 2,
  },
];

export const ALL_COUNTING_QUESTIONS: Question[] = [...COUNTING_QUESTIONS, ...COMPARE_QUESTIONS];

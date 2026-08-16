import { Question } from '@/types';

// These are genuinely binary questions, so they offer two options. They used to
// pad to four with 'Neither' and 'Both', which are never correct — that turned a
// real question into a coin flip with decoration. EVEN_ODD_FIND below carries the
// four-option assessment for this category.

export const EVEN_ODD_ID: Question[] = [
  { id: 'eo-id-0', type: 'even_odd', prompt: 'Is 0 even or odd?', promptEmoji: '0️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-1', type: 'even_odd', prompt: 'Is 1 even or odd?', promptEmoji: '1️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-2', type: 'even_odd', prompt: 'Is 2 even or odd?', promptEmoji: '2️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-3', type: 'even_odd', prompt: 'Is 3 even or odd?', promptEmoji: '3️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-4', type: 'even_odd', prompt: 'Is 4 even or odd?', promptEmoji: '4️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-5', type: 'even_odd', prompt: 'Is 5 even or odd?', promptEmoji: '5️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-6', type: 'even_odd', prompt: 'Is 6 even or odd?', promptEmoji: '6️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-7', type: 'even_odd', prompt: 'Is 7 even or odd?', promptEmoji: '7️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-8', type: 'even_odd', prompt: 'Is 8 even or odd?', promptEmoji: '8️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-9', type: 'even_odd', prompt: 'Is 9 even or odd?', promptEmoji: '9️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-10', type: 'even_odd', prompt: 'Is 10 even or odd?', promptEmoji: '🔟', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 1 },
  { id: 'eo-id-11', type: 'even_odd', prompt: 'Is 11 even or odd?', promptEmoji: '1️⃣1️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-12', type: 'even_odd', prompt: 'Is 12 even or odd?', promptEmoji: '1️⃣2️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-13', type: 'even_odd', prompt: 'Is 13 even or odd?', promptEmoji: '1️⃣3️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-14', type: 'even_odd', prompt: 'Is 14 even or odd?', promptEmoji: '1️⃣4️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-15', type: 'even_odd', prompt: 'Is 15 even or odd?', promptEmoji: '1️⃣5️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-16', type: 'even_odd', prompt: 'Is 16 even or odd?', promptEmoji: '1️⃣6️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-17', type: 'even_odd', prompt: 'Is 17 even or odd?', promptEmoji: '1️⃣7️⃣', correctAnswer: 'Odd', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-18', type: 'even_odd', prompt: 'Is 18 even or odd?', promptEmoji: '1️⃣8️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
  { id: 'eo-id-20', type: 'even_odd', prompt: 'Is 20 even or odd?', promptEmoji: '2️⃣0️⃣', correctAnswer: 'Even', choices: ['Even', 'Odd'], difficulty: 2 },
];

export const EVEN_ODD_FIND: Question[] = [
  { id: 'eo-find-even-8', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '8', choices: ['7', '8', '9', '11'], difficulty: 1 },
  { id: 'eo-find-even-12', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '12', choices: ['11', '12', '13', '15'], difficulty: 2 },
  { id: 'eo-find-even-4', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '4', choices: ['3', '4', '5', '7'], difficulty: 1 },
  { id: 'eo-find-even-16', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '16', choices: ['13', '15', '16', '19'], difficulty: 2 },
  { id: 'eo-find-even-6', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '6', choices: ['1', '5', '6', '9'], difficulty: 1 },
  { id: 'eo-find-even-20', type: 'even_odd', prompt: 'Which number is even?', promptEmoji: '🟢', correctAnswer: '20', choices: ['17', '19', '20', '11'], difficulty: 2 },
  { id: 'eo-find-odd-7', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '7', choices: ['2', '4', '6', '7'], difficulty: 1 },
  { id: 'eo-find-odd-5', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '5', choices: ['2', '4', '5', '8'], difficulty: 1 },
  { id: 'eo-find-odd-11', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '11', choices: ['10', '11', '12', '14'], difficulty: 2 },
  { id: 'eo-find-odd-13', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '13', choices: ['10', '12', '13', '14'], difficulty: 2 },
  { id: 'eo-find-odd-3', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '3', choices: ['2', '3', '4', '6'], difficulty: 1 },
  { id: 'eo-find-odd-19', type: 'even_odd', prompt: 'Which number is odd?', promptEmoji: '🔴', correctAnswer: '19', choices: ['16', '18', '19', '20'], difficulty: 2 },
  { id: 'eo-next-even-6', type: 'even_odd', prompt: 'What is the next even number after 6?', promptEmoji: '➡️', correctAnswer: '8', choices: ['8', '7', '9', '10'], difficulty: 2 },
  { id: 'eo-next-even-10', type: 'even_odd', prompt: 'What is the next even number after 10?', promptEmoji: '➡️', correctAnswer: '12', choices: ['12', '11', '13', '14'], difficulty: 2 },
  { id: 'eo-next-even-14', type: 'even_odd', prompt: 'What is the next even number after 14?', promptEmoji: '➡️', correctAnswer: '16', choices: ['16', '15', '17', '18'], difficulty: 2 },
  { id: 'eo-next-odd-5', type: 'even_odd', prompt: 'What is the next odd number after 5?', promptEmoji: '➡️', correctAnswer: '7', choices: ['7', '6', '8', '4'], difficulty: 2 },
  { id: 'eo-next-odd-9', type: 'even_odd', prompt: 'What is the next odd number after 9?', promptEmoji: '➡️', correctAnswer: '11', choices: ['11', '10', '12', '8'], difficulty: 2 },
  { id: 'eo-next-odd-13', type: 'even_odd', prompt: 'What is the next odd number after 13?', promptEmoji: '➡️', correctAnswer: '15', choices: ['15', '14', '16', '12'], difficulty: 2 },
  { id: 'eo-ends-even', type: 'even_odd', prompt: 'Even numbers always end in which digits?', promptEmoji: '🔢', correctAnswer: '0, 2, 4, 6, or 8', choices: ['0, 2, 4, 6, or 8', '1, 3, 5, 7, or 9', 'Any digit', '0 only'], difficulty: 3 },
  { id: 'eo-count-even', type: 'even_odd', prompt: 'How many even numbers are between 1 and 10?', promptEmoji: '🔢', correctAnswer: '5', choices: ['5', '4', '6', '10'], difficulty: 3 },
];

export const ALL_EVEN_ODD_QUESTIONS = [...EVEN_ODD_ID, ...EVEN_ODD_FIND];

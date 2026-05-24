import { Category } from '@/types';
import { ALL_COUNTING_QUESTIONS } from './counting';
import { ALL_SHAPE_QUESTIONS } from './shapes';
import { ALL_TIME_QUESTIONS, OCLOCK_QUESTIONS, HALF_PAST_QUESTIONS } from './time';
import { MEASUREMENT_QUESTIONS } from './measurement';
import { COINS_QUESTIONS } from './coins';

export const CATEGORIES: Category[] = [
  {
    id: 'addition',
    title: 'Adding & Taking Away',
    emoji: '➕',
    bgColor: '#FF6B6B',
    darkColor: '#D94F4F',
    levels: [
      {
        id: 'addition-1',
        categoryId: 'addition',
        levelNumber: 1,
        title: 'Adding to 5',
        description: 'Practice adding small numbers!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'addition', maxSum: 5 },
      },
      {
        id: 'addition-2',
        categoryId: 'addition',
        levelNumber: 2,
        title: 'Adding to 10',
        description: 'Add bigger numbers!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'addition', maxSum: 10 },
      },
      {
        id: 'addition-3',
        categoryId: 'addition',
        levelNumber: 3,
        title: 'Adding to 20',
        description: 'You\'re getting so good!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'addition', maxSum: 20 },
      },
      {
        id: 'subtraction-1',
        categoryId: 'addition',
        levelNumber: 4,
        title: 'Taking Away (to 5)',
        description: 'What\'s left over?',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'subtraction', maxMinuend: 5 },
      },
      {
        id: 'subtraction-2',
        categoryId: 'addition',
        levelNumber: 5,
        title: 'Taking Away (to 10)',
        description: 'Bigger take-aways!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'subtraction', maxMinuend: 10 },
      },
      {
        id: 'mixed-1',
        categoryId: 'addition',
        levelNumber: 6,
        title: 'Mix It Up!',
        description: 'Adding AND taking away!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'mixed', maxSum: 20, maxMinuend: 20 },
      },
    ],
  },
  {
    id: 'counting',
    title: 'Counting & Numbers',
    emoji: '🔢',
    bgColor: '#5DD97A',
    darkColor: '#3DB85A',
    levels: [
      {
        id: 'count-1',
        categoryId: 'counting',
        levelNumber: 1,
        title: 'Count to 10',
        description: 'How many do you see?',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_COUNTING_QUESTIONS
          .filter((q) => q.difficulty === 1 && q.type === 'counting')
          .map((q) => q.id),
      },
      {
        id: 'count-2',
        categoryId: 'counting',
        levelNumber: 2,
        title: 'Count to 20',
        description: 'Count even more!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_COUNTING_QUESTIONS
          .filter((q) => q.type === 'counting')
          .map((q) => q.id),
      },
      {
        id: 'count-3',
        categoryId: 'counting',
        levelNumber: 3,
        title: 'What Comes Next?',
        description: 'Order numbers in a row!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_COUNTING_QUESTIONS
          .filter((q) => q.type === 'number_order')
          .map((q) => q.id),
      },
      {
        id: 'count-4',
        categoryId: 'counting',
        levelNumber: 4,
        title: 'Bigger or Smaller?',
        description: 'Compare two numbers!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_COUNTING_QUESTIONS
          .filter((q) => q.type === 'number_compare')
          .map((q) => q.id),
      },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes & Patterns',
    emoji: '🔷',
    bgColor: '#C77DFF',
    darkColor: '#9B50E0',
    levels: [
      {
        id: 'shapes-1',
        categoryId: 'shapes',
        levelNumber: 1,
        title: 'Basic Shapes',
        description: 'Learn your shapes!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_SHAPE_QUESTIONS
          .filter((q) => q.type === 'shape_identify' && q.difficulty === 1)
          .map((q) => q.id),
      },
      {
        id: 'shapes-2',
        categoryId: 'shapes',
        levelNumber: 2,
        title: 'More Shapes',
        description: 'Even more shapes!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_SHAPE_QUESTIONS
          .filter((q) => q.type === 'shape_identify')
          .map((q) => q.id),
      },
      {
        id: 'patterns-1',
        categoryId: 'shapes',
        levelNumber: 3,
        title: 'Simple Patterns',
        description: 'What comes next?',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_SHAPE_QUESTIONS
          .filter((q) => q.type === 'pattern_complete' && q.difficulty <= 2)
          .map((q) => q.id),
      },
      {
        id: 'patterns-2',
        categoryId: 'shapes',
        levelNumber: 4,
        title: 'Number Patterns',
        description: 'Patterns with numbers!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: ALL_SHAPE_QUESTIONS
          .filter((q) => q.type === 'pattern_complete')
          .map((q) => q.id),
      },
    ],
  },
  {
    id: 'multiplication',
    title: 'Skip Counting',
    emoji: '🚀',
    bgColor: '#4FC3F7',
    darkColor: '#0288D1',
    levels: [
      {
        id: 'skip-2',
        categoryId: 'multiplication',
        levelNumber: 1,
        title: 'Count by 2s',
        description: '2, 4, 6, 8... go!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'skip_count', by: 2, maxStart: 20 },
      },
      {
        id: 'skip-5',
        categoryId: 'multiplication',
        levelNumber: 2,
        title: 'Count by 5s',
        description: '5, 10, 15, 20... go!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'skip_count', by: 5, maxStart: 50 },
      },
      {
        id: 'skip-10',
        categoryId: 'multiplication',
        levelNumber: 3,
        title: 'Count by 10s',
        description: '10, 20, 30... go!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'skip_count', by: 10, maxStart: 100 },
      },
      {
        id: 'times-2',
        categoryId: 'multiplication',
        levelNumber: 4,
        title: '× 2 Table',
        description: 'The 2 times table!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'multiplication', tables: '2' },
      },
      {
        id: 'times-5',
        categoryId: 'multiplication',
        levelNumber: 5,
        title: '× 5 Table',
        description: 'The 5 times table!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'multiplication', tables: '5' },
      },
      {
        id: 'times-10',
        categoryId: 'multiplication',
        levelNumber: 6,
        title: '× 10 Table',
        description: 'The 10 times table!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        generatorParams: { operation: 'multiplication', tables: '10' },
      },
    ],
  },
  {
    id: 'measure',
    title: 'Measurement & Money',
    emoji: '📏',
    bgColor: '#FF7043',
    darkColor: '#BF360C',
    levels: [
      {
        id: 'measure-length',
        categoryId: 'measure',
        levelNumber: 1,
        title: 'Longer & Shorter',
        description: 'Compare sizes and lengths!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: MEASUREMENT_QUESTIONS.map((q) => q.id),
      },
      {
        id: 'measure-coins',
        categoryId: 'measure',
        levelNumber: 2,
        title: 'Coins & Money',
        description: 'Pennies, nickels, dimes, quarters!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: COINS_QUESTIONS.map((q) => q.id),
      },
    ],
  },
  {
    id: 'time',
    title: 'Telling Time',
    emoji: '🕐',
    bgColor: '#F9CA24',
    darkColor: '#E55039',
    levels: [
      {
        id: 'time-oclock',
        categoryId: 'time',
        levelNumber: 1,
        title: "O'Clock",
        description: 'What time is it?',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: OCLOCK_QUESTIONS.map((q) => q.id),
      },
      {
        id: 'time-halfpast',
        categoryId: 'time',
        levelNumber: 2,
        title: 'Half Past',
        description: 'Half past the hour!',
        questionsPerSession: 8,
        passThreshold: 0.8,
        questionBankIds: HALF_PAST_QUESTIONS.map((q) => q.id),
      },
      {
        id: 'time-mixed',
        categoryId: 'time',
        levelNumber: 3,
        title: 'Mixed Clocks',
        description: 'All times mixed together!',
        questionsPerSession: 10,
        passThreshold: 0.8,
        questionBankIds: ALL_TIME_QUESTIONS.map((q) => q.id),
      },
    ],
  },
];

export const ALL_QUESTIONS_BY_ID: Map<string, import('@/types').Question> = new Map([
  ...ALL_COUNTING_QUESTIONS.map((q) => [q.id, q] as [string, import('@/types').Question]),
  ...ALL_SHAPE_QUESTIONS.map((q) => [q.id, q] as [string, import('@/types').Question]),
  ...ALL_TIME_QUESTIONS.map((q) => [q.id, q] as [string, import('@/types').Question]),
  ...MEASUREMENT_QUESTIONS.map((q) => [q.id, q] as [string, import('@/types').Question]),
  ...COINS_QUESTIONS.map((q) => [q.id, q] as [string, import('@/types').Question]),
]);

export function getLevelById(levelId: string) {
  for (const cat of CATEGORIES) {
    const level = cat.levels.find((l) => l.id === levelId);
    if (level) return level;
  }
  return null;
}

export function getCategoryById(categoryId: string) {
  return CATEGORIES.find((c) => c.id === categoryId) ?? null;
}

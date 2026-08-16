import { Question } from '@/types';

// The only three signs that can go in the box. There used to be a fourth option,
// '≠', which was never the marked answer — and which is genuinely *true* for
// every unequal pair, so a child who picked it was right and was told she was
// wrong. Order doesn't matter here; buildSession shuffles choices per session.
const COMPARE_CHOICES = ['<', '>', '='];

function q(
  id: string,
  a: number,
  op: '<' | '>' | '=',
  b: number,
  difficulty: number,
): Question {
  const opWord = op === '>' ? 'greater than' : op === '<' ? 'less than' : 'equal to';
  return {
    id,
    type: 'number_compare',
    prompt: `${a} ☐ ${b}`,
    correctAnswer: op,
    choices: [...COMPARE_CHOICES],
    difficulty,
    hint: `${a} is ${opWord} ${b}`,
    speakText: `Which sign goes in the box? ${a} and ${b}`,
  };
}

export const COMPARE_TO10_QUESTIONS: Question[] = [
  // Greater than
  q('cmp-5-gt-3',  5, '>',  3, 1),
  q('cmp-7-gt-2',  7, '>',  2, 1),
  q('cmp-8-gt-4',  8, '>',  4, 1),
  q('cmp-9-gt-6',  9, '>',  6, 1),
  q('cmp-10-gt-7',10, '>',  7, 1),
  q('cmp-6-gt-1',  6, '>',  1, 1),
  q('cmp-4-gt-1',  4, '>',  1, 1),
  q('cmp-9-gt-3',  9, '>',  3, 1),
  q('cmp-10-gt-5',10, '>',  5, 1),
  // Less than
  q('cmp-2-lt-5',  2, '<',  5, 1),
  q('cmp-3-lt-7',  3, '<',  7, 1),
  q('cmp-4-lt-8',  4, '<',  8, 1),
  q('cmp-1-lt-6',  1, '<',  6, 1),
  q('cmp-3-lt-9',  3, '<',  9, 1),
  q('cmp-5-lt-10', 5, '<', 10, 1),
  q('cmp-2-lt-8',  2, '<',  8, 1),
  q('cmp-4-lt-7',  4, '<',  7, 1),
  // Equal
  q('cmp-5-eq-5',  5, '=',  5, 1),
  q('cmp-3-eq-3',  3, '=',  3, 1),
  q('cmp-8-eq-8',  8, '=',  8, 1),
  q('cmp-2-eq-2',  2, '=',  2, 1),
  q('cmp-7-eq-7',  7, '=',  7, 1),
  q('cmp-10-eq-10',10,'=', 10, 1),
];

export const COMPARE_TO20_QUESTIONS: Question[] = [
  // Greater than (larger numbers)
  q('cmp-15-gt-8', 15, '>',  8, 2),
  q('cmp-20-gt-11',20, '>', 11, 2),
  q('cmp-17-gt-9', 17, '>',  9, 2),
  q('cmp-14-gt-6', 14, '>',  6, 2),
  q('cmp-19-gt-13',19, '>', 13, 2),
  q('cmp-12-gt-5', 12, '>',  5, 2),
  q('cmp-18-gt-10',18, '>', 10, 2),
  q('cmp-16-gt-7', 16, '>',  7, 2),
  q('cmp-13-gt-4', 13, '>',  4, 2),
  // Less than
  q('cmp-8-lt-15',  8, '<', 15, 2),
  q('cmp-11-lt-20',11, '<', 20, 2),
  q('cmp-9-lt-17',  9, '<', 17, 2),
  q('cmp-6-lt-14',  6, '<', 14, 2),
  q('cmp-5-lt-12',  5, '<', 12, 2),
  q('cmp-10-lt-18',10, '<', 18, 2),
  q('cmp-7-lt-16',  7, '<', 16, 2),
  q('cmp-4-lt-13',  4, '<', 13, 2),
  // Equal
  q('cmp-12-eq-12',12, '=', 12, 2),
  q('cmp-15-eq-15',15, '=', 15, 2),
  q('cmp-20-eq-20',20, '=', 20, 2),
  q('cmp-11-eq-11',11, '=', 11, 2),
  q('cmp-17-eq-17',17, '=', 17, 2),
];

export const ALL_COMPARE_QUESTIONS: Question[] = [
  ...COMPARE_TO10_QUESTIONS,
  ...COMPARE_TO20_QUESTIONS,
];

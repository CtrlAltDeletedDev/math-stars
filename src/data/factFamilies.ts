import { Question } from '@/types';

// A fact family is the trio {part, part, whole} and the four facts that connect
// them. Two question shapes, neither of which can be answered by reading the
// prompt:
//
//   "pick the fact"  — shows one fact, asks which other one is also true.
//   "which member"   — shows the three numbers, asks for a specific one. The
//                      answer is in the trio, but so are the distractors, so she
//                      has to work out *which* member, not just spot a number.
//
// The old version asked "a + b = sum, so sum − a = ?" and printed the answer in
// the prompt, and built distractors as correct±1 plus "the other addend" — which
// collided often enough that 15 questions rendered a duplicate option.

function pickTheFact(a: number, b: number): Question {
  const sum = a + b;
  // For a doubles family (a === b) the "took away the wrong part" distractor
  // would read identically to the correct fact, so use a different near miss.
  const wrongPart = a === b ? `${sum} − ${a} = ${sum}` : `${sum} − ${a} = ${a}`;
  return {
    id: `ff-fact-${a}-${b}`,
    type: 'fact_family',
    prompt: `${a} + ${b} = ${sum}\n\nWhich one is ALSO true?`,
    correctAnswer: `${sum} − ${a} = ${b}`,
    choices: [
      `${sum} − ${a} = ${b}`,
      wrongPart,
      `${sum} + ${a} = ${b}`,
      `${a} − ${b} = ${sum}`,
    ],
    difficulty: sum <= 10 ? 2 : 3,
    hint: `Take one part away from the whole and you get the other part. The whole is ${sum}.`,
    speakText: `${a} plus ${b} equals ${sum}. Which one is also true?`,
  };
}

function whichMember(a: number, b: number, askFor: 'a' | 'b'): Question {
  const sum = a + b;
  const subtracted = askFor === 'a' ? b : a;
  const correct = askFor === 'a' ? a : b;
  const other = askFor === 'a' ? b : a;

  // Distractors are the other two members of the family plus a near miss, so the
  // child must identify the right member rather than recognise a familiar digit.
  const wrong = [sum, other, correct + 1, correct - 1, sum + 1]
    .filter((n, i, arr) => n >= 0 && n !== correct && arr.indexOf(n) === i)
    .slice(0, 3);

  return {
    id: `ff-mem-${a}-${b}-${askFor}`,
    type: 'fact_family',
    prompt: `This family is ${a}, ${b}, ${sum}.\n\n${sum} − ${subtracted} = ?`,
    correctAnswer: String(correct),
    choices: [String(correct), ...wrong.map(String)],
    difficulty: sum <= 10 ? 2 : 3,
    hint: `${sum} is the whole. Take away the part you can see, and what's left is the other part.`,
    speakText: `This family is ${a}, ${b}, ${sum}. What is ${sum} minus ${subtracted}?`,
  };
}

function family(a: number, b: number): Question[] {
  // A doubles family (a === b) only has one distinct subtraction fact.
  return a === b
    ? [pickTheFact(a, b), whichMember(a, b, 'a')]
    : [pickTheFact(a, b), whichMember(a, b, 'a'), whichMember(a, b, 'b')];
}

// Level 1: sums up to 10
export const FACT_FAMILIES_10: Question[] = [
  ...family(2, 1),
  ...family(3, 2),
  ...family(4, 2),
  ...family(3, 3),
  ...family(4, 3),
  ...family(5, 2),
  ...family(5, 4),
  ...family(6, 3),
  ...family(6, 4),
  ...family(7, 2),
  ...family(8, 2),
  ...family(5, 5),
];

// Level 2: sums 11–18
export const FACT_FAMILIES_20: Question[] = [
  ...family(6, 5),
  ...family(7, 4),
  ...family(8, 3),
  ...family(9, 2),
  ...family(7, 5),
  ...family(8, 4),
  ...family(7, 6),
  ...family(8, 5),
  ...family(9, 4),
  ...family(9, 9),
];

export const ALL_FACT_FAMILIES_QUESTIONS: Question[] = [
  ...FACT_FAMILIES_10,
  ...FACT_FAMILIES_20,
];

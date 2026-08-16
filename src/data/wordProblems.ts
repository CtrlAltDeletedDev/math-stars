import { Question } from '@/types';
import { buildChoices } from '@/engine/choices';

// Word problems were unreachable for a while — no level referenced them — so
// they still carried a private copy of the old "walk outward from the answer"
// choice builder, which made every option four consecutive integers. They now
// go through the shared builder like everything else.

/** Adding: the slips are counting one off, or answering with an operand. */
function addChoices(a: number, b: number): string[] {
  const c = a + b;
  return buildChoices(c, [c - 1, c + 1, Math.abs(a - b), a, b, c + 10], { step: 1 });
}

/** Taking away: by far the most common error is adding instead. */
function subChoices(a: number, b: number): string[] {
  const c = a - b;
  return buildChoices(c, [a + b, c + 1, c - 1, b, a, Math.max(0, b - 1)], {
    step: 1,
    isValid: (n) => n >= 0 && n <= a + b,
  });
}

type Template = {
  key: string;
  /** Random operands for a fresh question. */
  pick: () => [number, number];
  /** The question itself, from fixed operands — this is what makes it rebuildable. */
  build: (a: number, b: number, characterName: string) => Question;
};

const ADDITION_TEMPLATES: Template[] = [
  {
    key: 'add',
    pick: () => [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1],
    build: (a, b, n) => ({
      id: `wp-add-${a}+${b}`,
      type: 'word_problem',
      prompt: `${n} has ${a} apples 🍎 and finds ${b} more. How many apples does ${n} have now?`,
      correctAnswer: String(a + b),
      choices: addChoices(a, b),
      difficulty: 1,
      hint: `Count up ${b} from ${a}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}`,
      speakText: `${n} has ${a} apples and finds ${b} more. How many apples does ${n} have now?`,
    }),
  },
  {
    key: 'add2',
    pick: () => [Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 1],
    build: (a, b, _n) => ({
      id: `wp-add2-${a}+${b}`,
      type: 'word_problem',
      prompt: `There are ${a} birds 🐦 in a tree. ${b} more fly in. How many birds are there now?`,
      correctAnswer: String(a + b),
      choices: addChoices(a, b),
      difficulty: 1,
      hint: `Start at ${a} and count on ${b} more.`,
      speakText: `There are ${a} birds in a tree. ${b} more fly in. How many birds are there now?`,
    }),
  },
  {
    key: 'add3',
    pick: () => [Math.floor(Math.random() * 5) + 2, Math.floor(Math.random() * 5) + 2],
    build: (a, b, n) => ({
      id: `wp-add3-${a}+${b}`,
      type: 'word_problem',
      prompt: `${n} drew ${a} stars ⭐ on Monday and ${b} stars on Tuesday. How many stars altogether?`,
      correctAnswer: String(a + b),
      choices: addChoices(a, b),
      difficulty: 2,
      hint: `Add ${a} and ${b} together.`,
      speakText: `${n} drew ${a} stars on Monday and ${b} stars on Tuesday. How many stars altogether?`,
    }),
  },
];

const SUBTRACTION_TEMPLATES: Template[] = [
  {
    key: 'sub',
    pick: () => {
      const a = Math.floor(Math.random() * 5) + 4;
      return [a, Math.floor(Math.random() * (a - 1)) + 1];
    },
    build: (a, b, n) => ({
      id: `wp-sub-${a}-${b}`,
      type: 'word_problem',
      prompt: `${n} had ${a} cookies 🍪. ${n} ate ${b} of them. How many cookies are left?`,
      correctAnswer: String(a - b),
      choices: subChoices(a, b),
      difficulty: 2,
      hint: `Start at ${a} and count back ${b}.`,
      speakText: `${n} had ${a} cookies. ${n} ate ${b} of them. How many cookies are left?`,
    }),
  },
  {
    key: 'sub2',
    pick: () => [Math.floor(Math.random() * 5) + 5, Math.floor(Math.random() * 4) + 1],
    build: (a, b, _n) => ({
      id: `wp-sub2-${a}-${b}`,
      type: 'word_problem',
      prompt: `There are ${a} fish 🐟 in a pond. ${b} fish swim away. How many fish are left?`,
      correctAnswer: String(a - b),
      choices: subChoices(a, b),
      difficulty: 2,
      hint: `${a} take away ${b}.`,
      speakText: `There are ${a} fish in a pond. ${b} fish swim away. How many fish are left?`,
    }),
  },
];

export function generateWordProblem(characterName: string, type: 'addition' | 'subtraction' | 'mixed'): Question {
  let templates = type === 'addition'
    ? ADDITION_TEMPLATES
    : type === 'subtraction'
    ? SUBTRACTION_TEMPLATES
    : [...ADDITION_TEMPLATES, ...SUBTRACTION_TEMPLATES];

  const template = templates[Math.floor(Math.random() * templates.length)];
  const [a, b] = template.pick();
  return template.build(a, b, characterName);
}

const ALL_TEMPLATES = [...ADDITION_TEMPLATES, ...SUBTRACTION_TEMPLATES];

/**
 * Rebuild a word problem from its id, so one she got wrong can come back in
 * Practice Mistakes. Without this the SRS stored a card it could never show.
 */
export function wordProblemFromId(id: string, characterName = 'You'): Question | null {
  const m = id.match(/^wp-([a-z0-9]+)-(\d+)[+-](\d+)$/);
  if (!m) return null;
  const template = ALL_TEMPLATES.find((t) => t.key === m[1]);
  return template ? template.build(Number(m[2]), Number(m[3]), characterName) : null;
}

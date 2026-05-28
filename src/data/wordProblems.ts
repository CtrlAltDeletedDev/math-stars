import { Question } from '@/types';

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function choices(correct: number, min: number, max: number): string[] {
  const lo = 0;
  const hi = Math.max(max, correct + 3, 3);

  const wrong = new Set<number>();
  for (const d of [-2, -1, 1, 2]) {
    const v = correct + d;
    if (v !== correct && v >= lo && v <= hi) wrong.add(v);
    if (wrong.size === 3) break;
  }
  while (wrong.size < 3) {
    const v = Math.floor(Math.random() * (hi - lo + 1)) + lo;
    if (v !== correct) wrong.add(v);
  }
  return shuffle([correct, ...Array.from(wrong)].map(String));
}

type Template = { make: (characterName: string) => Question };

const ADDITION_TEMPLATES: Template[] = [
  {
    make: (n) => {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = a + b;
      return {
        id: `wp-add-${a}+${b}`,
        type: 'word_problem',
        prompt: `${n} has ${a} apples 🍎 and finds ${b} more. How many apples does ${n} have now?`,
        correctAnswer: String(c),
        choices: choices(c, 1, c + 3),
        difficulty: 1,
        hint: `Count up ${b} from ${a}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}`,
        speakText: `${n} has ${a} apples and finds ${b} more. How many apples does ${n} have now?`,
      };
    },
  },
  {
    make: (n) => {
      const a = Math.floor(Math.random() * 5) + 3;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = a + b;
      return {
        id: `wp-add2-${a}+${b}`,
        type: 'word_problem',
        prompt: `There are ${a} birds 🐦 in a tree. ${b} more fly in. How many birds are there now?`,
        correctAnswer: String(c),
        choices: choices(c, 1, c + 3),
        difficulty: 1,
        hint: `Start at ${a} and count on ${b} more.`,
        speakText: `There are ${a} birds in a tree. ${b} more fly in. How many birds are there now?`,
      };
    },
  },
  {
    make: (n) => {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 2;
      const c = a + b;
      return {
        id: `wp-add3-${a}+${b}`,
        type: 'word_problem',
        prompt: `${n} drew ${a} stars ⭐ on Monday and ${b} stars on Tuesday. How many stars altogether?`,
        correctAnswer: String(c),
        choices: choices(c, 1, c + 3),
        difficulty: 2,
        hint: `Add ${a} and ${b} together.`,
        speakText: `${n} drew ${a} stars on Monday and ${b} stars on Tuesday. How many stars altogether?`,
      };
    },
  },
];

const SUBTRACTION_TEMPLATES: Template[] = [
  {
    make: (n) => {
      const a = Math.floor(Math.random() * 5) + 4;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      const c = a - b;
      return {
        id: `wp-sub-${a}-${b}`,
        type: 'word_problem',
        prompt: `${n} had ${a} cookies 🍪. ${n} ate ${b} of them. How many cookies are left?`,
        correctAnswer: String(c),
        choices: choices(c, 0, a),
        difficulty: 2,
        hint: `Start at ${a} and count back ${b}.`,
        speakText: `${n} had ${a} cookies. ${n} ate ${b} of them. How many cookies are left?`,
      };
    },
  },
  {
    make: (n) => {
      const a = Math.floor(Math.random() * 5) + 5;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = a - b;
      return {
        id: `wp-sub2-${a}-${b}`,
        type: 'word_problem',
        prompt: `There are ${a} fish 🐟 in a pond. ${b} fish swim away. How many fish are left?`,
        correctAnswer: String(c),
        choices: choices(c, 0, a),
        difficulty: 2,
        hint: `${a} take away ${b}.`,
        speakText: `There are ${a} fish in a pond. ${b} fish swim away. How many fish are left?`,
      };
    },
  },
];

export function generateWordProblem(characterName: string, type: 'addition' | 'subtraction' | 'mixed'): Question {
  let templates = type === 'addition'
    ? ADDITION_TEMPLATES
    : type === 'subtraction'
    ? SUBTRACTION_TEMPLATES
    : [...ADDITION_TEMPLATES, ...SUBTRACTION_TEMPLATES];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.make(characterName);
}

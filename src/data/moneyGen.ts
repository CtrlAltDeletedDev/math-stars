import { Question } from '@/types';
import { buildChoices, randomInt, shuffle } from '@/engine/choices';

// Money, generated rather than hand-listed, so it can climb: name a coin →
// count coins of one kind → count a mixed handful → work out change.
// The existing 20 hand-written coin questions stay in the Measurement & Money
// category; these are what the practice ladder draws on.

interface Coin { name: string; plural: string; value: number; emoji: string }

const COINS: Coin[] = [
  { name: 'penny', plural: 'pennies', value: 1, emoji: '🟤' },
  { name: 'nickel', plural: 'nickels', value: 5, emoji: '⚪' },
  { name: 'dime', plural: 'dimes', value: 10, emoji: '⚫' },
  { name: 'quarter', plural: 'quarters', value: 25, emoji: '🔘' },
];

const cents = (n: number) => `${n}¢`;

function nameTheCoin(): Question {
  const coin = COINS[randomInt(0, COINS.length - 1)];
  return {
    id: `money-name-${coin.name}`,
    type: 'money',
    prompt: `A ${coin.name} is worth how many cents?`,
    correctAnswer: cents(coin.value),
    choices: shuffle(COINS.map((c) => cents(c.value))),
    difficulty: 1,
    hint: coin.value === 1 ? 'A penny is the smallest one.' : `A ${coin.name} is worth ${coin.value} pennies.`,
    speakText: `A ${coin.name} is worth how many cents?`,
    visual: { kind: 'coins', coins: [coin.value] },
  };
}

/** Several coins of one kind — skip counting with a reason to care. */
function countLikeCoins(): Question {
  const coin = COINS[randomInt(1, 3)]; // nickel, dime or quarter
  const n = randomInt(2, coin.value === 25 ? 4 : 6);
  const correct = coin.value * n;
  return {
    id: `money-like-${coin.name}-${n}`,
    type: 'money',
    prompt: `How much is ${n} ${coin.plural}?`,
    correctAnswer: cents(correct),
    choices: buildChoices(correct, [
      correct + coin.value,
      correct - coin.value,
      n + coin.value, // added instead of counting up
      correct + 1,
    ], { step: coin.value, isValid: (v) => v > 0 }).map((v) => `${v}¢`),
    difficulty: 2,
    hint: `Count by ${coin.value}s: ${Array.from({ length: Math.min(n, 4) }, (_, i) => coin.value * (i + 1)).join(', ')}...`,
    speakText: `How much is ${n} ${coin.plural}?`,
    visual: { kind: 'coins', coins: Array(n).fill(coin.value) },
  };
}

function countMixedCoins(): Question {
  const purse: number[] = [];
  const q = randomInt(0, 2), d = randomInt(0, 3), n = randomInt(0, 2), p = randomInt(0, 4);
  for (let i = 0; i < q; i++) purse.push(25);
  for (let i = 0; i < d; i++) purse.push(10);
  for (let i = 0; i < n; i++) purse.push(5);
  for (let i = 0; i < p; i++) purse.push(1);
  if (purse.length === 0) purse.push(10, 5);

  const correct = purse.reduce((a, b) => a + b, 0);
  return {
    id: `money-mixed-${purse.join('-')}`,
    type: 'money',
    prompt: 'How much money is this?',
    correctAnswer: cents(correct),
    choices: buildChoices(correct, [
      correct + 5,
      correct - 5,
      correct + 10,
      purse.length, // counted the coins instead of their value
      correct + 1,
    ], { step: 5, isValid: (v) => v > 0 }).map((v) => `${v}¢`),
    difficulty: 3,
    hint: 'Start with the biggest coins and count on.',
    speakText: 'How much money is this?',
    visual: { kind: 'coins', coins: [...purse].sort((a, b) => b - a) },
  };
}

function makeChange(maxTotal: number): Question {
  const have = maxTotal === 25 ? 25 : randomInt(5, 20) * 5;
  const spend = randomInt(1, have - 1);
  const correct = have - spend;
  return {
    id: `money-change-${have}-${spend}`,
    type: 'money',
    prompt: `You have ${cents(have)} and you spend ${cents(spend)}.\n\nHow much is left?`,
    correctAnswer: cents(correct),
    choices: buildChoices(correct, [
      have + spend, // added instead of subtracting
      spend,
      have,
      correct + 1,
      correct - 1,
    ], { step: 5, isValid: (v) => v >= 0 }).map((v) => `${v}¢`),
    difficulty: maxTotal > 25 ? 4 : 3,
    hint: `Count up from ${cents(spend)} to ${cents(have)}.`,
    speakText: `You have ${have} cents and you spend ${spend} cents. How much is left?`,
  };
}

export type MoneyMode = 'name' | 'like' | 'mixed' | 'change25' | 'change100';

export function generateMoneyQuestion(mode: MoneyMode): Question {
  switch (mode) {
    case 'name': return nameTheCoin();
    case 'like': return countLikeCoins();
    case 'mixed': return countMixedCoins();
    case 'change25': return makeChange(25);
    case 'change100': return makeChange(100);
  }
}

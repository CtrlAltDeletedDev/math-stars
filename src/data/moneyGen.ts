import { Question } from '@/types';
import { buildChoices, buildTaggedChoices, randomInt, shuffle } from '@/engine/choices';

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

function nameTheCoin(coin = COINS[randomInt(0, COINS.length - 1)]): Question {
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
function countLikeCoins(
  coin = COINS[randomInt(1, 3)], // nickel, dime or quarter
  n = randomInt(2, coin.value === 25 ? 4 : 6),
): Question {
  const correct = coin.value * n;
  return {
    id: `money-like-${coin.name}-${n}`,
    type: 'money',
    prompt: `How much is ${n} ${coin.plural}?`,
    correctAnswer: cents(correct),
    ...buildTaggedChoices(correct, [
      [correct + coin.value, 'wrong-multiple'], // one coin too many
      [correct - coin.value, 'wrong-multiple'], // one coin too few
      [n + coin.value, 'wrong-operation'], // added instead of counting up
      [correct + 1, 'off-by-one'],
    ], { step: coin.value, isValid: (v) => v > 0, format: cents }),
    difficulty: 2,
    hint: `Count by ${coin.value}s: ${Array.from({ length: Math.min(n, 4) }, (_, i) => coin.value * (i + 1)).join(', ')}...`,
    speakText: `How much is ${n} ${coin.plural}?`,
    visual: { kind: 'coins', coins: Array(n).fill(coin.value) },
  };
}

function randomPurse(): number[] {
  const purse: number[] = [];
  const q = randomInt(0, 2), d = randomInt(0, 3), n = randomInt(0, 2), p = randomInt(0, 4);
  for (let i = 0; i < q; i++) purse.push(25);
  for (let i = 0; i < d; i++) purse.push(10);
  for (let i = 0; i < n; i++) purse.push(5);
  for (let i = 0; i < p; i++) purse.push(1);
  if (purse.length === 0) purse.push(10, 5);
  return purse;
}

function countMixedCoins(purse = randomPurse()): Question {
  const correct = purse.reduce((a, b) => a + b, 0);
  return {
    id: `money-mixed-${purse.join('-')}`,
    type: 'money',
    prompt: 'How much money is this?',
    correctAnswer: cents(correct),
    ...buildTaggedChoices(correct, [
      [correct + 5, 'wrong-multiple'], // one coin out
      [correct - 5, 'wrong-multiple'],
      [correct + 10, 'wrong-multiple'],
      [purse.length, 'counted-the-wrong-thing'], // counted the coins instead of their value
      [correct + 1, 'off-by-one'],
    ], { step: 5, isValid: (v) => v > 0, format: cents }),
    difficulty: 3,
    hint: 'Start with the biggest coins and count on.',
    speakText: 'How much money is this?',
    visual: { kind: 'coins', coins: [...purse].sort((a, b) => b - a) },
  };
}

function makeChange(maxTotal: number): Question {
  const have = maxTotal === 25 ? 25 : randomInt(5, 20) * 5;
  return changeFrom(have, randomInt(1, have - 1), maxTotal);
}

function changeFrom(have: number, spend: number, maxTotal = have): Question {
  const correct = have - spend;
  return {
    id: `money-change-${have}-${spend}`,
    type: 'money',
    prompt: `You have ${cents(have)} and you spend ${cents(spend)}.\n\nHow much is left?`,
    correctAnswer: cents(correct),
    ...buildTaggedChoices(correct, [
      [have + spend, 'wrong-operation'], // added instead of subtracting
      [spend, 'answered-a-given-number'],
      [have, 'answered-the-whole'],
      [correct + 1, 'off-by-one'],
      [correct - 1, 'off-by-one'],
    ], { step: 5, isValid: (v) => v >= 0, format: cents }),
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

/**
 * Rebuild a money question from its SRS card id.
 *
 * Same story as fractions: `isServableCard` rejected every `money-*` card, so
 * `pruneSRSCards` deleted them all on the next save and money had no spaced
 * repetition at all.
 *
 * The one thing an id cannot carry is which rung asked for it, and `makeChange`
 * used that only to set `difficulty`. A rebuilt card infers it from the amount
 * instead, which is what the rung meant anyway.
 */
export function moneyFromId(id: string): Question | null {
  const byName = (name: string) => COINS.find((c) => c.name === name);

  let m = id.match(/^money-name-([a-z]+)$/);
  if (m) {
    const coin = byName(m[1]);
    return coin ? nameTheCoin(coin) : null;
  }
  m = id.match(/^money-like-([a-z]+)-(\d+)$/);
  if (m) {
    const coin = byName(m[1]);
    if (!coin || +m[2] < 1) return null;
    return countLikeCoins(coin, +m[2]);
  }
  m = id.match(/^money-mixed-(\d+(?:-\d+)*)$/);
  if (m) {
    const purse = m[1].split('-').map(Number);
    if (purse.some((v) => !COINS.some((c) => c.value === v))) return null;
    return countMixedCoins(purse);
  }
  m = id.match(/^money-change-(\d+)-(\d+)$/);
  if (m) {
    const have = +m[1], spend = +m[2];
    if (spend < 1 || spend >= have) return null;
    return changeFrom(have, spend, have > 25 ? 100 : 25);
  }
  return null;
}

import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { any, choiceItem, doStep, mix, modelItem, numberChoices, numberItem, randomInt, shuffle, show, sum, twoNames } from './helpers-world';

// Unit: Coins.
//
// The big idea a six-year-old has to unlearn is that more coins, or a bigger
// coin, means more money: the dime is the smallest coin and worth twice the
// nickel. So every count is done in cents, coins are counted biggest first by
// 10s, then 5s, then 1s, and the wrong answers are what children really say:
// every coin counted as 1, a nickel taken for a dime, a coin missed.

type Coins = Extract<ModelState, { model: 'coins' }>;

export const COIN: Record<number, { name: string; plural: string }> = {
  1: { name: 'penny', plural: 'pennies' },
  5: { name: 'nickel', plural: 'nickels' },
  10: { name: 'dime', plural: 'dimes' },
  25: { name: 'quarter', plural: 'quarters' },
};
const VALUES = [1, 5, 10, 25];

export const coins = (tray: number[], bank?: number[], showTotal?: boolean): Coins =>
  ({ model: 'coins', tray, ...(bank ? { bank } : {}), ...(showTotal ? { showTotal } : {}) });

export const cents = (n: number) => `${n}¢`;
const centsSaid = (n: number) => (n === 1 ? '1 cent' : `${n} cents`);
const many = (n: number, v: number): number[] => Array.from({ length: n }, () => v);

/** Biggest coins first, as they should count them. */
const sorted = (tray: number[]) => [...tray].sort((a, b) => b - a);

/** The fewest coins for an amount, from the coins given. */
export function fewest(amount: number, from = VALUES): number[] {
  const out: number[] = [];
  let left = amount;
  for (const v of [...from].sort((a, b) => b - a)) while (left >= v) { out.push(v); left -= v; }
  return out;
}

/** What to fix when making an amount. */
const fixAmount = (target: number) => (s: Coins) => {
  const have = sum(s.tray);
  if (have < target) return `You have ${centsSaid(have)}. Add coins until you have ${centsSaid(target)}.`;
  if (have > target) return `You have ${centsSaid(have)}. That is too much: tap a coin to take it back.`;
  return 'Check the coins you used.';
};

const makeStep = (target: number, bank: number[], say: string, then: string, rule?: { ok: (tray: number[]) => boolean; hint: string; using: number[] }) => doStep({
  say,
  caption: cents(target),
  model: coins([], bank, true),
  solution: coins(fewest(target, rule?.using ?? bank), bank, true),
  goal: (s) => sum(s.tray) === target && (!rule || rule.ok(s.tray)),
  hint: (s) => (sum(s.tray) === target && rule ? rule.hint : fixAmount(target)(s)),
  then,
});

// --- 1. Meet the coins ------------------------------------------------------------------

const nameChoice = (v: number): Choice => ({ value: COIN[v].name, label: COIN[v].name });
const worthChoice = (v: number): Choice => ({ value: cents(v), label: cents(v), say: centsSaid(v) });

function nameItem(): Item {
  const v = any(VALUES);
  return choiceItem({
    id: `coins-name-${v}`,
    say: 'What is this coin called?',
    prompt: 'Which coin?',
    answer: nameChoice(v),
    wrong: VALUES.filter((w) => w !== v).map(nameChoice),
    figure: coins([v]),
    hint: 'Look at its size and its colour. Is it brown or silver? Is it small or big?',
  });
}

function worthItem(): Item {
  const v = any(VALUES);
  return choiceItem({
    id: `coins-worth-${v}`,
    say: `How many cents is a ${COIN[v].name} worth?`,
    prompt: `A ${COIN[v].name} is worth?`,
    answer: worthChoice(v),
    wrong: VALUES.filter((w) => w !== v).map(worthChoice),
    figure: coins([v]),
    hint: 'Size does not tell you what a coin is worth. Say its name first, then think what that coin is worth.',
  });
}

const pickStep = (v: number, say: string, then: string) => doStep({
  say,
  caption: `${COIN[v].name}: ${cents(v)}`,
  model: coins([], VALUES),
  solution: coins([v], VALUES),
  goal: (s) => s.tray.length === 1 && s.tray[0] === v,
  hint: (s) => (s.tray.length > 0 && s.tray[0] !== v
    ? `That one is a ${COIN[s.tray[0]]?.name ?? 'coin'}. Tap it to take it back, and find the ${COIN[v].name}.`
    : s.tray.length > 1 ? 'Just one coin. Tap one to take it back.' : `Find the ${COIN[v].name}: ${centsSaid(v)}.`),
  then,
});

const meetCoins: Lesson = {
  id: 'money-meet-the-coins',
  title: 'Meet the coins',
  goal: 'Name the penny, nickel, dime and quarter, and say what each is worth.',
  standard: '2.MD.8',
  emoji: '🪙',
  teach: [
    show('This is a penny. A penny is worth 1 cent.', 'penny: 1¢', coins([1])),
    show('This is a nickel. A nickel is worth 5 cents, the same as 5 pennies.', 'nickel: 5¢', coins([5])),
    show('This is a dime. The dime is the smallest coin, but it is worth 10 cents!', 'dime: 10¢', coins([10])),
    show('This is a quarter, the biggest. A quarter is worth 25 cents.', 'quarter: 25¢', coins([25])),
    show('A bigger coin is not always worth more. Look at the cents, not the size.', '1¢ 5¢ 10¢ 25¢', coins([1, 5, 10, 25])),
    pickStep(10, 'Tap the dime to put it down.', 'The dime: small, silver, and worth 10 cents.'),
    pickStep(5, 'Now put down the coin worth 5 cents.', 'The nickel is worth 5 cents. It is bigger than the dime, but worth less.'),
    pickStep(25, 'Put down the quarter.', 'The quarter is worth 25 cents, the most of all four.'),
  ],
  practice: mix([1, nameItem], [1, worthItem]),
};

// --- 2. Counting pennies -------------------------------------------------------------------

const penniesItem = (): Item => {
  const n = randomInt(3, 20);
  return numberItem({
    id: `coins-pennies-${n}`,
    say: 'How many cents are these pennies worth?',
    prompt: 'How many cents?',
    answer: n,
    figure: coins(many(n, 1)),
    hint: 'Each penny is 1 cent. Touch each one as you count.',
  });
};

const pennies: Lesson = {
  id: 'money-pennies',
  title: 'Counting pennies',
  goal: 'Count pennies to 20 as cents, and make an amount with pennies.',
  standard: '2.MD.8',
  emoji: '🟤',
  teach: [
    show('Each penny is worth 1 cent.', '1¢', coins([1])),
    show('Count pennies by ones: 1, 2, 3, 4, 5, 6. 6 cents.', '6 pennies', coins(many(6, 1))),
    show('We write 6 cents as 6 and a little c with a line through it.', '6¢', coins(many(6, 1), undefined, true)),
    show('5 pennies are worth the same as 1 nickel. Both are 5 cents.', '5 pennies = 5¢', coins(many(5, 1), undefined, true)),
    makeStep(7, [1], 'Make 7 cents with pennies.', '1, 2, 3, 4, 5, 6, 7. 7 pennies make 7 cents.'),
    makeStep(12, [1], 'Now make 12 cents.', '12 pennies make 12 cents.'),
  ],
  practice: penniesItem,
};

// --- 3. Counting by 5s and 10s -----------------------------------------------------------------

/** All dimes or all nickels: the answer, and counting each coin as 1 cent. */
function likeCoins(asChoices: boolean) {
  return (): Item => {
    const v = Math.random() < 0.5 ? 10 : 5;
    const n = v === 10 ? randomInt(2, 9) : randomInt(2, 10);
    const total = n * v;
    const base = {
      id: `coins-like-${v}-${n}`,
      say: `How many cents are these ${COIN[v].plural} worth?`,
      prompt: 'How many cents?',
      figure: coins(many(n, v)),
      hint: v === 10 ? 'Each dime is 10 cents. Count by tens.' : 'Each nickel is 5 cents. Count by fives.',
    };
    if (!asChoices) return numberItem({ ...base, id: `${base.id}-typed`, answer: total });
    // Each coin counted as 1 cent; one coin too many or too few; nickels counted as dimes.
    const mistakes = [n, total + v, total - v, ...(v === 5 ? [n * 10] : [])];
    return choiceItem({ ...base, ...numberChoices(total, mistakes, { format: cents, say: centsSaid, step: v, prefer: [n] }) });
  };
}

const fivesAndTens: Lesson = {
  id: 'money-nickels-and-dimes',
  title: 'Count by 5s and 10s',
  goal: 'Count dimes by tens and nickels by fives.',
  standard: '2.MD.8',
  emoji: '🔟',
  teach: [
    show('Dimes are 10 cents each. Count by tens: 10, 20, 30, 40.', '10, 20, 30, 40', coins(many(4, 10))),
    show('Not 4 cents! There are 4 dimes, but each one is worth 10.', '4 dimes = 40¢', coins(many(4, 10), undefined, true)),
    show('Nickels are 5 cents each. Count by fives: 5, 10, 15, 20, 25.', '5, 10, 15, 20, 25', coins(many(5, 5))),
    show('5 nickels are 25 cents.', '5 nickels = 25¢', coins(many(5, 5), undefined, true)),
    makeStep(50, [10], 'Make 50 cents with dimes. Count by tens as you go.', '10, 20, 30, 40, 50. 5 dimes make 50 cents.'),
    makeStep(30, [5], 'Make 30 cents with nickels. Count by fives.', '5, 10, 15, 20, 25, 30. 6 nickels make 30 cents.'),
  ],
  practice: likeCoins(true),
  check: likeCoins(false),
};

// --- 4. Counting mixed coins ---------------------------------------------------------------------

/** Dimes, nickels and pennies: at least two kinds, and at least four coins. */
function mixedTray(): number[] {
  for (;;) {
    const d = randomInt(1, 4), k = randomInt(0, 2), p = randomInt(0, 4);
    if ((k > 0 ? 1 : 0) + (p > 0 ? 1 : 0) === 0 || d + k + p < 4) continue;
    return [...many(d, 10), ...many(k, 5), ...many(p, 1)];
  }
}

function mixedItem(asChoices: boolean) {
  return (): Item => {
    const tray = mixedTray();
    const total = sum(tray);
    const nick = tray.filter((v) => v === 5).length;
    const dimes = tray.filter((v) => v === 10).length;
    const base = {
      id: `coins-mixed-${sorted(tray).join('-')}`,
      say: 'How many cents are these coins worth?',
      prompt: 'How many cents?',
      // Jumbled in the check, as coins are in a pocket.
      figure: coins(asChoices ? sorted(tray) : shuffle(tray)),
      hint: 'Start with the dimes and count by tens. Then the nickels by fives, then the pennies by ones.',
    };
    if (!asChoices) return numberItem({ ...base, id: `${base.id}-typed`, answer: total });
    const mistakes = [
      tray.length, // every coin counted as 1 cent
      total - Math.min(...tray), // a coin missed
      ...(nick > 0 ? [total + nick * 5] : []), // nickels taken for dimes
      total - dimes * 5, // dimes taken for nickels: the bigger coin must be worth more
    ];
    return choiceItem({ ...base, ...numberChoices(total, mistakes, { format: cents, say: centsSaid, prefer: [tray.length] }) });
  };
}

const mixedCoins: Lesson = {
  id: 'money-mixed-coins',
  title: 'Dimes, then nickels, then pennies',
  goal: 'Count a mix of dimes, nickels and pennies, biggest first, counting on.',
  standard: '2.MD.8',
  emoji: '👛',
  teach: [
    show('Here are some coins. Start with the coins worth the most: the dimes. 10, 20.', '10, 20', coins([10, 10, 5, 1, 1])),
    show('Then the nickel. Count on 5: 25.', '… 25', coins([10, 10, 5, 1, 1])),
    show('Then the pennies, by ones: 26, 27.', '… 26, 27', coins([10, 10, 5, 1, 1])),
    show('27 cents! Count every coin as 1 and you would only get 5. Count the cents.', '27¢', coins([10, 10, 5, 1, 1], undefined, true)),
    makeStep(27, [10, 5, 1], 'Make 27 cents. Put down dimes first, then a nickel, then pennies.', '10, 20, 25, 26, 27. Dimes, a nickel and pennies make 27 cents.'),
    makeStep(16, [10, 5, 1], 'Now make 16 cents.', '10, 15, 16. A dime, a nickel and a penny make 16 cents.'),
  ],
  practice: mixedItem(true),
  check: mixedItem(false),
};

// --- 5. Making an amount --------------------------------------------------------------------------

function makeItem(): Item {
  const n = randomInt(11, 60);
  const bank = [25, 10, 5, 1];
  return modelItem({
    id: `coins-make-${n}`,
    say: `Make ${centsSaid(n)} with coins.`,
    prompt: `Make ${cents(n)}`,
    answer: cents(n),
    model: coins([], bank, true),
    solution: coins(fewest(n, bank), bank, true),
    goal: (s) => sum(s.tray) === n,
    hint: 'Start with the biggest coin that fits, then count on.',
  });
}

const purse = (tray: number[]): Choice => ({ value: sorted(tray).join('+'), label: '', say: tray.map((v) => COIN[v].name).join(', '), model: coins(sorted(tray)) });

function sameAsQuarter(): Item {
  return choiceItem({
    id: 'coins-same-as-quarter',
    say: 'Which coins are worth the same as a quarter?',
    prompt: 'Same as 25¢?',
    answer: purse([10, 10, 5]),
    wrong: shuffle([[10, 10], [10, 10, 10], [5, 5, 5, 5], [10, 5, 5, 1]].map(purse)),
    figure: coins([25]),
    hint: 'Count each set: tens first, then fives, then ones. Find the one that makes 25.',
  });
}

const makeAmount: Lesson = {
  id: 'money-make-an-amount',
  title: 'Make an amount',
  goal: 'Make an amount with coins, and see that different coins can make the same amount.',
  standard: '2.MD.8',
  emoji: '🛍️',
  teach: [
    show('A quarter is worth 25 cents.', '25¢', coins([25], undefined, true)),
    show('2 dimes and a nickel are worth 25 cents too: 10, 20, 25.', '10, 20, 25', coins([10, 10, 5], undefined, true)),
    show('So are 5 nickels: 5, 10, 15, 20, 25. Different coins, the same money.', '25¢ = 25¢', coins(many(5, 5), undefined, true)),
    makeStep(30, [25, 10, 5, 1], 'Make 30 cents. Any coins you like.', '30 cents! A quarter and a nickel is one way: 25, 30.'),
    makeStep(30, [25, 10, 5, 1], 'Make 30 cents again, with no quarter this time.', '30 cents with no quarter: 3 dimes is one way.',
      { ok: (tray) => !tray.includes(25), hint: 'That makes 30, but this time leave the quarter out. Tap it to take it back.', using: [10, 5, 1] }),
    makeStep(25, [10, 5], 'Make 25 cents with just dimes and nickels.', 'Dimes and nickels can make the same as a quarter.'),
  ],
  practice: makeItem,
  check: mix([3, makeItem], [1, sameAsQuarter]),
};

// --- 6. Which is more money? ------------------------------------------------------------------------

/** Two purses with different totals; often the one with more coins has less money. */
function compareItem(): Item {
  let a = randomInt(10, 40), b = randomInt(5, 30);
  while (a === b) b = randomInt(5, 30);
  const [n1, n2] = twoNames(a * 3 + b);
  const big = fewest(a); // few big coins
  const small = [...many(Math.floor(b / 5), 5), ...many(b % 5, 1)]; // many small coins
  const answer = a > b ? n1 : n2;
  const c = (name: string, tray: number[]): Choice => ({ value: name, label: name, model: coins(sorted(tray)) });
  return choiceItem({
    id: `coins-compare-${a}-${b}`,
    say: `Who has more money, ${n1} or ${n2}?`,
    prompt: 'Who has more money?',
    answer: answer === n1 ? c(n1, big) : c(n2, small),
    wrong: [answer === n1 ? c(n2, small) : c(n1, big)],
    hint: 'Count the cents in each, not the coins.',
  });
}

const compareMoney: Lesson = {
  id: 'money-which-is-more',
  title: 'Which is more money?',
  goal: 'Compare two amounts of money by counting cents, not coins.',
  standard: '2.MD.8',
  emoji: '⚖️',
  teach: [
    show('Leo has 6 pennies.', 'Leo: 6¢', coins(many(6, 1), undefined, true)),
    show('Mia has 1 dime.', 'Mia: 10¢', coins([10], undefined, true)),
    show('Leo has more coins, but Mia has more money. 10 cents is more than 6 cents.', '10¢ > 6¢', coins([10], undefined, true)),
    show('To find who has more money, count the cents, not the coins.', 'count the cents', coins([10], undefined, true)),
    makeStep(20, [5], 'Omar has 2 dimes. Give Ruby the same money, using nickels.', '5, 10, 15, 20. 4 nickels are the same money as 2 dimes.'),
    doStep({
      say: 'Kenna has 2 dimes. Put down just one coin that is worth more than Kenna\'s 2 dimes.',
      caption: 'more than 20¢',
      model: coins([], VALUES, true),
      solution: coins([25], VALUES, true),
      goal: (s) => s.tray.length === 1 && s.tray[0] > 20,
      hint: (s) => (s.tray.length > 1 ? 'Just one coin. Tap the others to take them back.' : 'Kenna has 20 cents. Which coin is worth more than 20 cents?'),
      then: 'The quarter! 25 cents is more than 20 cents.',
    }),
  ],
  practice: compareItem,
};

export const UNIT: Unit = {
  id: 'money',
  title: 'Coins',
  emoji: '🪙',
  about: 'Pennies, nickels, dimes and quarters: what each is worth, counting them by 1s, 5s and 10s, making amounts, and comparing.',
  colour: '#B08D57',
  lessons: [meetCoins, pennies, fivesAndTens, mixedCoins, makeAmount, compareMoney],
};


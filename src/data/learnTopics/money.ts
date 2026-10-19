import type { Lesson } from '../learn';

// Money lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The order the money ladder climbs (moneyGen.ts), which is the order first and
// second grade meet it in: what each coin is called and what it is worth, and
// that the dime is the smallest coin but worth more than a penny or a nickel;
// then a handful of one kind of coin, skip counted by 5s, 10s or 25s; then a
// mixed handful, counted from the coin worth the most; then what is left after
// spending, found by counting up from what you spend to what you had, by 1s from
// 25 cents and in jumps to the next ten from a dollar.
//
// Every "try" asks a question play asks, in the same words ("How much is 4
// nickels?", "You have 25¢ and you spend 21¢"), and every wrong button is an
// answer play offers to that question (learn-money.test.ts checks both): one
// coin too many or too few, the number of coins instead of the cents, the two
// numbers added, the money spent or the money you had given back as what is
// left, and a hop counted from the number you start on.
//
// Money has a single level, the coin-naming bank at rung 0, so "Practice it
// now" goes there from every lesson.

const NAME_THE_COINS: Lesson = {
  id: 'name-the-coins',
  title: 'Penny, Nickel, Dime, Quarter',
  emoji: '🪙',
  places: [{ skillId: 'money', rung: 0 }],
  practiceLevelId: 'measure-coins',
  // Naming coins carries no tags in play: every wrong answer is just another
  // coin's value. So no helpsWith; a demotion still finds this lesson by rung.
  steps: [
    {
      kind: 'watch',
      say: 'These are coins. We use coins to buy things. Each coin has a name, and each coin is worth some cents.',
      caption: 'Penny, nickel, dime, quarter',
      scene: { kind: 'coins', coins: [1, 5, 10, 25], names: true },
    },
    {
      kind: 'watch',
      say: 'This is a penny. A penny is worth 1 cent. This is a nickel. A nickel is worth 5 cents. 5 pennies make the same as 1 nickel.',
      caption: 'Penny 1¢, nickel 5¢',
      scene: { kind: 'coins', coins: [1, 5], names: true },
    },
    {
      kind: 'watch',
      say: 'This is a dime. Look, a dime is smaller than a nickel. But a dime is worth more! A dime is worth 10 cents.',
      caption: 'Dime 10¢: small, but worth more',
      scene: { kind: 'coins', coins: [5, 10], names: true },
    },
    {
      kind: 'watch',
      say: 'This is a quarter. A quarter is the biggest coin. A quarter is worth 25 cents. That is the most of all!',
      caption: 'Quarter 25¢',
      scene: { kind: 'coins', coins: [25], names: true },
    },
    {
      kind: 'try',
      say: 'Your turn! A dime is worth how many cents?',
      caption: '1 dime = ?',
      scene: { kind: 'big', text: '1 dime = ?' },
      choices: ['10¢', '5¢', '1¢', '25¢'],
      answer: '10¢',
      hints: {
        '5¢': 'A nickel is worth 5 cents. The dime is smaller than a nickel, but it is worth more!',
        '1¢': 'A penny is worth 1 cent. The dime is even smaller than a penny, but it is worth more!',
        '25¢': 'A quarter is worth 25 cents. The quarter is the biggest coin. The dime is the smallest.',
      },
      then: {
        say: 'Yes! A dime is worth 10 cents. It is the smallest coin, but it is worth more than a penny or a nickel.',
        caption: '1 dime = 10¢',
        scene: { kind: 'coins', coins: [10], names: true },
      },
    },
    {
      kind: 'try',
      say: 'A quarter is worth how many cents?',
      caption: '1 quarter = ?',
      scene: { kind: 'big', text: '1 quarter = ?' },
      choices: ['25¢', '10¢', '5¢', '1¢'],
      answer: '25¢',
      hints: {
        '10¢': 'A dime is worth 10 cents. A quarter is much bigger, and it is worth more than a dime.',
        '5¢': 'A nickel is worth 5 cents. A quarter is bigger, and it is worth more than a nickel.',
        '1¢': 'A penny is worth 1 cent. A quarter is worth the most of all the coins.',
      },
      then: {
        say: 'Yes! A quarter is worth 25 cents. That is the same as 25 pennies!',
        caption: '1 quarter = 25¢',
        scene: { kind: 'coins', coins: [25], names: true },
      },
    },
    {
      kind: 'try',
      say: 'Which coin is worth more, the nickel or the dime?',
      caption: 'Which is worth more?',
      scene: { kind: 'coins', coins: [5, 10], names: true },
      choices: ['Dime', 'Nickel'],
      answer: 'Dime',
      hints: {
        Nickel: 'The nickel is bigger. But bigger does not mean worth more! A nickel is worth 5 cents, and a dime is worth 10.',
      },
      then: {
        say: 'Yes! A dime is worth 10 cents. It takes 2 nickels to make a dime. 5, 10.',
        caption: '2 nickels = 1 dime = 10¢',
        scene: { kind: 'coins', coins: [5, 5], counting: true, names: true },
      },
    },
  ],
};

const SKIP_COUNT_COINS: Lesson = {
  id: 'skip-count-coins',
  title: 'Skip Count Coins',
  emoji: '💰',
  places: [{ skillId: 'money', rung: 1 }],
  practiceLevelId: 'measure-coins',
  // "Did you miss a nickel?", "one nickel too many" and "that is just 1
  // quarter" are written for counting one coin too many or too few
  // ('wrong-multiple'); "that is 4 and 5 put together" for adding the number of
  // coins to what one is worth ('wrong-operation'); and "did you count 1 more at
  // the end?" for landing one cent off ('off-by-one').
  helpsWith: ['wrong-multiple', 'wrong-operation', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'Here are 4 dimes. Each dime is worth 10 cents, so count dimes by 10s. Touch each dime as you count. 10, 20, 30, 40. 4 dimes make 40 cents!',
      caption: '10, 20, 30, 40 → 40¢',
      scene: { kind: 'coins', coins: [10, 10, 10, 10], counting: true, names: true },
    },
    {
      kind: 'watch',
      say: 'Each nickel is worth 5 cents, so count nickels by 5s. 5, 10, 15. 3 nickels make 15 cents.',
      caption: '5, 10, 15 → 15¢',
      scene: { kind: 'coins', coins: [5, 5, 5], counting: true, names: true },
    },
    {
      kind: 'watch',
      say: 'Each quarter is worth 25 cents, so count quarters by 25s. 25, 50, 75. 3 quarters make 75 cents.',
      caption: '25, 50, 75 → 75¢',
      scene: { kind: 'coins', coins: [25, 25, 25], counting: true, names: true },
    },
    {
      kind: 'try',
      say: 'Your turn! How much is 4 nickels? Touch each nickel and count by 5s.',
      caption: 'How much is 4 nickels?',
      scene: { kind: 'coins', coins: [5, 5, 5, 5], names: true },
      choices: ['20¢', '15¢', '25¢', '9¢'],
      answer: '20¢',
      hints: {
        '15¢': 'Did you miss a nickel? Touch each one as you count. There are 4 nickels.',
        '25¢': 'That is one nickel too many. Say one number for each nickel, and stop at the last one.',
        '9¢': 'That is 4 and 5 put together. But every nickel is worth 5 cents. Count by 5s, one number for each nickel.',
      },
      then: {
        say: 'Yes! 5, 10, 15, 20. 4 nickels make 20 cents.',
        caption: '4 nickels = 20¢',
        scene: { kind: 'coins', coins: [5, 5, 5, 5], counting: true, names: true },
      },
    },
    {
      kind: 'try',
      say: 'How much is 6 dimes? Count by 10s.',
      caption: 'How much is 6 dimes?',
      scene: { kind: 'coins', coins: [10, 10, 10, 10, 10, 10], names: true },
      choices: ['60¢', '50¢', '16¢', '61¢'],
      answer: '60¢',
      hints: {
        '50¢': 'Did you miss a dime? Touch each one as you count. There are 6 dimes.',
        '16¢': 'That is 6 and 10 put together. But every dime is worth 10 cents. Count by 10s, one number for each dime.',
        '61¢': 'Did you count 1 more at the end? Counting by 10s, every number ends in 0.',
      },
      then: {
        say: 'Yes! 10, 20, 30, 40, 50, 60. 6 dimes make 60 cents.',
        caption: '6 dimes = 60¢',
        scene: { kind: 'coins', coins: [10, 10, 10, 10, 10, 10], counting: true, names: true },
      },
    },
    {
      kind: 'try',
      say: 'How much is 2 quarters? Count by 25s.',
      caption: 'How much is 2 quarters?',
      scene: { kind: 'coins', coins: [25, 25], names: true },
      choices: ['50¢', '25¢', '27¢', '75¢'],
      answer: '50¢',
      hints: {
        '25¢': 'That is just 1 quarter. There are 2 quarters. Count 25, then 25 more.',
        '27¢': 'That is 2 and 25 put together. But every quarter is worth 25 cents. Count by 25s, one number for each quarter.',
        '75¢': 'That is one quarter too many. There are just 2 quarters.',
      },
      then: {
        say: 'Yes! 25, 50. 2 quarters make 50 cents. That is half a dollar!',
        caption: '2 quarters = 50¢',
        scene: { kind: 'coins', coins: [25, 25], counting: true, names: true },
      },
    },
  ],
};

const BIGGEST_COIN_FIRST: Lesson = {
  id: 'biggest-coin-first',
  title: 'Biggest Coin First',
  emoji: '🐷',
  places: [{ skillId: 'money', rung: 2 }],
  practiceLevelId: 'measure-coins',
  // "5 is how many coins there are" is written for counting the coins instead
  // of the cents ('counted-the-wrong-thing'); "did you count the nickel as 10?"
  // and "did you count a dime as 5?" for one coin counted as the wrong coin, 5
  // cents out ('wrong-multiple'); and "did you count a penny twice?" for
  // landing one cent off ('off-by-one').
  helpsWith: ['counted-the-wrong-thing', 'wrong-multiple', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'How much money is this? There are 4 coins. But that does not make 4 cents! Each coin is worth a different number of cents.',
      caption: '4 coins. How much?',
      scene: { kind: 'coins', coins: [1, 10, 25, 5], names: true },
    },
    {
      kind: 'watch',
      say: 'First, put the coins in order. The coin worth the most goes first. Quarter, dime, nickel, penny.',
      caption: 'Biggest first',
      scene: { kind: 'coins', coins: [25, 10, 5, 1], names: true },
    },
    {
      kind: 'watch',
      say: 'Start with the quarter. 25. Then count on. The dime makes 35. The nickel makes 40. The penny makes 41. It is 41 cents!',
      caption: '25, 35, 40, 41 → 41¢',
      scene: { kind: 'coins', coins: [25, 10, 5, 1], counting: true, names: true },
    },
    {
      kind: 'try',
      say: 'Your turn! How much money is this? Start with the coins worth the most, and count on.',
      caption: 'How much money is this?',
      scene: { kind: 'coins', coins: [10, 10, 5, 1, 1], names: true },
      choices: ['27¢', '5¢', '32¢', '28¢'],
      answer: '27¢',
      hints: {
        '5¢': '5 is how many coins there are. Count what the coins are worth. The dimes are 10, 20. Then count on.',
        '32¢': 'Did you count the nickel as 10? A nickel is worth just 5. 10, 20, then 5 more.',
        '28¢': 'Did you count a penny twice? There are 2 pennies. Each one is just 1 more.',
      },
      then: {
        say: 'Yes! 10, 20, 25, 26, 27. It is 27 cents.',
        caption: '10, 20, 25, 26, 27 → 27¢',
        scene: { kind: 'coins', coins: [10, 10, 5, 1, 1], counting: true, names: true },
      },
    },
    {
      kind: 'try',
      say: 'These coins are all mixed up. How much money is this? Find the coin worth the most, and start with it.',
      caption: 'How much money is this?',
      scene: { kind: 'coins', coins: [1, 10, 25, 10], names: true },
      choices: ['46¢', '4¢', '41¢', '47¢'],
      answer: '46¢',
      hints: {
        '4¢': '4 is how many coins there are. Count what the coins are worth. Start with the quarter, 25.',
        '41¢': 'Did you count a dime as 5? The dimes are small, but each dime is worth 10.',
        '47¢': 'Did you count the penny twice? There is just 1 penny. It is 1 more, at the very end.',
      },
      then: {
        say: 'Yes! Start with the quarter, 25. Then the dimes, 35, 45. Then the penny, 46. It is 46 cents.',
        caption: '25, 35, 45, 46 → 46¢',
        scene: { kind: 'coins', coins: [25, 10, 10, 1], counting: true, names: true },
      },
    },
  ],
};

const COUNT_UP_FROM_WHAT_YOU_SPEND: Lesson = {
  id: 'change-from-25',
  title: 'How Much Is Left?',
  emoji: '🍭',
  places: [{ skillId: 'money', rung: 3 }],
  practiceLevelId: 'measure-coins',
  // "21 cents is what you spend" is written for giving back the money spent
  // ('answered-a-given-number'); "25 cents is all the money you had" for giving
  // back the whole ('answered-the-whole'); "that is 25 and 21 put together" for
  // adding ('wrong-operation'); and "did you count 21 as a hop?" for landing
  // one cent off ('off-by-one').
  helpsWith: ['answered-a-given-number', 'answered-the-whole', 'wrong-operation', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'You have 25 cents. You spend 18 cents on a lollipop. How much money is left? What is left is a part of the 25 cents. So it is less than 25.',
      caption: 'Have 25¢. Spend 18¢.',
      scene: { kind: 'partWhole', whole: 25, parts: [18, null], labels: ['you have', 'you spend', 'left'] },
    },
    {
      kind: 'watch',
      say: 'Count up from what you spend to what you have. Start on 18. You are standing on 18, so 18 is not a hop.',
      caption: 'Start on 18',
      scene: { kind: 'numberLine', max: 25, start: 18 },
    },
    {
      kind: 'watch',
      say: 'Now hop up to 25. 19, 20, 21, 22, 23, 24, 25. That is 7 hops. So 7 cents is left!',
      caption: '18 up to 25: 7 hops',
      scene: { kind: 'numberLine', max: 25, start: 18, hops: 7, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'Check it. 18 cents and 7 cents make 25 cents.',
      caption: '18¢ + 7¢ = 25¢',
      scene: { kind: 'partWhole', whole: 25, parts: [18, 7], labels: ['you have', 'you spend', 'left'] },
    },
    {
      kind: 'try',
      say: 'Your turn! You have 25 cents. You spend 21 cents. How much is left? Start on 21, and count the hops up to 25.',
      caption: 'Have 25¢. Spend 21¢. Left?',
      // Not the tap-to-hop line: from 0 to 25 its numbers are too small to tap
      // on a phone. This one zooms in on 21 to 25.
      scene: { kind: 'numberLine', max: 25, start: 21 },
      choices: ['4¢', '21¢', '46¢', '5¢'],
      answer: '4¢',
      hints: {
        '21¢': '21 cents is what you spend. That money is gone! How much is left over?',
        '46¢': 'That is 25 and 21 put together. You spent some money, so less than 25 cents is left.',
        '5¢': 'Did you count 21 as a hop? You start on 21. Your first hop lands on 22.',
      },
      then: {
        say: 'Yes! Count up from 21. 22, 23, 24, 25. That is 4 hops. So 4 cents is left.',
        caption: '21¢ + 4¢ = 25¢',
        scene: { kind: 'numberLine', max: 25, start: 21, hops: 4, dir: 1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'You have 25 cents. You spend 15 cents. How much is left? You can count up from 15 by 5s.',
      caption: 'Have 25¢. Spend 15¢. Left?',
      scene: { kind: 'partWhole', whole: 25, parts: [15, null], labels: ['you have', 'you spend', 'left'] },
      choices: ['10¢', '15¢', '25¢', '40¢'],
      answer: '10¢',
      hints: {
        '15¢': '15 cents is what you spend. That money is gone! How much is left over?',
        '25¢': '25 cents is all the money you had. You spent some, so less is left.',
        '40¢': 'That is 25 and 15 put together. Spending makes your money less, not more.',
      },
      then: {
        say: 'Yes! Count up from 15 by 5s. 20, 25. That is 5 and 5 more. So 10 cents is left.',
        caption: '15¢ + 10¢ = 25¢',
        scene: { kind: 'partWhole', whole: 25, parts: [15, 10], labels: ['you have', 'you spend', 'left'] },
      },
    },
  ],
};

const JUMP_TO_A_TEN: Lesson = {
  id: 'change-from-a-dollar',
  title: 'Jump to the Next Ten',
  emoji: '💵',
  places: [{ skillId: 'money', rung: 4 }],
  practiceLevelId: 'measure-coins',
  // "27 cents is what you spend" is written for giving back the money spent
  // ('answered-a-given-number'); "100 cents is all the money you had" for
  // giving back the whole ('answered-the-whole'); "that is 40 and 27 put
  // together" for adding ('wrong-operation'); "did you count 27 as a hop?" for
  // landing one cent off ('off-by-one'); and "did you forget the first hop?"
  // for leaving out the hop up to the next ten, 5 cents short, which play tags
  // 'wrong-multiple'.
  helpsWith: ['answered-a-given-number', 'answered-the-whole', 'wrong-operation', 'off-by-one', 'wrong-multiple'],
  steps: [
    {
      kind: 'watch',
      say: 'You have 50 cents. You spend 34 cents. How much is left? Counting up by 1s would take a long time. Let\'s take big jumps!',
      caption: 'Have 50¢. Spend 34¢.',
      scene: { kind: 'partWhole', whole: 50, parts: [34, null], labels: ['you have', 'you spend', 'left'] },
    },
    {
      kind: 'watch',
      say: 'Start on 34. Hop by 1s up to the next ten. 35, 36, 37, 38, 39, 40. That is 6.',
      caption: '34 up to 40: 6',
      scene: { kind: 'numberLine', max: 50, start: 34, hops: 6, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'Now you are on 40. Jump a whole ten, up to 50. That is 10 more.',
      caption: '40 up to 50: 10',
      scene: { kind: 'numberLine', max: 50, start: 40, hops: 1, dir: 1, step: 10, animate: true },
    },
    {
      kind: 'watch',
      say: 'Put the jumps together. 6 and 10 make 16. So 16 cents is left!',
      caption: '34¢ + 16¢ = 50¢',
      scene: { kind: 'partWhole', whole: 50, parts: [34, 16], labels: ['you have', 'you spend', 'left'] },
    },
    {
      kind: 'try',
      say: 'Your turn! You have 40 cents. You spend 27 cents. How much is left? Hop up to the next ten first.',
      caption: 'Have 40¢. Spend 27¢. Left?',
      scene: { kind: 'partWhole', whole: 40, parts: [27, null], labels: ['you have', 'you spend', 'left'] },
      choices: ['13¢', '27¢', '67¢', '14¢'],
      answer: '13¢',
      hints: {
        '27¢': '27 cents is what you spend. That money is gone! How much is left over?',
        '67¢': 'That is 40 and 27 put together. Spending makes your money less, not more.',
        '14¢': 'Did you count 27 as a hop? Start on 27. Your hops to the next ten are 28, 29, 30. That is 3.',
      },
      then: {
        say: 'Yes! From 27, hop up to 30. That is 3. Then jump a ten, up to 40. That is 10. 3 and 10 make 13. So 13 cents is left.',
        caption: '27¢ + 13¢ = 40¢',
        scene: { kind: 'partWhole', whole: 40, parts: [27, 13], labels: ['you have', 'you spend', 'left'] },
      },
    },
    {
      kind: 'try',
      say: 'You have 100 cents. That is 1 dollar! You spend 65 cents. How much is left?',
      caption: 'Have 100¢. Spend 65¢. Left?',
      scene: { kind: 'partWhole', whole: 100, parts: [65, null], labels: ['you have', 'you spend', 'left'] },
      choices: ['35¢', '65¢', '100¢', '30¢'],
      answer: '35¢',
      hints: {
        '65¢': '65 cents is what you spend. That money is gone! How much is left over?',
        '100¢': '100 cents is all the money you had. You spent some, so less is left.',
        '30¢': 'Did you forget the first hop? From 65 up to 70 is 5 more. Then the tens make 30.',
      },
      then: {
        say: 'Yes! From 65, hop up to 70. That is 5. Then jump by tens. 80, 90, 100. That is 30. 5 and 30 make 35. So 35 cents is left.',
        caption: '65¢ + 35¢ = 100¢',
        scene: { kind: 'partWhole', whole: 100, parts: [65, 35], labels: ['you have', 'you spend', 'left'] },
      },
    },
  ],
};

export const MONEY_LESSONS: Lesson[] = [
  NAME_THE_COINS,
  SKIP_COUNT_COINS,
  BIGGEST_COIN_FIRST,
  COUNT_UP_FROM_WHAT_YOU_SPEND,
  JUMP_TO_A_TEN,
];

export interface LessonSlide {
  title: string;
  body: string;
  emoji: string;
  example?: string;
  tip?: string;
}

export const LESSONS: Record<string, LessonSlide[]> = {

  // ── Place Value ──────────────────────────────────────────────────────────

  'pv-ones-tens': [
    {
      title: 'Two-Digit Numbers',
      body: 'Every number from 10 to 99 has TWO parts: a TENS digit and a ONES digit!',
      emoji: '🔢',
      example: '3 4\n↑  ↑\ntens  ones',
    },
    {
      title: 'The Tens Place',
      body: 'The FIRST digit (on the left) is the TENS. It tells you how many groups of 10!',
      emoji: '🔟',
      example: 'In 47 → the 4 means 4 tens = 40',
      tip: 'Tip: Tens is always the LEFT digit!',
    },
    {
      title: 'The Ones Place',
      body: 'The SECOND digit (on the right) is the ONES. It tells you how many single units!',
      emoji: '1️⃣',
      example: 'In 47 → the 7 means 7 ones = 7',
      tip: 'Tip: Ones is always the RIGHT digit!',
    },
    {
      title: 'Let\'s Practice!',
      body: 'Look at each number and find the tens digit and the ones digit. You\'ve got this! 🌟',
      emoji: '🎉',
    },
  ],

  'pv-building': [
    {
      title: 'Build Any Number!',
      body: 'You can BUILD any number by combining TENS and ONES together!',
      emoji: '🏗️',
      example: '3 tens + 4 ones = 34',
    },
    {
      title: 'Tens + Ones = Number',
      body: 'Think of tens as stacks of 10 blocks. Add the single blocks and you get the full number!',
      emoji: '🧱',
      example: '5 tens + 2 ones\n= 50 + 2 = 52',
    },
    {
      title: 'Expanded Form',
      body: 'We can write numbers in EXPANDED FORM by splitting them into tens and ones!',
      emoji: '🔍',
      example: '63 = 60 + 3\n86 = 80 + 6',
      tip: 'Tip: The tens part always ends in 0!',
    },
    {
      title: 'Ready to Build!',
      body: 'Combine tens and ones to find the right number. You\'re a number builder! 🌟',
      emoji: '🎉',
    },
  ],

  'pv-comparing': [
    {
      title: 'Which is Bigger?',
      body: 'When comparing two numbers, look at the TENS digit FIRST — the bigger tens = bigger number!',
      emoji: '⚖️',
      example: '63 vs 36\n6 tens > 3 tens\nso 63 > 36!',
    },
    {
      title: 'Same Tens? Check Ones!',
      body: 'If the tens digits are EQUAL, then look at the ONES digit to decide!',
      emoji: '🔎',
      example: '45 vs 47\nSame tens (4)!\n5 ones < 7 ones\nso 45 < 47',
    },
    {
      title: 'Between Numbers',
      body: 'A number BETWEEN two others is bigger than the first but smaller than the second!',
      emoji: '📏',
      example: '25 is between 20 and 30\n20 < 25 < 30 ✓',
    },
    {
      title: 'You\'re Ready!',
      body: 'Use what you know about tens and ones to compare numbers like a pro! 🌟',
      emoji: '🎉',
    },
  ],

  // ── Telling Time ─────────────────────────────────────────────────────────

  'time-oclock': [
    {
      title: 'Reading a Clock',
      body: 'A clock has TWO hands! The SHORT hand shows the HOUR. The LONG hand shows the MINUTES.',
      emoji: '🕐',
      tip: 'Tip: Short = hours, Long = minutes!',
    },
    {
      title: 'O\'Clock',
      body: 'When the LONG hand points straight UP to 12, it\'s O\'CLOCK! Look at the SHORT hand for the hour.',
      emoji: '🕛',
      example: 'Long hand → 12\nShort hand → 3\n= 3 o\'clock!',
    },
    {
      title: 'Try the Clock Faces',
      body: 'Look at where the short hand points — that\'s the hour. If the long hand is at 12, say "o\'clock"!',
      emoji: '⏰',
      example: '🕐 = 1 o\'clock\n🕔 = 4 o\'clock\n🕙 = 10 o\'clock',
    },
    {
      title: 'Tick Tock!',
      body: 'Now it\'s your turn to read the clocks. Look for the short hand! 🌟',
      emoji: '🎉',
    },
  ],

  'time-halfpast': [
    {
      title: 'Half Past',
      body: 'When the LONG hand points straight DOWN to 6, it\'s HALF PAST the hour!',
      emoji: '🕧',
      example: 'Long hand → 6\nShort hand → between 3 & 4\n= half past 3!',
    },
    {
      title: '30 Minutes',
      body: '"Half past" means 30 minutes AFTER the hour. The clock is halfway around!',
      emoji: '⏱️',
      example: 'Half past 5 = 5:30\nHalf past 8 = 8:30\nHalf past 11 = 11:30',
      tip: 'Tip: Half past always ends in :30!',
    },
    {
      title: 'The Short Hand Moves',
      body: 'At half past, the short hand is BETWEEN two numbers — halfway to the next hour!',
      emoji: '🔍',
      example: 'Half past 2 → short hand\nis between 2 and 3',
    },
    {
      title: 'You\'ve Got It!',
      body: 'Look for the long hand pointing down to 6, then check the short hand for the hour. 🌟',
      emoji: '🎉',
    },
  ],

  'time-mixed': [
    {
      title: 'O\'Clock or Half Past?',
      body: 'Two clues: Where is the LONG hand? Up at 12 = o\'clock. Down at 6 = half past!',
      emoji: '🕐',
      example: 'Long hand at 12 → o\'clock\nLong hand at 6 → half past',
    },
    {
      title: 'Find the Hour',
      body: 'Once you know o\'clock or half past, read the SHORT hand for the hour number!',
      emoji: '🔎',
      example: '🕓 Short at 4, long at 12\n= 4 o\'clock\n\n🕟 Short between 4&5, long at 6\n= half past 4',
    },
    {
      title: 'Quick Review',
      body: 'Step 1: Long hand up (12) or down (6)?\nStep 2: Read the short hand for the hour!\nStep 3: Say the time!',
      emoji: '📋',
      tip: 'Tip: Say it out loud — "half past..." or "...o\'clock"!',
    },
    {
      title: 'Mix It Up!',
      body: 'Now you\'ll see all kinds of clocks — o\'clock and half past mixed together. Go for it! 🌟',
      emoji: '🎉',
    },
  ],

  // ── Measurement & Money ───────────────────────────────────────────────────

  'measure-length': [
    {
      title: 'Measuring Length',
      body: 'We can compare how LONG or SHORT, and how HEAVY or LIGHT things are!',
      emoji: '📏',
      example: 'A bus is longer than a car.\nA pencil is shorter than a ruler.',
    },
    {
      title: 'Longer & Shorter',
      body: 'To find which is LONGER, imagine laying them side by side. The one that sticks out more is longer!',
      emoji: '📐',
      example: '🐍 is longer than 🐛\n🌳 is taller than 🌱',
    },
    {
      title: 'Heavier & Lighter',
      body: 'HEAVIER means it weighs more. LIGHTER means it weighs less. Think about which you could lift!',
      emoji: '⚖️',
      example: '🐘 is heavier than 🐭\n🪨 is heavier than 🪶',
      tip: 'Tip: Bigger usually (but not always!) means heavier!',
    },
    {
      title: 'Let\'s Compare!',
      body: 'Look at the pictures and decide — which is longer, shorter, heavier or lighter? 🌟',
      emoji: '🎉',
    },
  ],

  'measure-coins': [
    {
      title: 'Coins Are Money!',
      body: 'We use coins to buy things. Each coin has a different value — how many cents (¢) it\'s worth!',
      emoji: '🪙',
      example: 'Penny = 1¢\nNickel = 5¢\nDime = 10¢',
    },
    {
      title: 'The Penny',
      body: 'A PENNY is worth 1 cent (1¢). It\'s the smallest value! You need 5 pennies to equal 1 nickel.',
      emoji: '🟤',
      example: '🪙 + 🪙 + 🪙 = 3¢\n(3 pennies = 3 cents)',
    },
    {
      title: 'Nickel & Dime',
      body: 'A NICKEL is worth 5¢. A DIME is worth 10¢ — the most of the three! A dime = 2 nickels = 10 pennies.',
      emoji: '🔵',
      example: '1 dime = 10¢\n1 nickel = 5¢\n1 penny = 1¢',
      tip: 'Tip: Dime is smallest coin but worth the most!',
    },
    {
      title: 'Coin Expert!',
      body: 'Remember: penny=1¢, nickel=5¢, dime=10¢. Now let\'s count those coins! 🌟',
      emoji: '🎉',
    },
  ],
};

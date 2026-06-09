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

  // ── Number Bonds ─────────────────────────────────────────────────────────

  'nb-bonds-5': [
    {
      title: 'What is a Number Bond?',
      body: 'A NUMBER BOND shows two parts that make a whole! 5 can be split into 2+3, or 1+4, or 0+5!',
      emoji: '🔗',
      example: '2 + 3 = 5\n1 + 4 = 5\n0 + 5 = 5',
    },
    {
      title: 'Find the Missing Part',
      body: 'When we see 2 + ? = 5, we find the MISSING PART. Count up from 2 to 5!',
      emoji: '❓',
      example: '2 + ? = 5\n2 → 3 → 4 → 5\nCount 3 steps = 3!',
      tip: 'Tip: Count on your fingers!',
    },
    {
      title: 'Both Ways Work!',
      body: 'Number bonds go BOTH ways! If 3 + 2 = 5, then 2 + 3 = 5 too! Always true!',
      emoji: '↔️',
      example: '3 + 2 = 5\n2 + 3 = 5\nBoth are correct!',
    },
    {
      title: 'Ready to Bond!',
      body: 'Find the missing number to make 5. You can use your fingers to count! 🌟',
      emoji: '🖐️',
    },
  ],

  'nb-bonds-10': [
    {
      title: 'Bonds to 10',
      body: '10 is a special number! Knowing which pairs make 10 helps you add BIG numbers fast!',
      emoji: '🔟',
      example: '1+9=10  2+8=10\n3+7=10  4+6=10\n5+5=10',
    },
    {
      title: 'Count On to 10',
      body: 'To solve 7 + ? = 10, count up from 7: "8, 9, 10" — that is 3 steps, so the answer is 3!',
      emoji: '🖐️',
      example: '7 + ? = 10\n7→8→9→10 = 3 steps\nAnswer: 3',
      tip: 'Tip: Use all 10 fingers!',
    },
    {
      title: '10 in Real Life',
      body: 'You have 10 fingers! Hold up some fingers and count the rest — they always add to 10!',
      emoji: '🙌',
      example: 'Hold up 6 fingers\nCount the rest: 4\n6 + 4 = 10 ✓',
    },
    {
      title: 'Make 10!',
      body: 'Find the missing number to make 10. Use your fingers or count up! 🌟',
      emoji: '🎉',
    },
  ],

  'nb-bonds-20': [
    {
      title: 'Bonds to 20',
      body: '20 is made of TWO tens. So 10 + 10 = 20! Can you find the other bonds to 20?',
      emoji: '2️⃣0️⃣',
      example: '10 + 10 = 20\n15 + 5 = 20\n12 + 8 = 20',
    },
    {
      title: 'Use Your 10s!',
      body: 'Bonds to 20 use what you know! If 6 + 4 = 10, then 16 + 4 = 20. Just add 10!',
      emoji: '🧠',
      example: '6 + 4 = 10\n16 + 4 = 20\nJust add 10 more!',
      tip: 'Tip: Your 10-bonds knowledge helps!',
    },
    {
      title: 'Count the Gap',
      body: 'For 12 + ? = 20, count from 12 to 20: 13, 14, 15, 16, 17, 18, 19, 20 — that is 8!',
      emoji: '📏',
      example: '12 + ? = 20\n12 → 20 = 8 steps\nAnswer: 8',
    },
    {
      title: 'Bond Master!',
      body: 'Find the missing number to make 20. Use what you know about tens! 🌟',
      emoji: '🎉',
    },
  ],

  // ── Even & Odd ────────────────────────────────────────────────────────────

  'eo-id': [
    {
      title: 'Even Numbers',
      body: 'EVEN numbers can be split into two EQUAL groups — they always come in pairs!',
      emoji: '🟢',
      example: '4 = 2 + 2 ✓ Even!\n6 = 3 + 3 ✓ Even!\n8 = 4 + 4 ✓ Even!',
      tip: 'Even numbers: 0, 2, 4, 6, 8, 10...',
    },
    {
      title: 'Odd Numbers',
      body: 'ODD numbers always have ONE left over when you try to make pairs — one is always lonely!',
      emoji: '🔴',
      example: '3 = 2 + 1 (leftover!)\n5 = 4 + 1 (leftover!)',
      tip: 'Odd numbers: 1, 3, 5, 7, 9, 11...',
    },
    {
      title: 'The Quick Trick!',
      body: 'Just look at the LAST DIGIT! Ends in 0, 2, 4, 6, or 8 = EVEN. Ends in 1, 3, 5, 7, or 9 = ODD!',
      emoji: '🔢',
      example: '24 → last digit 4 → EVEN!\n37 → last digit 7 → ODD!',
      tip: 'Tip: Only the last digit matters!',
    },
    {
      title: 'Even or Odd?',
      body: 'Look at the last digit and decide — even or odd? You\'ve got this! 🌟',
      emoji: '🎉',
    },
  ],

  'eo-find': [
    {
      title: 'Find the Even One!',
      body: 'To find the EVEN number in a group, check each one\'s last digit. Even ends in 0, 2, 4, 6, or 8!',
      emoji: '🟢',
      example: '7, 9, 12, 15\nWhich is even?\n12 → ends in 2 → EVEN!',
    },
    {
      title: 'Find the Odd One!',
      body: 'Odd numbers end in 1, 3, 5, 7, or 9. Spot the one that doesn\'t pair up!',
      emoji: '🔴',
      example: '4, 6, 9, 10\nWhich is odd?\n9 → ends in 9 → ODD!',
    },
    {
      title: 'Next Even & Odd',
      body: 'The NEXT even after 6 is 8 (skip 7!). The NEXT odd after 5 is 7 (skip 6!). Always skip one!',
      emoji: '➡️',
      example: 'Next even after 6:\n6 → skip 7 → 8 ✓\nNext odd after 5:\n5 → skip 6 → 7 ✓',
    },
    {
      title: 'Pattern Detective!',
      body: 'Find the even, the odd, or what comes next. Use the last-digit trick! 🌟',
      emoji: '🎉',
    },
  ],

  // ── Measurement & Money ───────────────────────────────────────────────────

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

  // ── Comparing Numbers ────────────────────────────────────────────────────

  'cmp-to10': [
    {
      title: 'Greater Than >',
      body: 'The > sign means the number on the LEFT is BIGGER. Think of it as a hungry mouth — it opens toward the bigger number!',
      emoji: '🐊',
      example: '5 > 3\n(5 is greater than 3)',
      tip: 'Tip: The open end always faces the bigger number!',
    },
    {
      title: 'Less Than <',
      body: 'The < sign means the number on the LEFT is SMALLER. The pointy end always points to the smaller number!',
      emoji: '◀️',
      example: '2 < 7\n(2 is less than 7)',
      tip: 'Tip: < looks like an L for Less!',
    },
    {
      title: 'Equal To =',
      body: 'The = sign means BOTH numbers are exactly the same. Two equal lines for two equal numbers!',
      emoji: '⚖️',
      example: '4 = 4\n(4 is equal to 4)',
    },
    {
      title: 'Let\'s Compare!',
      body: 'Look at the two numbers: which is bigger, smaller, or are they the same? Pick the right sign! You\'ve got this! 🌟',
      emoji: '🎯',
    },
  ],

  'cmp-to20': [
    {
      title: 'Bigger Numbers',
      body: 'We use the same signs for bigger numbers too! Compare the TENS digit first — a bigger tens digit means a bigger number.',
      emoji: '🔢',
      example: '15 > 8\n(15 has a tens digit, 8 doesn\'t)',
      tip: 'Tip: Any 2-digit number is bigger than a 1-digit number!',
    },
    {
      title: 'Same Tens? Check Ones!',
      body: 'If the tens digits are the same, compare the ONES digits to decide which is bigger.',
      emoji: '🔍',
      example: '14 > 12\n(same tens: 1, but 4 ones > 2 ones)',
    },
    {
      title: 'Practice Makes Perfect',
      body: 'Remember: > for greater, < for less, = for equal. You\'re doing amazing! 🌟',
      emoji: '⭐',
    },
  ],

  // ── Missing Number ───────────────────────────────────────────────────────

  'miss-add-10': [
    {
      title: 'The Hiding Number',
      body: 'Sometimes a number HIDES in the problem! "3 + ? = 7" asks: what do we add to 3 to make 7?',
      emoji: '🙈',
      example: '3 + ? = 7\nThe hiding number is 4!',
    },
    {
      title: 'Count Up to Find It',
      body: 'Start at the first number and COUNT UP until you reach the answer. How many counts did it take? That\'s the hiding number!',
      emoji: '☝️',
      example: '3 + ? = 7\nCount: 4, 5, 6, 7\nThat\'s 4 counts → ? = 4',
      tip: 'Tip: Use your fingers to keep track!',
    },
    {
      title: 'Check Your Answer',
      body: 'When you find the hiding number, add it back to check: does 3 + 4 really make 7? Yes! ✓',
      emoji: '✅',
      example: '3 + 4 = 7 ✓',
    },
    {
      title: 'Ready to Search?',
      body: 'Find each hiding number by counting up. You\'re a number detective now! 🕵️',
      emoji: '🔍',
    },
  ],

  'miss-add-20': [
    {
      title: 'Bigger Hiding Numbers',
      body: 'Same trick, bigger numbers! Count up from the first number to the total.',
      emoji: '🙈',
      example: '8 + ? = 15\nCount: 9, 10, 11, 12, 13, 14, 15\nThat\'s 7 counts → ? = 7',
    },
    {
      title: 'Use Ten as a Bridge',
      body: 'For big jumps, count up to 10 first, then keep going. It\'s easier in two hops!',
      emoji: '🌉',
      example: '8 + ? = 15\n8 → 10 is 2\n10 → 15 is 5\n2 + 5 = 7!',
      tip: 'Tip: 10 is your friend — hop there first!',
    },
    {
      title: 'You\'ve Got This!',
      body: 'Count up, use the 10-bridge for big numbers, and always check your answer! 🌟',
      emoji: '⭐',
    },
  ],

  'miss-mixed-20': [
    {
      title: 'Minus Mysteries',
      body: 'Numbers can hide in TAKE AWAY problems too! "9 − ? = 6" asks: how many did we take away to get from 9 to 6?',
      emoji: '🕵️',
      example: '9 − ? = 6\nCount down: 8, 7, 6\nThat\'s 3 → ? = 3',
    },
    {
      title: 'Count the Gap',
      body: 'For minus mysteries, find the GAP between the two numbers. The gap is the hiding number!',
      emoji: '↔️',
      example: '9 − ? = 6\nThe gap from 6 to 9 is 3',
      tip: 'Tip: The hiding number is the distance between them!',
    },
    {
      title: 'Plus or Minus?',
      body: 'Look at the sign first! Plus mysteries: count UP. Minus mysteries: find the GAP. You\'re ready! 🌟',
      emoji: '🎯',
    },
  ],

  // ── Fact Families ────────────────────────────────────────────────────────

  'ff-to10': [
    {
      title: 'What\'s a Fact Family?',
      body: 'A FACT FAMILY is a group of addition and subtraction equations that use the same three numbers!',
      emoji: '👨‍👩‍👧',
      example: 'Numbers 2, 3, 5:\n2 + 3 = 5\n3 + 2 = 5\n5 − 2 = 3\n5 − 3 = 2',
    },
    {
      title: 'The Connection',
      body: 'Addition and subtraction are opposites — they UNDO each other! If you know an addition fact, you automatically know two subtraction facts!',
      emoji: '🔗',
      example: 'Know: 4 + 3 = 7\nThen: 7 − 3 = 4 ✓\nAnd:  7 − 4 = 3 ✓',
      tip: 'Tip: The big number always goes first in subtraction!',
    },
    {
      title: 'Finding the Missing Part',
      body: 'When you see "4 + 3 = 7, so 7 − 3 = ?", think: what was added to 3 to make 7? That\'s 4!',
      emoji: '🧩',
      example: '4 + 3 = 7\nso 7 − 3 = 4',
    },
    {
      title: 'You\'re Ready!',
      body: 'Use the addition clue to solve the subtraction. The answer is always one of the two smaller numbers! 🌟',
      emoji: '🎉',
    },
  ],

  'ff-to20': [
    {
      title: 'Bigger Families',
      body: 'Fact families work with bigger numbers too! The same rule applies: use the addition to solve the subtraction.',
      emoji: '🏠',
      example: '8 + 5 = 13\nso 13 − 5 = 8\nand 13 − 8 = 5',
    },
    {
      title: 'Think It Through',
      body: 'For big numbers, count on from the smaller number. If 6 + 7 = 13, then 13 − 7 = 6 because 6 is what you added to 7!',
      emoji: '🧠',
      example: '9 + 4 = 13\nso 13 − 4 = ?',
      tip: 'Tip: The answer is always one of the two parts (not the whole sum)!',
    },
    {
      title: 'You\'re a Math Star!',
      body: 'Fact families are a superpower — knowing one fact gives you three more for free! 🌟',
      emoji: '⭐',
    },
  ],
};

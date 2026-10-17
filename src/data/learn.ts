import { ErrorTag, Level } from '@/types';
import { LESSONS } from './lessons';
import { getLevelById } from './categories';
import { RUNG_FOR_LEVEL, SKILL_FOR_LEVEL, TOPICS_BY_ID } from './topics';

// Lessons that teach, for a child who cannot read them yet.
//
// The first lessons in this app were text slides: a title, a paragraph, an
// example in monospace. Fine for a parent reading aloud, useless to a six-year-
// old on her own — and nothing on them could be touched. These are built the way
// first grade is actually taught:
//
//   watch   the guide says one short thing out loud while a picture moves —
//           hops on a number line, counters sliding into a ten frame, two rows
//           of coins lining up
//   try     she answers one question about the same picture; a wrong tap gets a
//           hint written for *that* wrong answer ("did you count 17 as a hop?"),
//           and the right one plays the picture through to show why
//
// Every word is spoken. Captions are a few words with the numbers in them, so a
// non-reader can follow by ear and still see the maths.
//
// Nothing in a lesson is scored. Lessons are where she is allowed to be wrong;
// the ladder and the SRS only hear about what she does in play.
//
// The pictures are the ones her class uses on paper (the "Subtract Using Number
// Line" worksheet, part-whole bars, ten frames), so the lesson and the homework
// look like the same idea. Characters in examples are named every time, never
// "he" or "she".

export type Scene =
  /**
   * A number line. `hops` arcs are drawn from `start` in direction `dir`; with
   * `animate` they appear one at a time. `interactive` hands her the hop line to
   * work it out herself, starting from `start`.
   */
  | { kind: 'numberLine'; max: number; start: number; hops?: number; dir?: 1 | -1; animate?: boolean; interactive?: boolean }
  /** Ten frame: `first` counters, then `second` in another colour, `outside` waiting below. */
  | { kind: 'tenFrame'; first: number; second?: number; outside?: number; emoji?: string; askEmpty?: boolean }
  /** Bar model: the whole on top, its two parts underneath. null is the unknown. */
  | { kind: 'partWhole'; whole: number | null; parts: [number | null, number | null]; labels: [string, string, string] }
  /** Two rows of things lined up to compare. `match` pairs them and lights up the extras. */
  | { kind: 'compare'; rows: [CompareRow, CompareRow]; match?: boolean }
  /** Two equal rows, plus `extra` for a near double. */
  | { kind: 'doubles'; n: number; extra?: number }
  /** A level balance: "=" means both sides are worth the same. */
  | { kind: 'balance'; left: string; right: string }
  | { kind: 'big'; text: string };

export interface CompareRow {
  label: string;
  count: number;
  emoji: string;
}

export interface WatchStep {
  kind: 'watch';
  /** Spoken in full. */
  say: string;
  /** On screen: a few words, with the numbers. */
  caption: string;
  /** Longer text under the caption, for a grown-up reading along. Old slides only. */
  detail?: string;
  scene?: Scene;
}

export interface TryStep {
  kind: 'try';
  say: string;
  caption: string;
  scene?: Scene;
  /** Any order: the player shuffles them every time. */
  choices: string[];
  answer: string;
  /** What to say after a particular wrong choice. */
  hints?: Record<string, string>;
  /** After she gets it: say why, and usually play the picture through. */
  then: { say: string; caption?: string; scene?: Scene };
}

export type LessonStep = WatchStep | TryStep;

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  /** The topics (skills) it belongs to, and the rung it teaches in each. */
  places: { skillId: string; rung: number }[];
  /** Where "Practice it now" goes. */
  practiceLevelId: string;
  /** Mistakes this lesson is the answer to — how a lesson gets recommended. */
  helpsWith?: ErrorTag[];
  steps: LessonStep[];
}

const LINE = 20;

// ---------------------------------------------------------------------------
// Adding and taking away
// ---------------------------------------------------------------------------

const COUNT_ON: Lesson = {
  id: 'count-on',
  title: 'Counting On',
  emoji: '🐸',
  // Also Number Tricks' "Counting on within 20", which had no lesson at all.
  places: [{ skillId: 'adding', rung: 4 }, { skillId: 'strategies', rung: 3 }],
  practiceLevelId: 'addition-3',
  helpsWith: ['off-by-one', 'answered-a-given-number'],
  steps: [
    {
      kind: 'watch',
      say: "Let's add 8 and 3. Here's a trick. You don't have to count from 1!",
      caption: '8 + 3 = ?',
      scene: { kind: 'big', text: '8 + 3 = ?' },
    },
    {
      kind: 'watch',
      say: 'Start on the bigger number. Put your finger on 8.',
      caption: 'Start on 8',
      scene: { kind: 'numberLine', max: LINE, start: 8 },
    },
    {
      kind: 'watch',
      say: 'Now hop forward 3 times. 9. 10. 11. We land on 11!',
      caption: 'Hop 3 times → 11',
      scene: { kind: 'numberLine', max: LINE, start: 8, hops: 3, dir: 1, animate: true },
    },
    {
      kind: 'watch',
      say: 'So 8 plus 3 is 11. Count the hops, not the number you start on.',
      caption: 'Count the hops!',
      scene: { kind: 'big', text: '8 + 3 = 11' },
    },
    {
      kind: 'try',
      say: 'Your turn! Start on 9 and hop forward 4. Where do you land? You can tap the number line to hop.',
      caption: '9 + 4 = ?',
      scene: { kind: 'numberLine', max: LINE, start: 9, interactive: true },
      choices: ['13', '12', '14', '5'],
      answer: '13',
      hints: {
        '12': 'So close! Your first hop goes from 9 to 10. Count the hops again: 10, 11, 12, 13.',
        '14': 'One hop too many. Hop just 4 times: 10, 11, 12, 13.',
        '5': "That's what's left if you take away. We're adding, so hop forward!",
      },
      then: {
        say: 'Yes! 10, 11, 12, 13. 9 plus 4 is 13!',
        caption: '9 + 4 = 13',
        scene: { kind: 'numberLine', max: LINE, start: 9, hops: 4, dir: 1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'For 3 plus 9, which number is quicker to start on?',
      caption: '3 + 9: start on which?',
      scene: { kind: 'big', text: '3 + 9' },
      choices: ['9', '3'],
      answer: '9',
      hints: { '3': "You could! But then you'd hop 9 times. Start on 9, and you only hop 3." },
      then: {
        say: 'Yes! Start on the bigger number, 9, and hop 3. 10, 11, 12. 3 plus 9 is 12!',
        caption: '3 + 9 = 12',
        scene: { kind: 'numberLine', max: LINE, start: 9, hops: 3, dir: 1, animate: true },
      },
    },
  ],
};

const HOP_BACK: Lesson = {
  id: 'hop-back',
  title: 'Hop Back to Take Away',
  emoji: '⬅️',
  places: [{ skillId: 'taking-away', rung: 4 }],
  practiceLevelId: 'subtraction-3',
  helpsWith: ['off-by-one', 'wrong-operation'],
  steps: [
    {
      kind: 'watch',
      say: 'Taking away means going back on the number line. Let\'s do 14 take away 6.',
      caption: '14 − 6 = ?',
      scene: { kind: 'big', text: '14 − 6 = ?' },
    },
    {
      kind: 'watch',
      say: "Start on 14. You're standing on 14, so 14 is not a hop.",
      caption: 'Start on 14',
      scene: { kind: 'numberLine', max: LINE, start: 14 },
    },
    {
      kind: 'watch',
      say: 'Now hop back 6 times. 13. 12. 11. 10. 9. 8. We land on 8.',
      caption: '6 hops back → 8',
      scene: { kind: 'numberLine', max: LINE, start: 14, hops: 6, dir: -1, animate: true },
    },
    {
      kind: 'watch',
      say: '14 take away 6 is 8. Taking away makes the number smaller.',
      caption: 'Back means smaller',
      scene: { kind: 'big', text: '14 − 6 = 8' },
    },
    {
      kind: 'try',
      say: 'Your turn! 17 take away 6. Start on 17 and hop back 6. Tap the line to hop.',
      caption: '17 − 6 = ?',
      scene: { kind: 'numberLine', max: LINE, start: 17, interactive: true },
      choices: ['11', '12', '23', '10'],
      answer: '11',
      hints: {
        '12': "Did you count 17 as a hop? You're standing on 17. Your first hop lands on 16.",
        '23': "That's 17 plus 6. Taking away goes back, so the answer is smaller than 17.",
        '10': 'One hop too many. Hop back just 6: 16, 15, 14, 13, 12, 11.',
      },
      then: {
        say: 'Yes! 16, 15, 14, 13, 12, 11. 17 take away 6 is 11.',
        caption: '17 − 6 = 11',
        scene: { kind: 'numberLine', max: LINE, start: 17, hops: 6, dir: -1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'One more. 19 take away 5.',
      caption: '19 − 5 = ?',
      scene: { kind: 'numberLine', max: LINE, start: 19, interactive: true },
      choices: ['14', '15', '24', '13'],
      answer: '14',
      hints: {
        '15': 'Your first hop goes from 19 to 18. Count again: 18, 17, 16, 15, 14.',
        '24': "That's adding. Taking away goes back!",
        '13': 'One hop too many. Hop back just 5.',
      },
      then: {
        say: 'You got it! 19 take away 5 is 14.',
        caption: '19 − 5 = 14',
        scene: { kind: 'numberLine', max: LINE, start: 19, hops: 5, dir: -1, animate: true },
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Number tricks
// ---------------------------------------------------------------------------

const DOUBLES: Lesson = {
  id: 'doubles',
  title: 'Doubles',
  emoji: '👯',
  places: [{ skillId: 'strategies', rung: 1 }],
  practiceLevelId: 'strategy-doubles',
  // "That's just one row" is written for giving one half of the double, and
  // "count both rows" for landing one off.
  helpsWith: ['answered-a-given-number', 'off-by-one'],
  steps: [
    {
      kind: 'watch',
      say: 'A double is the same number two times. 4 and 4 make 8.',
      caption: '4 + 4 = 8',
      scene: { kind: 'doubles', n: 4 },
    },
    {
      kind: 'watch',
      say: '6 and 6 make 12. Like an egg box with 6 on each side!',
      caption: '6 + 6 = 12',
      scene: { kind: 'doubles', n: 6 },
    },
    {
      kind: 'try',
      say: 'What is 7 plus 7?',
      caption: '7 + 7 = ?',
      scene: { kind: 'doubles', n: 7 },
      choices: ['14', '13', '15', '7'],
      answer: '14',
      hints: {
        '13': 'Count both rows: 7, and 7 more.',
        '15': 'Count both rows carefully: 7, and 7 more.',
        '7': "That's just one row. Add the other row too!",
      },
      then: { say: 'Yes! 7 and 7 make 14.', caption: '7 + 7 = 14' },
    },
    {
      kind: 'watch',
      say: "Here's a trick. 7 plus 8 is a double, and 1 more.",
      caption: '7 + 8 = 7 + 7 + 1',
      scene: { kind: 'doubles', n: 7, extra: 1 },
    },
    {
      kind: 'try',
      say: 'So what is 7 plus 8?',
      caption: '7 + 8 = ?',
      scene: { kind: 'doubles', n: 7, extra: 1 },
      choices: ['15', '14', '16', '1'],
      answer: '15',
      hints: {
        '14': "That's 7 plus 7. Now add the 1 extra!",
        '16': "That's 8 plus 8. Use 7 plus 7, then 1 more.",
        '1': '1 is the extra one. Add it to the double, 14.',
      },
      then: { say: 'Yes! 14 and 1 more is 15.', caption: '7 + 8 = 15' },
    },
  ],
};

const MAKE_TEN: Lesson = {
  id: 'make-ten',
  title: 'Make a Ten',
  emoji: '🔟',
  places: [{ skillId: 'strategies', rung: 2 }],
  practiceLevelId: 'strategy-make-ten',
  // "The frame holds 10 altogether" is written for answering with the ten
  // itself, and "that's all the counters outside" for giving a number she was shown.
  helpsWith: ['answered-the-whole', 'answered-a-given-number'],
  steps: [
    {
      kind: 'watch',
      say: "Let's add 8 and 5. Here are 8 counters in a ten frame, and 5 more waiting outside.",
      caption: '8 + 5 = ?',
      scene: { kind: 'tenFrame', first: 8, outside: 5 },
    },
    {
      kind: 'watch',
      say: 'The ten frame has 2 empty spaces. 8 needs 2 more to make 10.',
      caption: '8 + 2 = 10',
      scene: { kind: 'tenFrame', first: 8, outside: 5, askEmpty: true },
    },
    {
      kind: 'watch',
      say: 'Move 2 counters into the frame. Now it is full. 10! And 3 are left over.',
      caption: '10 and 3 more',
      scene: { kind: 'tenFrame', first: 8, second: 2, outside: 3 },
    },
    {
      kind: 'watch',
      say: '10 and 3 make 13. So 8 plus 5 is 13!',
      caption: '8 + 5 = 13',
      scene: { kind: 'big', text: '8 + 5\n10 + 3 = 13' },
    },
    {
      kind: 'try',
      say: 'Your turn. 9 plus 4. How many counters will fill up the ten frame?',
      caption: '9 + ? = 10',
      scene: { kind: 'tenFrame', first: 9, outside: 4, askEmpty: true },
      choices: ['1', '2', '4', '10'],
      answer: '1',
      hints: {
        '2': 'Count the empty spaces. There is just one!',
        '4': "That's all the counters outside. How many fit in the frame?",
        '10': 'The frame holds 10 altogether. How many more fit in?',
      },
      then: {
        say: 'Yes! Move 1 in. Now the frame has 10, and 3 are left over.',
        caption: '10 and 3 more',
        scene: { kind: 'tenFrame', first: 9, second: 1, outside: 3 },
      },
    },
    {
      kind: 'try',
      say: 'So what is 9 plus 4?',
      caption: '10 + 3 = ?',
      scene: { kind: 'tenFrame', first: 9, second: 1, outside: 3 },
      choices: ['13', '14', '12', '5'],
      answer: '13',
      hints: {
        '14': 'A full ten, and 3 more: 10, 11, 12, 13.',
        '12': 'A full ten, and 3 more: 10, 11, 12, 13.',
        '5': "That's 9 take away 4. We're putting them together!",
      },
      then: { say: '13! Making a ten makes it easy.', caption: '9 + 4 = 13', scene: { kind: 'big', text: '9 + 4 = 13' } },
    },
  ],
};

// ---------------------------------------------------------------------------
// Story problems
// ---------------------------------------------------------------------------

const SOME_AND_THE_REST: Lesson = {
  id: 'some-and-the-rest',
  title: 'Some and the Rest',
  emoji: '⚽',
  places: [{ skillId: 'stories', rung: 4 }],
  practiceLevelId: 'story-part',
  helpsWith: ['added-story-numbers', 'answered-the-whole'],
  steps: [
    {
      kind: 'watch',
      say: 'Rhett has 14 balls. 6 are soccer balls. The rest are basketballs. How many basketballs does Rhett have?',
      caption: '14 balls. 6 are soccer balls.',
      scene: { kind: 'big', text: '⚽🏀' },
    },
    {
      kind: 'watch',
      say: 'The 14 is ALL the balls. The soccer balls and the basketballs are both inside it.',
      caption: '14 is the whole',
      scene: { kind: 'partWhole', whole: 14, parts: [6, null], labels: ['all the balls', 'soccer', 'basketballs'] },
    },
    {
      kind: 'try',
      say: 'So are there more than 14 basketballs, or fewer?',
      caption: 'More or fewer than 14?',
      scene: { kind: 'partWhole', whole: 14, parts: [6, null], labels: ['all the balls', 'soccer', 'basketballs'] },
      choices: ['Fewer', 'More'],
      answer: 'Fewer',
      hints: { More: 'Look at the bar. The basketballs are only part of the 14!' },
      then: {
        say: 'Right! The basketballs are just part of the 14. If you add 14 and 6, you get too many.',
        caption: 'Fewer than 14!',
      },
    },
    {
      kind: 'watch',
      say: 'Start on 14. Take away the 6 soccer balls: hop back 6. We land on 8.',
      caption: '14 − 6 = 8',
      scene: { kind: 'numberLine', max: LINE, start: 14, hops: 6, dir: -1, animate: true },
    },
    {
      kind: 'watch',
      say: '8 basketballs! Check it: 6 and 8 make 14.',
      caption: '6 + 8 = 14 ✓',
      scene: { kind: 'partWhole', whole: 14, parts: [6, 8], labels: ['all the balls', 'soccer', 'basketballs'] },
    },
    {
      kind: 'try',
      say: 'Kenna has 15 stuffed animals. 9 are bears. The rest are bunnies. How many bunnies?',
      caption: '15 animals. 9 are bears.',
      scene: { kind: 'partWhole', whole: 15, parts: [9, null], labels: ['all the animals', 'bears', 'bunnies'] },
      choices: ['6', '24', '5', '7'],
      answer: '6',
      hints: {
        '24': '24 is more than all 15 animals! The bunnies are part of the 15.',
        '5': 'Close! Think: 9 and how many more make 15?',
        '7': 'Close! Think: 9 and how many more make 15?',
      },
      then: {
        say: 'Yes! 9 bears and 6 bunnies make 15.',
        caption: '9 + 6 = 15',
        scene: { kind: 'partWhole', whole: 15, parts: [9, 6], labels: ['all the animals', 'bears', 'bunnies'] },
      },
    },
    {
      kind: 'try',
      say: 'Careful, this one is different! Molly has 7 red apples and 5 green apples. How many apples in all?',
      caption: '7 red, 5 green. In all?',
      scene: { kind: 'partWhole', whole: null, parts: [7, 5], labels: ['all the apples', 'red', 'green'] },
      choices: ['12', '2', '11', '13'],
      answer: '12',
      hints: {
        '2': 'This time we know both parts. The whole is missing, so put them together!',
        '11': 'Put them together carefully: start on 7 and hop 5.',
        '13': 'Put them together carefully: start on 7 and hop 5.',
      },
      then: {
        say: 'Yes! When the whole is missing, we put the parts together. 7 and 5 make 12.',
        caption: '7 + 5 = 12',
        scene: { kind: 'partWhole', whole: 12, parts: [7, 5], labels: ['all the apples', 'red', 'green'] },
      },
    },
  ],
};

const HOW_MANY_MORE: Lesson = {
  id: 'how-many-more',
  title: 'How Many More?',
  emoji: '🪙',
  places: [{ skillId: 'stories', rung: 5 }],
  practiceLevelId: 'story-compare',
  helpsWith: ['added-story-numbers'],
  steps: [
    {
      kind: 'watch',
      say: 'Molly has 11 gold coins and 7 silver coins. How many more gold coins than silver coins?',
      caption: 'How many more gold?',
      scene: { kind: 'compare', rows: [{ label: 'gold', count: 11, emoji: '🟡' }, { label: 'silver', count: 7, emoji: '⚪' }] },
    },
    {
      kind: 'watch',
      say: 'Line them up! Every silver coin gets a gold partner.',
      caption: 'Match them up',
      scene: { kind: 'compare', rows: [{ label: 'gold', count: 11, emoji: '🟡' }, { label: 'silver', count: 7, emoji: '⚪' }], match: true },
    },
    {
      kind: 'watch',
      say: '4 gold coins have no partner. Those are the extra ones. Molly has 4 more gold coins.',
      caption: '11 − 7 = 4',
      scene: { kind: 'compare', rows: [{ label: 'gold', count: 11, emoji: '🟡' }, { label: 'silver', count: 7, emoji: '⚪' }], match: true },
    },
    {
      kind: 'try',
      say: 'Hudson has 10 old cards and 8 new cards. How many more old cards than new cards?',
      caption: '10 old, 8 new. How many more?',
      scene: { kind: 'compare', rows: [{ label: 'old', count: 10, emoji: '🃏' }, { label: 'new', count: 8, emoji: '🎴' }] },
      choices: ['2', '18', '1', '3'],
      answer: '2',
      hints: {
        '18': '18 is all the cards put together. We only want the extra ones!',
        '1': 'Match them up, then count the old cards with no partner.',
        '3': 'Match them up, then count the old cards with no partner.',
      },
      then: {
        say: 'Yes! 2 old cards have no partner. 10 is 2 more than 8.',
        caption: '10 − 8 = 2',
        scene: { kind: 'compare', rows: [{ label: 'old', count: 10, emoji: '🃏' }, { label: 'new', count: 8, emoji: '🎴' }], match: true },
      },
    },
    {
      kind: 'watch',
      say: 'You can count up, too. Start on the smaller number, 8, and count up to 10. That is 2 hops.',
      caption: '8 + ? = 10',
      scene: { kind: 'numberLine', max: LINE, start: 8, hops: 2, dir: 1, animate: true },
    },
  ],
};

const FEWER_THAN: Lesson = {
  id: 'fewer-than',
  title: 'More Than, Fewer Than',
  emoji: '💎',
  places: [{ skillId: 'stories', rung: 6 }],
  practiceLevelId: 'story-fewer',
  helpsWith: ['off-by-one', 'wrong-operation'],
  steps: [
    {
      kind: 'watch',
      say: 'Talan has 7 fewer gems than Gordan. Gordan has 19 gems. How many gems does Talan have?',
      caption: '7 fewer than 19',
      scene: { kind: 'big', text: '💎' },
    },
    {
      kind: 'try',
      say: 'Who has more gems, Talan or Gordan?',
      caption: 'Who has more?',
      choices: ['Gordan', 'Talan'],
      answer: 'Gordan',
      hints: { Talan: 'Talan has 7 FEWER. Fewer means less!' },
      then: { say: 'Yes! Gordan has more. So Talan has less than 19.', caption: 'Talan has less' },
    },
    {
      kind: 'watch',
      say: 'Start on 19 and hop back 7. 18, 17, 16, 15, 14, 13, 12.',
      caption: '19 − 7 = 12',
      scene: { kind: 'numberLine', max: LINE, start: 19, hops: 7, dir: -1, animate: true },
    },
    {
      kind: 'watch',
      say: 'Talan has 12. Line them up, and Gordan has 7 extra.',
      caption: '12 is 7 fewer than 19',
      scene: { kind: 'compare', rows: [{ label: 'Gordan', count: 19, emoji: '💎' }, { label: 'Talan', count: 12, emoji: '💎' }], match: true },
    },
    {
      kind: 'try',
      say: 'Sally has 5 fewer toys than Harry. Harry has 17 toys. How many toys does Sally have?',
      caption: '5 fewer than 17',
      scene: { kind: 'numberLine', max: LINE, start: 17, interactive: true },
      choices: ['12', '13', '22', '5'],
      answer: '12',
      hints: {
        '13': 'Careful with the hops! Your first hop lands on 16. Count: 16, 15, 14, 13, 12.',
        '22': 'Fewer means less than 17. Hop back, not forward!',
        '5': '5 is how many fewer. How many toys does Sally have?',
      },
      then: {
        say: 'Yes! 17 take away 5 is 12. Sally has 12 toys.',
        caption: '17 − 5 = 12',
        scene: { kind: 'numberLine', max: LINE, start: 17, hops: 5, dir: -1, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'Now a MORE one. Leo has 4 more stickers than Ava. Ava has 9. How many stickers does Leo have?',
      caption: '4 more than 9',
      scene: { kind: 'numberLine', max: LINE, start: 9, interactive: true },
      choices: ['13', '5', '12', '14'],
      answer: '13',
      hints: {
        '5': 'More means Leo has extra. Hop forward from 9!',
        '12': 'Your first hop lands on 10. Count: 10, 11, 12, 13.',
        '14': 'One hop too many. Hop forward just 4.',
      },
      then: {
        say: 'Yes! More means add. 9 and 4 more is 13.',
        caption: '9 + 4 = 13',
        scene: { kind: 'numberLine', max: LINE, start: 9, hops: 4, dir: 1, animate: true },
      },
    },
  ],
};

const STILL_NEEDS: Lesson = {
  id: 'still-needs',
  title: 'How Many More Are Needed?',
  emoji: '🥚',
  places: [{ skillId: 'stories', rung: 7 }],
  practiceLevelId: 'story-needs',
  helpsWith: ['added-story-numbers', 'reversed'],
  steps: [
    {
      kind: 'watch',
      say: 'Nick needs 10 eggs. Nick gets 6 eggs from the fridge. How many more eggs does Nick still need?',
      caption: 'Needs 10. Has 6.',
      scene: { kind: 'tenFrame', first: 6, emoji: '🥚' },
    },
    {
      kind: 'watch',
      say: 'The egg box holds 10. 6 are in. Count the empty spaces.',
      caption: '6 + ? = 10',
      scene: { kind: 'tenFrame', first: 6, emoji: '🥚', askEmpty: true },
    },
    {
      kind: 'watch',
      say: '4 more eggs fill it up! 6 and 4 make 10.',
      caption: '6 + 4 = 10',
      scene: { kind: 'tenFrame', first: 6, second: 4, emoji: '🥚' },
    },
    {
      kind: 'try',
      say: 'Which adding problem shows how many more eggs Nick needs?',
      caption: 'Which one matches?',
      scene: { kind: 'tenFrame', first: 6, emoji: '🥚', askEmpty: true },
      choices: ['6 + ? = 10', '10 + 6 = ?', '6 + 10 = ?'],
      answer: '6 + ? = 10',
      hints: {
        '10 + 6 = ?': 'That would make 16 eggs! Nick only needs 10 in all.',
        '6 + 10 = ?': 'That makes 16 too. 10 is ALL the eggs, so it goes after the equals sign.',
      },
      then: {
        say: 'Yes! Nick has 6, gets some more, and wants 10 in all. 6 plus what equals 10.',
        caption: '6 + ? = 10',
      },
    },
    {
      kind: 'try',
      say: 'Ruby needs 12 cups. Ruby has 7. How many more cups does Ruby need?',
      caption: '7 + ? = 12',
      scene: { kind: 'numberLine', max: LINE, start: 7, interactive: true },
      choices: ['5', '19', '4', '6'],
      answer: '5',
      hints: {
        '19': 'Ruby needs 12 in all, not 19! Count up from 7 to 12.',
        '4': 'Count the hops from 7 up to 12: 8, 9, 10, 11, 12.',
        '6': 'Count the hops from 7 up to 12: 8, 9, 10, 11, 12.',
      },
      then: {
        say: 'Yes! Count up from 7 to 12. 8, 9, 10, 11, 12. That is 5 more cups.',
        caption: '7 + 5 = 12',
        scene: { kind: 'numberLine', max: LINE, start: 7, hops: 5, dir: 1, animate: true },
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Adding and subtracting are the same facts
// ---------------------------------------------------------------------------

const THINK_ADDITION: Lesson = {
  id: 'think-addition',
  title: 'Adding Helps Subtracting',
  emoji: '💡',
  places: [{ skillId: 'fact-families', rung: 2 }],
  practiceLevelId: 'ff-helper',
  helpsWith: ['wrong-operation'],
  steps: [
    {
      kind: 'watch',
      say: "Here's a secret. Every take-away has an adding fact hiding inside it!",
      caption: '13 − 6 = ?',
      scene: { kind: 'big', text: '13 − 6 = ?' },
    },
    {
      kind: 'watch',
      say: '13 is the whole. 6 is one part. What is the other part?',
      caption: '6 + ? = 13',
      scene: { kind: 'partWhole', whole: 13, parts: [6, null], labels: ['13', 'part', 'part'] },
    },
    {
      kind: 'watch',
      say: '6 and 7 make 13. So 13 take away 6 is 7!',
      caption: '6 + 7 = 13, so 13 − 6 = 7',
      scene: { kind: 'partWhole', whole: 13, parts: [6, 7], labels: ['13', 'part', 'part'] },
    },
    {
      kind: 'try',
      say: 'Which adding fact helps with 15 take away 9?',
      caption: 'Helps with 15 − 9?',
      scene: { kind: 'big', text: '15 − 9 = ?' },
      choices: ['6 + 9 = 15', '15 + 9 = 24', '5 + 9 = 14', '9 + 9 = 18'],
      answer: '6 + 9 = 15',
      hints: {
        '15 + 9 = 24': 'That fact makes 24. We need one that makes 15!',
        '5 + 9 = 14': 'That one makes 14. Find the one that makes 15.',
        '9 + 9 = 18': 'That one makes 18. Find the one with 9 that makes 15.',
      },
      then: {
        say: 'Yes! 6 and 9 make 15.',
        caption: '6 + 9 = 15',
        scene: { kind: 'partWhole', whole: 15, parts: [9, 6], labels: ['15', 'part', 'part'] },
      },
    },
    {
      kind: 'try',
      say: 'So what is 15 take away 9?',
      caption: '15 − 9 = ?',
      scene: { kind: 'partWhole', whole: 15, parts: [9, null], labels: ['15', 'part', 'part'] },
      choices: ['6', '4', '24', '5'],
      answer: '6',
      hints: {
        '4': 'Use the helper fact: 6 + 9 = 15.',
        '5': 'Use the helper fact: 6 + 9 = 15.',
        '24': 'Taking away makes 15 smaller. Use the helper fact: 6 + 9 = 15.',
      },
      then: { say: 'Yes! 15 take away 9 is 6. Adding helped!', caption: '15 − 9 = 6', scene: { kind: 'big', text: '15 − 9 = 6' } },
    },
  ],
};

const EQUALS_MEANS_SAME: Lesson = {
  id: 'equals-same',
  title: 'The Equals Sign',
  emoji: '⚖️',
  places: [
    { skillId: 'mystery-number', rung: 2 },
    { skillId: 'fact-families', rung: 4 },
  ],
  practiceLevelId: 'miss-mixed-20',
  helpsWith: ['wrong-operation', 'answered-the-whole'],
  steps: [
    {
      kind: 'watch',
      say: 'The equals sign means both sides are the same. 8 is the same as 5 plus 3.',
      caption: '8 = 5 + 3',
      scene: { kind: 'balance', left: '8', right: '5 + 3' },
    },
    {
      kind: 'watch',
      say: 'It works both ways. 5 plus 3 is the same as 8. The answer does not have to come last!',
      caption: '5 + 3 = 8',
      scene: { kind: 'balance', left: '5 + 3', right: '8' },
    },
    {
      kind: 'try',
      say: 'What number makes both sides the same? 17 equals what plus 6?',
      caption: '17 = ? + 6',
      scene: { kind: 'balance', left: '17', right: '? + 6' },
      choices: ['11', '23', '12', '6'],
      answer: '11',
      hints: {
        '23': '23 plus 6 would be way more than 17! We need a number that goes with 6 to make 17.',
        '12': '12 plus 6 is 18. Just one less!',
        '6': '6 plus 6 is 12. We need to make 17.',
      },
      then: {
        say: 'Yes! 11 and 6 make 17. Both sides are the same.',
        caption: '17 = 11 + 6',
        scene: { kind: 'balance', left: '17', right: '11 + 6' },
      },
    },
    {
      kind: 'try',
      say: 'Now, 17 take away what equals 6?',
      caption: '17 − ? = 6',
      scene: { kind: 'balance', left: '17 − ?', right: '6' },
      choices: ['11', '23', '10', '6'],
      answer: '11',
      hints: {
        '23': 'Taking away makes 17 smaller, not bigger!',
        '10': '17 take away 10 leaves 7. Just one more!',
        '6': '17 take away 6 leaves 11, not 6.',
      },
      then: {
        say: 'It is 11 again! The same mystery number works both ways.',
        caption: '17 − 11 = 6',
        scene: { kind: 'balance', left: '17 − 11', right: '6' },
      },
    },
  ],
};

export const INTERACTIVE_LESSONS: Lesson[] = [
  COUNT_ON,
  HOP_BACK,
  DOUBLES,
  MAKE_TEN,
  SOME_AND_THE_REST,
  HOW_MANY_MORE,
  FEWER_THAN,
  STILL_NEEDS,
  THINK_ADDITION,
  EQUALS_MEANS_SAME,
];

// ---------------------------------------------------------------------------
// The older slide lessons, narrated
// ---------------------------------------------------------------------------

/**
 * The text slides still teach real things (tens and ones, clocks, coins), so
 * rather than leave them a second, unreadable kind of lesson they play in the
 * same player: every slide is a "watch" step whose words are spoken.
 */
function fromSlides(levelId: string): Lesson | null {
  const slides = LESSONS[levelId];
  const level = getLevelById(levelId);
  const skillId = SKILL_FOR_LEVEL.get(levelId);
  const rung = RUNG_FOR_LEVEL.get(levelId);
  if (!slides?.length || !level || !skillId || rung === undefined) return null;
  return {
    id: `read-${levelId}`,
    title: level.title,
    emoji: slides[0].emoji,
    places: [{ skillId, rung }],
    practiceLevelId: levelId,
    steps: slides.map((s) => ({
      kind: 'watch',
      say: [s.body, s.tip?.replace(/^Tip: /, '')].filter(Boolean).join(' '),
      caption: s.title,
      // Slides were written to be read; keep the words on screen for whoever is reading along.
      detail: [s.body, s.tip].filter(Boolean).join(' '),
      scene: { kind: 'big', text: s.example ?? s.emoji },
    })),
  };
}

export const SLIDE_LESSONS: Lesson[] = Object.keys(LESSONS)
  .map(fromSlides)
  .filter((l): l is Lesson => l !== null);

export const ALL_LESSONS: Lesson[] = [...INTERACTIVE_LESSONS, ...SLIDE_LESSONS];

export const LESSONS_BY_ID = new Map(ALL_LESSONS.map((l) => [l.id, l]));

/** The rung this lesson teaches in a topic, or undefined if it isn't in it. */
export function rungIn(lesson: Lesson, skillId: string): number | undefined {
  return lesson.places.find((p) => p.skillId === skillId)?.rung;
}

/** A topic's lessons up to `ceiling`, easiest first, interactive before slides at the same rung. */
export function lessonsFor(skillId: string, ceiling: number): Lesson[] {
  return ALL_LESSONS
    .filter((l) => {
      const r = rungIn(l, skillId);
      return r !== undefined && r <= ceiling;
    })
    .sort((a, b) => rungIn(a, skillId)! - rungIn(b, skillId)!);
}

/**
 * The one lesson to put in front of her for a topic.
 *
 *   1. one that teaches against the mistake she keeps making here
 *   2. otherwise the nearest one to her rung she hasn't done
 *   3. otherwise the nearest one to her rung
 */
export function recommendedLesson(
  skillId: string,
  ceiling: number,
  rung: number,
  done: Record<string, string>,
  topMistake?: ErrorTag,
): Lesson | null {
  const pool = lessonsFor(skillId, ceiling);
  if (pool.length === 0) return null;
  const distance = (l: Lesson) => Math.abs(rungIn(l, skillId)! - rung);
  const nearest = (ls: Lesson[]) => [...ls].sort((a, b) => distance(a) - distance(b))[0];

  if (topMistake) {
    const fixes = pool.filter((l) => l.helpsWith?.includes(topMistake));
    if (fixes.length) return nearest(fixes);
  }
  const fresh = pool.filter((l) => !done[l.id]);
  return nearest(fresh.length ? fresh : pool);
}

/**
 * The level "Practice it now" opens, for the topic she opened the lesson from.
 *
 * A lesson can sit in two topics — Counting On is an Adding lesson and a Number
 * Tricks one — but `practiceLevelId` names one level. Opened from the other
 * topic it sent her there anyway: out of Number Tricks into "Adding to 20",
 * crediting a ladder she was not working on. `practiceLevelId` still wins in
 * its own topic; elsewhere it is that topic's level at the lesson's rung.
 */
export function practiceLevelFor(lesson: Lesson, fromSkillId?: string | null): Level | null {
  const own = getLevelById(lesson.practiceLevelId);
  if (!fromSkillId || SKILL_FOR_LEVEL.get(lesson.practiceLevelId) === fromSkillId) return own;
  const rung = rungIn(lesson, fromSkillId);
  const ref = rung === undefined ? undefined : TOPICS_BY_ID.get(fromSkillId)?.levels.find((r) => r.rung === rung);
  return (ref && getLevelById(ref.levelId)) || own;
}

/** The lesson that teaches against one particular mistake in a topic, if there is one. */
export function lessonForMistake(skillId: string, tag: ErrorTag, ceiling: number, rung: number): Lesson | null {
  const fixes = lessonsFor(skillId, ceiling).filter((l) => l.helpsWith?.includes(tag));
  if (!fixes.length) return null;
  return fixes.sort((a, b) => Math.abs(rungIn(a, skillId)! - rung) - Math.abs(rungIn(b, skillId)! - rung))[0];
}

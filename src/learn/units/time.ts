import { Choice, Item, Lesson, ModelState, Unit } from '../types';
import { any, ask, choiceItem, doStep, mix, modelItem, numberItem, randomInt, show } from './helpers-world';

// Unit: Telling time.
//
// The clock is the manipulative from the first step: the short hand and the
// long hand are named, then they set o'clock times themselves (the minute hand
// snaps to 12), then half past (it snaps to 12 or 6). Reading comes after
// setting, and the wrong answers on every clock are the ones children give:
// the hands read the wrong way round, and the hour read from the number the
// short hand is heading to rather than the one it has passed.

type Clock = Extract<ModelState, { model: 'clock' }>;

export const clock = (hour: number, minute: number, snapMinutes?: 60 | 30): Clock =>
  ({ model: 'clock', hour, minute, ...(snapMinutes ? { snapMinutes } : {}) });

const pad = (m: number) => String(m).padStart(2, '0');
const wrap = (h: number) => ((h - 1 + 12) % 12) + 1;

/** "3:00", "3:30". */
export const timeLabel = (h: number, m: number) => `${h}:${pad(m)}`;
/** How a time is said: "3 o'clock", "half past 3". */
export const timeSaid = (h: number, m: number) => (m === 0 ? `${h} o'clock` : `half past ${h}`);

const timeChoice = (h: number, m: number, pictured = false): Choice =>
  ({ value: timeLabel(h, m), label: pictured ? '' : timeLabel(h, m), say: timeSaid(h, m), model: pictured ? clock(h, m) : undefined });

/**
 * The times a child reads off this clock by mistake, most telling first:
 * the hands swapped, the hour off by one (for half past, the next hour: the
 * number the short hand is heading to), the minute hand ignored.
 */
export function misreadings(h: number, m: number): [number, number][] {
  const out: [number, number][] = [];
  if (m === 0) {
    if (h !== 12) out.push([12, h * 5]); // long hand read as the hour, short hand as minutes
    out.push([wrap(h + 1), 0], [wrap(h - 1), 0], [h, 30]);
  } else {
    out.push([wrap(h + 1), 30], [h, 0]);
    if (h !== 12 && h !== 6) out.push([6, h * 5]);
    out.push([wrap(h - 1), 30]);
  }
  return out;
}

/** The clock is the question: what time does it show? */
function readItem(minutes: number[]) {
  return (): Item => {
    const h = randomInt(1, 12), m = any(minutes);
    return choiceItem({
      id: `clock-read-${h}-${pad(m)}`,
      say: 'What time does the clock show?',
      prompt: 'What time is it?',
      answer: timeChoice(h, m),
      wrong: misreadings(h, m).map(([a, b]) => timeChoice(a, b)),
      figure: clock(h, m),
      hint: m === 0
        ? 'The short hand tells the hour. The long hand on 12 means o\'clock.'
        : 'The long hand on 6 means half past. The hour is the number the short hand has just passed.',
    });
  };
}

/** "Which clock shows 3:30?" -- the choices are clocks. */
function whichClockItem(h: number, m: number): Item {
  return choiceItem({
    id: `clock-which-${h}-${pad(m)}`,
    say: `Which clock shows ${timeSaid(h, m)}?`,
    prompt: `Which clock shows ${timeLabel(h, m)}?`,
    answer: timeChoice(h, m, true),
    wrong: misreadings(h, m).map(([a, b]) => timeChoice(a, b, true)),
    hint: 'Check the short hand first for the hour, then the long hand.',
  });
}

const whichClock = (minutes: number[]) => (): Item => whichClockItem(randomInt(1, 12), any(minutes));

/** "Show 3:30" -- they set the clock. */
function setItem(minutes: number[], snap: 60 | 30) {
  return (): Item => {
    const h = randomInt(1, 12), m = any(minutes);
    const start = h === 12 ? clock(6, 0, snap) : clock(12, 0, snap);
    return modelItem({
      id: `clock-set-${h}-${pad(m)}`,
      say: `Show ${timeSaid(h, m)} on the clock.`,
      prompt: `Show ${timeLabel(h, m)}`,
      answer: timeLabel(h, m),
      model: start,
      solution: clock(h, m, snap),
      goal: (s) => s.hour === h && s.minute === m,
      hint: m === 0 ? 'Short hand on the hour. Long hand straight up on 12.' : 'Long hand down on 6. Short hand just past the hour.',
    });
  };
}

/** What to fix on their clock. */
const fixClock = (h: number, m: number) => (s: Clock) => {
  if (s.minute !== m) return m === 0 ? 'Move the long hand straight up to 12.' : 'Move the long hand halfway round, down to 6.';
  if (s.hour !== h) return m === 0 ? `Now the short hand: point it at ${h}.` : `Move the short hand so it has just passed ${h}.`;
  return 'Check both hands.';
};

const setStep = (h: number, m: number, from: Clock, say: string, then: string) => doStep({
  say,
  caption: timeLabel(h, m),
  model: from,
  solution: { ...from, hour: h, minute: m },
  goal: (s) => s.hour === h && s.minute === m,
  hint: fixClock(h, m),
  then,
});

// --- Lessons ------------------------------------------------------------------------

const hands: Lesson = {
  id: 'time-clock-hands',
  title: 'The clock\'s hands',
  goal: 'Know the short hour hand from the long minute hand, and read the hour from the short hand.',
  standard: '1.MD.3',
  emoji: '🕒',
  teach: [
    show('This is a clock. The numbers 1 to 12 go all the way round.', '1 to 12', clock(12, 0)),
    show('The short hand is the hour hand. It points to the hour.', 'short hand: the hour', clock(3, 0)),
    show('The long hand is the minute hand. At o\'clock it points straight up to 12.', 'long hand: on 12', clock(3, 0)),
    show('Short hand on 3, long hand on 12. It is 3 o\'clock.', '3 o\'clock', clock(3, 0)),
    show('When the long hand goes all the way round, the short hand moves on to the next number. 4 o\'clock.', '4 o\'clock', clock(4, 0)),
    setStep(5, 0, clock(12, 0, 60), 'Your turn. Move the short hand to 5. Keep the long hand on 12.',
      'Short hand on 5, long hand on 12. That is 5 o\'clock.'),
    setStep(9, 0, clock(5, 0, 60), 'Now make it 9 o\'clock.',
      'The short hand points to 9. It is 9 o\'clock.'),
  ],
  practice: () => {
    const h = randomInt(1, 12);
    return numberItem({
      id: `clock-hour-${h}`,
      say: 'Find the short hand. What o\'clock is it?',
      prompt: '? o\'clock',
      answer: h,
      figure: clock(h, 0),
      hint: 'Find the short hand and follow it to a number.',
    });
  },
};

const oclock: Lesson = {
  id: 'time-o-clock',
  title: 'O\'clock',
  goal: 'Set and read times to the hour, written as 7:00.',
  standard: '1.MD.3',
  emoji: '⏰',
  teach: [
    show('At 7 o\'clock the long hand is on 12 and the short hand is on 7.', '7 o\'clock', clock(7, 0)),
    show('We write 7 o\'clock as 7:00. The two zeros mean the long hand is right on 12.', '7:00', clock(7, 0)),
    show('At 12 o\'clock, lunch time, both hands point straight up.', '12:00', clock(12, 0)),
    show('Careful! The long hand is not the hour. The hour is always the short hand.', 'short hand = hour', clock(2, 0)),
    setStep(3, 0, clock(12, 0, 60), 'Show 3 o\'clock.', 'Short hand on 3, long hand on 12. 3:00.'),
    setStep(11, 0, clock(3, 0, 60), 'Show 11 o\'clock.', 'The short hand is on 11. It is 11:00.'),
    setStep(8, 0, clock(11, 0, 60), 'Bed time is 8 o\'clock. Show 8:00.', 'Short hand on 8, long hand on 12. 8:00.'),
  ],
  // Three buttons' worth of reading to one clock to set.
  practice: mix([3, readItem([0])], [1, setItem([0], 60)]),
  check: mix([1, readItem([0])], [1, setItem([0], 60)]),
};

const halfPast: Lesson = {
  id: 'time-half-past',
  title: 'Half past',
  goal: 'Set and read half past the hour, written as 3:30.',
  standard: '1.MD.3',
  emoji: '🕞',
  teach: [
    show('It is 3 o\'clock.', '3:00', clock(3, 0)),
    show('Now the long hand goes halfway round, down to 6. That is 30 minutes.', '30 minutes', clock(3, 30)),
    show('Look at the short hand. It moved too: halfway from 3 to 4.', 'between 3 and 4', clock(3, 30)),
    show('It is half past 3. We write 3:30.', 'half past 3 = 3:30', clock(3, 30)),
    show('The short hand is near 4, but it is not 4 yet. The hour is the number it just passed.', 'still 3', clock(3, 30)),
    setStep(3, 30, clock(3, 0, 30), 'Make it half past 3. Move the long hand halfway round.',
      'Long hand on 6, short hand just past 3. Half past 3.'),
    setStep(7, 30, clock(12, 0, 30), 'Show half past 7.',
      'The short hand is between 7 and 8, the long hand on 6. 7:30.'),
  ],
  practice: mix([3, readItem([30])], [1, setItem([30], 30)]),
  check: mix([1, readItem([30])], [1, setItem([30], 30)]),
};

const reading: Lesson = {
  id: 'time-reading',
  title: 'What time is it?',
  goal: 'Tell o\'clock from half past, reading the short hand first and then the long hand.',
  standard: '1.MD.3',
  emoji: '🕰️',
  teach: [
    show('Read a clock in two steps. First the short hand: it gives the hour. Here it is on 4.', 'short hand: 4', clock(4, 0)),
    show('Then the long hand. On 12 means o\'clock. 4 o\'clock.', '4:00', clock(4, 0)),
    show('Now the long hand is on 6. On 6 means half past. Half past 4.', '4:30', clock(4, 30)),
    show('The short hand sits between 4 and 5. Take the number it has passed: 4.', 'between 4 and 5: 4', clock(4, 30)),
    setStep(9, 30, clock(12, 0, 30), 'Show half past 9.', 'Short hand just past 9, long hand on 6. 9:30.'),
    setStep(2, 0, clock(9, 30, 30), 'Now show 2 o\'clock.', 'Short hand on 2, long hand on 12. 2:00.'),
    ask(whichClockItem(6, 30)),
  ],
  practice: mix([2, readItem([0, 30])], [2, whichClock([0, 30])], [1, setItem([0, 30], 30)]),
};

export const UNIT: Unit = {
  id: 'time',
  title: 'Telling time',
  emoji: '🕐',
  about: 'The hour hand and the minute hand, then setting and reading o\'clock and half past on a real clock.',
  colour: '#F2A900',
  lessons: [hands, oclock, halfPast, reading],
};

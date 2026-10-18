import { ErrorTag, Question } from '@/types';
import { buildTaggedChoices, randomInt } from '@/engine/choices';

// Telling time, generated rather than hand-listed, so the Clocks ladder never
// runs dry: the hand-written bank in time.ts has twelve o'clock questions, and a
// child at the top of her grade saw the same twelve faces forever. The bank and
// the levels built on it stay exactly as they are; this is what the practice
// ladder draws on.
//
// Three questions, all with a drawn face:
//   read — "What time does the clock show?"
//   hour — "It is 3:00. What time will it be in one hour?"   (clock at 3:00)
//   half — "It is 3:00. What time will it be in half an hour?" (from half past on)
//
// A time is held as minutes round a 12-hour face and every wrong answer is
// written within half a turn of the right one, so two different values can never
// print the same label (12:30 + 1 hour comes out as 1:30, never 13:30) and
// "earlier" and "later" mean what they look like on the buttons.

type ClockForm = 'read' | 'hour' | 'half';

const FACE = 12 * 60;
const QUARTERS = [0, 15, 30, 45];

const mod = (v: number) => ((v % FACE) + FACE) % FACE;
const at = (hour: number, minute: number) => mod(hour * 60 + minute);
const hourOf = (v: number) => Math.floor(mod(v) / 60) || 12;
const minuteOf = (v: number) => mod(v) % 60;

/** "3:30" — the same labels the hand-written bank uses. Never "0:30". */
const clockLabel = (v: number) => `${hourOf(v)}:${String(minuteOf(v)).padStart(2, '0')}`;

/** How a time is read aloud: "3 o'clock", "3 30" (which speech says as "three thirty"). */
const spoken = (v: number) => (minuteOf(v) === 0 ? `${hourOf(v)} o'clock` : `${hourOf(v)} ${minuteOf(v)}`);

/** The copy of `v` within half a turn of `answer`. */
function near(answer: number, v: number): number {
  let d = mod(v - answer);
  if (d > FACE / 2) d -= FACE;
  return answer + d;
}

const answerOf = (form: ClockForm, shown: number) =>
  form === 'read' ? shown : form === 'hour' ? shown + 60 : shown + 30;

/** O'clock is 1, half past 2, quarter past and quarter to 3 — the bank's own scale. */
function difficultyOf(...times: number[]): number {
  const ms = times.map(minuteOf);
  if (ms.some((m) => m === 15 || m === 45)) return 3;
  if (ms.includes(30)) return 2;
  return 1;
}

/**
 * The minutes a rebuilt card's wrong answers may use. An id cannot carry which
 * rung asked for it, and the rung only ever decided this, so a rebuilt card
 * offers the minutes its own times already involve — which is what that rung
 * meant.
 */
function minutesFor(...times: number[]): number[] {
  const d = difficultyOf(...times);
  return d === 3 ? QUARTERS : d === 2 ? [0, 30] : [0];
}

// ---------------------------------------------------------------------------
// What each wrong answer means
// ---------------------------------------------------------------------------
//
// Only three tags genuinely fit a clock: reading or counting one hour too far or
// too short ('off-by-one'), giving back the time she was told
// ('answered-a-given-number'), and going back when asked to go on
// ('wrong-operation'). Every other option is a real misreading with no tag of its
// own, and says 'unknown' rather than borrow a sentence that would tell a parent
// something untrue.

function tagFor(form: ClockForm, shown: number, v: number): ErrorTag {
  const answer = answerOf(form, shown);
  const d = near(answer, v) - answer;
  if (form === 'read') return d === 60 || d === -60 ? 'off-by-one' : 'unknown';
  const start = answer - (form === 'hour' ? 60 : 30);
  const fromStart = near(answer, v) - start;
  if (fromStart === 0) return 'answered-a-given-number';
  if (form === 'hour') {
    if (fromStart === 120) return 'off-by-one'; // counted two hours on
    if (fromStart === -60) return 'wrong-operation'; // went back an hour instead of on
    return 'unknown';
  }
  // Half an hour back from 3:00 is 2:30: she went the wrong way. Half an hour
  // back from 3:30 is 3:00, which is also what moving the long hand on without
  // moving the hour gives — two stories for one button, so neither is claimed.
  if (fromStart === -30 && minuteOf(start) < 30) return 'wrong-operation';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// The options
// ---------------------------------------------------------------------------
//
// Every option set has one of two shapes, because those are the two in which
// every button looks like every other:
//
//   a line — one minute, four hours (2:30, 3:30, 4:30, 6:30). Only the short
//            hand tells them apart.
//   a grid — two hours crossed with two minutes (3:00, 3:30, 4:00, 4:30). Every
//            option shares its hour with one other and its minute with one
//            other, so no corner stands out.
//
// The obvious set for 3:30 — 4:30, 2:30 and 3:00, each a single slip — is
// neither, and it gives itself away: the answer is the only option that shares
// its hour with one button and its minute with two others. Picking that "middle"
// option scored 58% when sets were drawn that way.

/** The minute she mixes this one up with: the 12 with the 6, the 3 with the 9. */
const pairedMinute = (m: number) => (m + 30) % 60;

/**
 * Two hours by two minutes. The other hour is one either side at even odds and
 * the other minute is the paired one, so where the answer sits in the sorted
 * options — which corner — is as likely to be any of the four.
 */
function gridOptions(answer: number): number[] {
  const dh = Math.random() < 0.5 ? 60 : -60;
  const dm = minuteOf(answer) < 30 ? 30 : -30;
  return [answer + dh, answer + dm, answer + dh + dm];
}

/**
 * Wild guesses that keep a line from becoming a run. A side made of +1, +2 and
 * +3 hours is four hours in a row with the answer at the end; +4 in place of +3
 * breaks the run without making any option stand further out than it must.
 */
const FILLERS = [120, -120, 240, -240];

/** Same-minute mistakes for a line. (Half an hour on is always a grid.) */
function lineMistakes(form: 'read' | 'hour', shown: number): number[] {
  const answer = answerOf(form, shown);
  const h = hourOf(answer), m = minuteOf(answer);
  if (form === 'hour') {
    const start = shown;
    // The time she was told; two hours on; an hour back instead of on.
    return [start, start + 120, start - 60, ...FILLERS.map((d) => answer + d)];
  }
  const c = [answer + 60, answer - 60]; // the short hand read as the next number, or the one before
  // The long hand read as the hour: at 3:00 it points at 12, so "12 o'clock".
  // Half the time only. It is one time offered against eleven answers, and
  // offered every time it was so rarely right that she could learn to skip it.
  const longHand = m === 0 ? 12 : m / 5;
  if (longHand !== h && Math.random() < 0.5) c.push(at(longHand, m));
  // The face read the wrong way round, the same mix-up as swapping :15 and
  // :45 — the short hand on 3 read as 9. Only on the hour, where the short
  // hand is exactly on a number.
  if (m === 0 && h !== 6 && h !== 12) c.push(at(12 - h, 0));
  return [...c, ...FILLERS.map((d) => answer + d)];
}

/**
 * @param form    which question
 * @param shown   the time on the drawn clock: the answer for `read`, the start otherwise
 * @param minutes the minutes any option may show — the rung's own, so the
 *                o'clock rung never offers a half past
 */
function clockQuestion(form: ClockForm, shown: number, minutes: readonly number[]): Question {
  const answer = answerOf(form, shown);
  const tag = (v: number): ErrorTag => tagFor(form, shown, v);

  // Half an hour on always moves between a minute and its pair, so its mistakes
  // are a grid by nature. The other two are a grid half the time — when the
  // rung teaches the paired minute at all: the o'clock rung only ever gets
  // lines, and is never shown a half past it has not taught.
  let built;
  if (form === 'half' || (minutes.includes(pairedMinute(minuteOf(answer))) && Math.random() < 0.5)) {
    // Exactly these three, so the builder is only asked to shuffle and label
    // them: the grid itself already balances where the answer sits.
    const options = gridOptions(answer);
    built = buildTaggedChoices(answer, options.map((v) => [v, tag(v)] as const), {
      isValid: (v) => options.includes(v),
      format: clockLabel,
    });
  } else {
    // A line: the builder picks how many go earlier and how many later, which
    // is what keeps the answer from always being the second of four.
    const sameMinute = (v: number) =>
      v - answer > -FACE / 2 && v - answer <= FACE / 2 && minuteOf(v) === minuteOf(answer);
    const candidates = lineMistakes(form, shown).map((v) => near(answer, v)).map((v) => [v, tag(v)] as const);
    built = buildTaggedChoices(answer, candidates, { step: 60, isValid: sameMinute, format: clockLabel });
  }

  // The builder tops a thin side up with whole hours and calls those wrong
  // multiples. On a clock they are hours, so say what they actually are.
  const distractorMeaning: Record<string, ErrorTag> = {};
  for (const label of Object.keys(built.distractorMeaning)) {
    distractorMeaning[label] = tag(parseLabel(label)!);
  }

  const shownHour = hourOf(shown), shownMinute = minuteOf(shown);
  return {
    id: `gclock-${form}-${shownHour}-${String(shownMinute).padStart(2, '0')}`,
    type: 'tell_time',
    prompt: form === 'read'
      ? 'What time does the clock show?'
      : `It is ${clockLabel(shown)}.\n\nWhat time will it be in ${form === 'hour' ? 'one hour' : 'half an hour'}?`,
    correctAnswer: clockLabel(answer),
    choices: built.choices,
    distractorMeaning,
    difficulty: difficultyOf(shown, answer),
    hint: hintFor(form, shown),
    speakText: form === 'read'
      ? 'What time does the clock show?'
      : `It is ${spoken(shown)}. What time will it be in ${form === 'hour' ? 'one hour' : 'half an hour'}?`,
    visual: { kind: 'clock', hour: shownHour, minute: shownMinute },
  };
}

/** How to look, never what to answer. */
function hintFor(form: ClockForm, shown: number): string {
  if (form === 'hour') {
    return 'In one hour the long hand goes all the way round and ends up back where it started. The short hand moves on to the next number.';
  }
  if (form === 'half') {
    return 'In half an hour the long hand goes halfway round the clock. If it goes past the 12, the short hand moves on to the next hour.';
  }
  switch (minuteOf(shown)) {
    case 0: return 'When the long hand points straight up at 12, it is exactly on the hour. Which number is the short hand on?';
    case 30: return 'The long hand on 6 means half past. The short hand sits between two numbers — the hour is the one it has already passed.';
    case 15: return 'The long hand on 3 means fifteen minutes past. Read the hour from the short hand.';
    default: return 'The long hand on 9 means forty-five minutes past — nearly the next hour. The hour is still the number the short hand has passed.';
  }
}

/** "3:30" → minutes round the face. */
function parseLabel(label: string): number | null {
  const m = label.match(/^([1-9]|1[0-2]):([0-5]\d)$/);
  return m ? at(+m[1], +m[2]) : null;
}

/** The rung's minutes, from `minutes: '0,30,15,45'`. Anything but a quarter is ignored. */
function parseMinutes(raw: number | string | undefined): number[] {
  const ms = String(raw ?? '0').split(',').map((s) => Number(s.trim()))
    .filter((m) => QUARTERS.includes(m));
  return ms.length ? [...new Set(ms)] : [0];
}

/**
 * One telling-time question for a ladder rung.
 *
 *   { operation: 'clock', minutes: '0' }                    o'clock
 *   { operation: 'clock', minutes: '0,30' }                 half past too
 *   { operation: 'clock', minutes: '0,30,15,45', later: 1 } quarters, and later times
 *
 * Reading the face. With `later`, one question in five also asks for the time
 * an hour later, and where the minutes allow, one in five for half an hour
 * later. Telling the time to the hour and half hour is first grade; working out
 * a later one is not, so only the quarter-hour rung, above first grade's
 * ceiling, asks it.
 */
export function generateClockQuestion(params: Record<string, number | string>): Question {
  const minutes = parseMinutes(params.minutes);
  const pick = (xs: readonly number[]) => xs[randomInt(0, xs.length - 1)];
  const hour = randomInt(1, 12);
  if (!Number(params.later)) return clockQuestion('read', at(hour, pick(minutes)), minutes);

  // Half an hour on from a minute this rung teaches, to another it teaches.
  const halfStarts = minutes.filter((m) => minutes.includes(pairedMinute(m)));
  const roll = Math.random();
  if (halfStarts.length && roll < 0.2) return clockQuestion('half', at(hour, pick(halfStarts)), minutes);
  if (roll < (halfStarts.length ? 0.4 : 0.2)) return clockQuestion('hour', at(hour, pick(minutes)), minutes);
  return clockQuestion('read', at(hour, pick(minutes)), minutes);
}

/** Exactly the ids generateClockQuestion emits: form, then the time on the clock. */
export const CLOCK_ID_PATTERN = /^gclock-(read|hour|half)-([1-9]|1[0-2])-(00|15|30|45)$/;

/** Rebuild a clock question from its SRS card id; null for anything it did not mint. */
export function clockFromId(id: string): Question | null {
  const m = id.match(CLOCK_ID_PATTERN);
  if (!m) return null;
  const form = m[1] as ClockForm;
  const shown = at(+m[2], +m[3]);
  return clockQuestion(form, shown, minutesFor(shown, answerOf(form, shown)));
}

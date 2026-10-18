import { describe, it, expect } from 'vitest';
import { generateClockQuestion, clockFromId, CLOCK_ID_PATTERN } from '@/data/clockGen';
import { ErrorTag, Question } from '@/types';

// The generated Clocks ladder. Everything here re-derives the time from what
// she is shown — the drawn hands, or the time written in the prompt — and never
// trusts `correctAnswer`. Failures are collected and asserted once, so a broken
// rule lists every question it broke on.

// The ladder's three rungs, then the first two again with later times asked,
// which no rung does today (first grade only reads the face) but the generator
// supports and the ids it rebuilds from include.
const RUNGS: { label: string; params: Record<string, string | number>; minutes: number[]; forms: string[]; maxDifficulty: number }[] = [
  { label: "o'clock", params: { operation: 'clock', minutes: '0' }, minutes: [0], forms: ['read'], maxDifficulty: 1 },
  { label: 'half past too', params: { operation: 'clock', minutes: '0,30' }, minutes: [0, 30], forms: ['read'], maxDifficulty: 2 },
  { label: 'quarter past and quarter to', params: { operation: 'clock', minutes: '0,30,15,45', later: 1 }, minutes: [0, 15, 30, 45], forms: ['half', 'hour', 'read'], maxDifficulty: 3 },
  { label: "o'clock, and later", params: { operation: 'clock', minutes: '0', later: 1 }, minutes: [0], forms: ['hour', 'read'], maxDifficulty: 1 },
  { label: 'half past, and later', params: { operation: 'clock', minutes: '0,30', later: 1 }, minutes: [0, 30], forms: ['half', 'hour', 'read'], maxDifficulty: 2 },
];

const SAMPLE = 4000;
const samples = new Map(RUNGS.map((r) => [r.label, Array.from({ length: SAMPLE }, () => generateClockQuestion({ ...r.params }))]));

// ---------------------------------------------------------------------------
// An independent reading of the clock
// ---------------------------------------------------------------------------

interface Time { h: number; m: number }

const fmt = ({ h, m }: Time) => `${h}:${m < 10 ? '0' : ''}${m}`;
const LABEL = /^([1-9]|1[0-2]):(00|15|30|45)$/;
function parse(label: string): Time {
  const match = label.match(/^(\d{1,2}):(\d\d)$/);
  if (!match) throw new Error(`"${label}" is not a clock label`);
  return { h: Number(match[1]), m: Number(match[2]) };
}
/** Move a time on (or back) by whole minutes on a 12-hour face, 12 never 0. */
function addMinutes({ h, m }: Time, minutes: number): Time {
  let total = ((h % 12) * 60 + m + minutes) % 720;
  if (total < 0) total += 720;
  const hour = Math.floor(total / 60);
  return { h: hour === 0 ? 12 : hour, m: total % 60 };
}
/** Minutes from `a` to `b` going the short way round the face: −360 < d ≤ 360. */
function minutesBetween(a: Time, b: Time): number {
  let d = ((b.h % 12) * 60 + b.m - ((a.h % 12) * 60 + a.m)) % 720;
  if (d < 0) d += 720;
  return d > 360 ? d - 720 : d;
}
const spokenTime = ({ h, m }: Time) => (m === 0 ? `${h} o'clock` : `${h} ${m}`);

type Form = 'read' | 'hour' | 'half';
interface Solved { form: Form; start: Time; answer: Time }

/** What she is asked, worked out from the prompt and the drawn clock alone. */
function solve(q: Question): Solved {
  if (q.visual?.kind !== 'clock') throw new Error(`${q.id}: no clock drawn`);
  const drawn = { h: q.visual.hour, m: q.visual.minute };
  if (q.prompt === 'What time does the clock show?') return { form: 'read', start: drawn, answer: drawn };
  const later = q.prompt.match(/^It is (\d{1,2}:\d\d)\.\n\nWhat time will it be in (one hour|half an hour)\?$/);
  if (!later) throw new Error(`${q.id}: unrecognised prompt ${JSON.stringify(q.prompt)}`);
  const start = parse(later[1]);
  // The words and the picture have to agree, or one of them is lying to her.
  if (fmt(start) !== fmt(drawn)) throw new Error(`${q.id}: prompt says ${later[1]}, clock shows ${fmt(drawn)}`);
  return later[2] === 'one hour'
    ? { form: 'hour', start, answer: addMinutes(start, 60) }
    : { form: 'half', start, answer: addMinutes(start, 30) };
}

// ---------------------------------------------------------------------------

describe.each(RUNGS)('clock rung: $label', (rung) => {
  const qs = samples.get(rung.label)!;

  it('always marks the time the clock and prompt actually give', () => {
    const bad = qs.filter((q) => q.correctAnswer !== fmt(solve(q).answer) || q.type !== 'tell_time' || q.skill !== undefined)
      .map((q) => `${q.id}: marked ${q.correctAnswer}`);
    expect(bad).toEqual([]);
  });

  it('offers 2 to 4 distinct real times, the answer exactly once', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const right = fmt(solve(q).answer);
      if (q.choices.length < 2 || q.choices.length > 4) bad.push(`${q.id}: ${q.choices.length} options`);
      if (new Set(q.choices).size !== q.choices.length) bad.push(`${q.id}: repeats ${q.choices}`);
      if (q.choices.some((c) => !LABEL.test(c))) bad.push(`${q.id}: not a time in ${q.choices}`);
      // Distinct labels are distinct times, so exactly one can be right.
      if (q.choices.filter((c) => c === right).length !== 1) bad.push(`${q.id}: ${right} not offered once`);
    }
    expect(bad).toEqual([]);
  });

  it('never goes beyond what the rung teaches — not in the question, not in a wrong answer', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const { start, answer } = solve(q);
      if (!rung.minutes.includes(start.m) || !rung.minutes.includes(answer.m)) bad.push(`${q.id}: asks ${fmt(answer)}`);
      for (const c of q.choices) if (!rung.minutes.includes(parse(c).m)) bad.push(`${q.id}: offers ${c}`);
      if (q.difficulty < 1 || q.difficulty > rung.maxDifficulty) bad.push(`${q.id}: difficulty ${q.difficulty}`);
    }
    expect(bad).toEqual([]);
  });

  it("rates difficulty on the bank's own scale: o'clock 1, half past 2, quarters 3", () => {
    const bad = qs.filter((q) => {
      const { start, answer } = solve(q);
      const ms = [start.m, answer.m];
      return q.difficulty !== (ms.some((m) => m === 15 || m === 45) ? 3 : ms.includes(30) ? 2 : 1);
    }).map((q) => `${q.id}: ${q.difficulty}`);
    expect(bad).toEqual([]);
  });

  it('asks every kind of question the rung has, and reaches every time on the face', () => {
    expect([...new Set(qs.map((q) => solve(q).form))].sort()).toEqual(rung.forms);
    // 12 hours × the rung's minutes, for each kind of question.
    expect(new Set(qs.map((q) => q.id)).size).toBe(12 * rung.minutes.length * rung.forms.length);
  });

  it('can be answered by ear, and the hint says how to look without saying the answer', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const { form, start, answer } = solve(q);
      if (!q.speakText) bad.push(`${q.id}: nothing to say`);
      if (form !== 'read') {
        // The start time is said the way she would say it, and so is the question.
        if (!q.speakText?.includes(`It is ${spokenTime(start)}.`)) bad.push(`${q.id}: says "${q.speakText}"`);
        if (!q.speakText?.includes(form === 'hour' ? 'in one hour' : 'in half an hour')) bad.push(`${q.id}: says "${q.speakText}"`);
        // The answer is never sitting in the question.
        if (q.prompt.includes(fmt(answer)) || q.speakText?.includes(spokenTime(answer))) bad.push(`${q.id}: answer in the question`);
      }
      if (!q.hint) bad.push(`${q.id}: no hint`);
      if (q.hint?.includes(fmt(answer)) || q.hint?.includes(spokenTime(answer))) bad.push(`${q.id}: hint gives ${fmt(answer)}`);
    }
    expect(bad).toEqual([]);
  });

  it('tags every wrong option with what it honestly means', () => {
    const allowed: ErrorTag[] = ['off-by-one', 'answered-a-given-number', 'wrong-operation', 'unknown'];
    const seen = new Set<ErrorTag>();
    const bad: string[] = [];
    for (const q of qs) {
      const { form, start, answer } = solve(q);
      if (!q.distractorMeaning) { bad.push(`${q.id}: no meanings`); continue; }
      if (q.distractorMeaning[q.correctAnswer] !== undefined) bad.push(`${q.id}: tagged its own answer`);
      for (const c of q.choices.filter((x) => x !== q.correctAnswer)) {
        const tag = q.distractorMeaning[c];
        const fromAnswer = minutesBetween(answer, parse(c));
        const fromStart = minutesBetween(start, parse(c));
        const say = `${q.prompt.split('\n')[0]} [${fmt(start)}→${fmt(answer)}] "${c}" is ${tag}`;
        seen.add(tag);
        if (!allowed.includes(tag)) bad.push(say);
        // Every claim, checked against the value it is attached to:
        //   off-by-one — read: the hour one too far or one short, minutes right;
        //                one hour on: two hours on.
        //   answered-a-given-number — the time she was told, and only that.
        //   wrong-operation — went back instead of on, by exactly the amount asked.
        if (tag === 'off-by-one' && !(form === 'read' ? Math.abs(fromAnswer) === 60 : form === 'hour' && fromStart === 120)) bad.push(say);
        if (tag === 'answered-a-given-number' && (form === 'read' || fromStart !== 0)) bad.push(say);
        if (tag === 'wrong-operation' && !(form === 'hour' ? fromStart === -60 : form === 'half' && fromStart === -30)) bad.push(say);
        // Half an hour back from 3:30 is 3:00, which is also "moved the long hand
        // on but not the hour" — two stories, so it must not claim either.
        if (tag === 'wrong-operation' && form === 'half' && start.m >= 30) bad.push(say);
        // And the other way round: these readings are never left unsaid.
        if (form !== 'read' && fromStart === 0 && tag !== 'answered-a-given-number') bad.push(say);
        if (form === 'read' && Math.abs(fromAnswer) === 60 && tag !== 'off-by-one') bad.push(say);
      }
    }
    expect(bad).toEqual([]);
    expect(seen.has('off-by-one')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Where the answer sits, and what shape the options make
// ---------------------------------------------------------------------------

function rankShares(qs: Question[], key: (answer: Time, t: Time) => number): number[] {
  const ranks = [0, 0, 0, 0];
  let n = 0;
  for (const q of qs) {
    if (q.choices.length !== 4) continue;
    const answer = parse(q.correctAnswer);
    const keys = q.choices.map((c) => key(answer, parse(c)));
    ranks[[...keys].sort((a, b) => a - b).indexOf(key(answer, answer))]++;
    n++;
  }
  return ranks.map((r) => r / n);
}

/** Pick the option scoring highest (or lowest), ties split evenly: how often is that the answer? */
function strategy(qs: Question[], score: (opts: Time[], i: number) => number, pick: 'max' | 'min'): number {
  let hits = 0;
  for (const q of qs) {
    const opts = q.choices.map(parse);
    const s = opts.map((_, i) => score(opts, i));
    const best = pick === 'max' ? Math.max(...s) : Math.min(...s);
    const tied = q.choices.filter((_, i) => s[i] === best);
    if (tied.includes(q.correctAnswer)) hits += 1 / tied.length;
  }
  return hits / qs.length;
}

/** How many of the other options share this one's hour, plus how many share its minutes. */
const shared = (opts: Time[], i: number) =>
  opts.filter((o, j) => j !== i && o.h === opts[i].h).length + opts.filter((o, j) => j !== i && o.m === opts[i].m).length;
/** How far this option is from all the others, round the face. */
const spread = (opts: Time[], i: number) =>
  opts.reduce((sum, o) => sum + Math.abs(minutesBetween(opts[i], o)), 0);

describe.each(RUNGS)('clock rung $label gives nothing away', (rung) => {
  const qs = samples.get(rung.label)!;

  it('puts the answer under every button equally often', () => {
    const slots = [0, 0, 0, 0];
    for (const q of qs) slots[q.choices.indexOf(q.correctAnswer)]++;
    for (const s of slots) expect(Math.abs(s / qs.length - 0.25), `slots ${slots}`).toBeLessThan(0.05);
  });

  it('does not park the answer at one rank, sorted either as read or by time', () => {
    for (const [order, key] of [
      // 1:00 first and 12:45 last, as the numbers on the buttons read.
      ['as the buttons read', (_a: Time, t: Time) => t.h * 60 + t.m],
      // Earlier and later than the answer, the way the hands go round.
      ['by time', (a: Time, t: Time) => minutesBetween(a, t)],
    ] as const) {
      const shares = rankShares(qs, key);
      const msg = `${order}: ${shares.map((s) => (s * 100).toFixed(0) + '%').join(' ')}`;
      expect(Math.max(...shares), msg).toBeLessThan(0.45);
      // "never the biggest" is as exploitable as "always the third".
      expect(Math.min(...shares), msg).toBeGreaterThan(0.08);
    }
  });

  it('gives every option the same chance within each shape of set', () => {
    // Overall rank can look fine while one shape leans: a two-by-two grid whose
    // answer is usually in the earlier hour passes the test above and still
    // pays "pick the earlier hour". So: within grids, each corner equally
    // often; within one-minute lines, each place in the line equally often.
    const corners = [0, 0, 0, 0], places = [0, 0, 0, 0];
    for (const q of qs) {
      const answer = parse(q.correctAnswer);
      const opts = q.choices.map(parse);
      const hours = [...new Set(opts.map((o) => minutesBetween(answer, { h: o.h, m: answer.m })))].sort((a, b) => a - b);
      const mins = [...new Set(opts.map((o) => o.m))].sort((a, b) => a - b);
      if (opts.length === 4 && hours.length === 2 && mins.length === 2) {
        corners[hours.indexOf(0) * 2 + mins.indexOf(answer.m)]++;
      } else if (opts.length === 4 && mins.length === 1) {
        const d = opts.map((o) => minutesBetween(answer, o)).sort((a, b) => a - b);
        places[d.indexOf(0)]++;
      } else {
        throw new Error(`${q.id}: ${q.choices} is neither a grid nor a line`);
      }
    }
    for (const [shape, counts] of [['grid corner', corners], ['place in a line', places]] as const) {
      const total = counts.reduce((a, b) => a + b, 0);
      if (total === 0) continue; // the o'clock rung has no grids
      const shares = counts.map((c) => c / total);
      const msg = `${shape}: ${shares.map((s) => (s * 100).toFixed(0) + '%').join(' ')} of ${total}`;
      expect(Math.max(...shares), msg).toBeLessThan(0.31);
      expect(Math.min(...shares), msg).toBeGreaterThan(0.19);
    }
  });

  it('rarely offers four hours in a row, or four quarter hours in a row', () => {
    // 2:30, 3:30, 4:30, 5:30 is this clock's "four consecutive integers". A
    // two-by-two grid (3:00, 3:30, 4:00, 4:30) is not: it is two hours and two
    // minutes, and every corner is equally likely to be the answer.
    let runs = 0;
    for (const q of qs) {
      const answer = parse(q.correctAnswer);
      const d = q.choices.map((c) => minutesBetween(answer, parse(c))).sort((a, b) => a - b);
      const gaps = d.slice(1).map((x, i) => x - d[i]);
      if (gaps.every((g) => g === 60) || gaps.every((g) => g === 15)) runs++;
    }
    expect(runs / qs.length).toBeLessThan(0.2);
  });

  it('cannot be answered from the shape of the options', () => {
    // The tell this generator was built around: a set of single slips (3:30
    // with 4:30, 2:30 and 3:00) makes the answer the option sharing most with
    // the others — picking it scored 58%. Each of these should do no better than
    // a guess; dropping the far-out option no better than the app's other
    // generators do (29–33%).
    const results: [string, number, number][] = [
      ['shares the most with the others', strategy(qs, shared, 'max'), 0.3],
      ['the odd one out', strategy(qs, shared, 'min'), 0.3],
      ['the most central time', strategy(qs, spread, 'min'), 0.3],
    ];
    let dropFar = 0;
    for (const q of qs) {
      const opts = q.choices.map(parse);
      const s = opts.map((_, i) => spread(opts, i));
      const far = Math.max(...s);
      const keep = s.filter((v) => v === far).length === 1 ? q.choices.filter((_, i) => s[i] !== far) : q.choices;
      if (keep.includes(q.correctAnswer)) dropFar += 1 / keep.length;
    }
    results.push(['anything but the far-out option', dropFar / qs.length, 0.35]);
    for (const [name, acc, limit] of results) {
      expect(acc, `picking ${name} scores ${(acc * 100).toFixed(0)}%`).toBeLessThan(limit);
    }
  });

  it('never offers a time she could learn to ignore', () => {
    // A button that is almost never right turns four options into three. 12:00
    // is the case to watch: the long hand read as the hour, offered against
    // eleven other answers.
    const seen = new Map<string, [number, number]>();
    for (const q of qs) {
      for (const c of q.choices) {
        const [shown, right] = seen.get(c) ?? [0, 0];
        seen.set(c, [shown + 1, right + (c === q.correctAnswer ? 1 : 0)]);
      }
    }
    const bad = [...seen].filter(([, [shown, right]]) => shown >= qs.length * 0.01 && (right / shown <= 0.12 || right / shown >= 0.4))
      .map(([label, [shown, right]]) => `${label} is right ${right} of the ${shown} times it is offered`);
    expect(bad).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

describe('clock ids', () => {
  const all = [...samples.values()].flat();

  it('matches every emitted id with CLOCK_ID_PATTERN', () => {
    expect(all.filter((q) => !CLOCK_ID_PATTERN.test(q.id)).map((q) => q.id)).toEqual([]);
  });

  it('rebuilds the same question from its id', () => {
    const bad: string[] = [];
    for (const q of all) {
      const back = clockFromId(q.id);
      if (!back) { bad.push(`${q.id}: not rebuilt`); continue; }
      const same = back.id === q.id && back.prompt === q.prompt && back.correctAnswer === q.correctAnswer
        && JSON.stringify(back.visual) === JSON.stringify(q.visual) && back.speakText === q.speakText
        && back.hint === q.hint && back.difficulty === q.difficulty && back.type === q.type
        && back.choices.includes(back.correctAnswer);
      if (!same) bad.push(`${q.id}: rebuilt differently`);
    }
    expect(bad).toEqual([]);
  });

  it('rebuilds every id there is, correctly, with options its own times justify', () => {
    const bad: string[] = [];
    let ids = 0;
    for (const form of ['read', 'hour', 'half']) {
      for (let h = 1; h <= 12; h++) {
        for (const mm of ['00', '15', '30', '45']) {
          const id = `gclock-${form}-${h}-${mm}`;
          ids++;
          if (!CLOCK_ID_PATTERN.test(id)) bad.push(`${id}: pattern refuses it`);
          for (let i = 0; i < 20; i++) {
            const q = clockFromId(id);
            if (!q) { bad.push(`${id}: not rebuilt`); break; }
            const { start, answer } = solve(q);
            if (q.correctAnswer !== fmt(answer)) bad.push(`${id}: marked ${q.correctAnswer}`);
            if (new Set(q.choices).size !== 4) bad.push(`${id}: ${q.choices}`);
            // A rebuilt card has no rung, so its options stay within the minutes
            // its own question uses: an o'clock card never sprouts a 3:30.
            const used = [start.m, answer.m];
            const allowed = used.some((m) => m === 15 || m === 45) ? [0, 15, 30, 45] : used.includes(30) ? [0, 30] : [0];
            for (const c of q.choices) if (!allowed.includes(parse(c).m)) bad.push(`${id}: offers ${c}`);
          }
        }
      }
    }
    expect(ids).toBe(144);
    expect(bad).toEqual([]);
  });

  it('refuses ids it did not mint', () => {
    for (const id of [
      '', 'gclock-', 'gclock-read', 'gclock-read-3', 'gclock-read-0-00', 'gclock-read-13-00',
      'gclock-read-03-00', 'gclock-read-3-0', 'gclock-read-3-20', 'gclock-read-3-60', 'gclock-read-3-30-x',
      'gclock-twice-3-00', 'gclock-hour--1-00', 'gclock-half-3-5', 'xgclock-read-3-00', 'time-3-30', 'GCLOCK-read-3-00',
      'gclock-read-3-30\n',
    ]) {
      expect(CLOCK_ID_PATTERN.test(id), JSON.stringify(id)).toBe(false);
      expect(clockFromId(id), JSON.stringify(id)).toBeNull();
    }
  });
});

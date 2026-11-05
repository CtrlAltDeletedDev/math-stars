import { ErrorTag } from '@/types';
import { daysAgoString } from '@/engine/dates';
import { questionFromId } from '@/engine/questionGenerator';
import { FactRecord, FactState, factState, quickMs } from '@/core/facts';
import { Grade, STAGES, TRACKS, TrackId, ceilingFor, topStage, trackOfFact } from '@/core/stages';
import { Learner, activeFocus, standingOn } from '@/core/learner';
import { COURSE, gradeAtLeast } from '@/learn/course';
import { lessonDone } from '@/learn/progress';
import { GradeCourse } from '@/learn/units';
import { Lesson, Unit } from '@/learn/types';

// What the grown-ups screen says, worked out from the learner.
//
// Pure functions only, so every number on the screen is testable. Every date
// is a local calendar day (YYYY-MM-DD from engine/dates); nothing here goes
// near toISOString, which would move an evening's play onto tomorrow.

const noon = (day: string) => new Date(`${day}T12:00:00`);
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GRADE_NAMES: Record<Grade, string> = { K: 'kindergarten', '1': '1st grade', '2': '2nd grade' };
export const NEXT_GRADE: Record<Grade, Grade | null> = { K: '1', '1': '2', '2': null };

/** `n` local days after `day`. */
export function addDays(day: string, n: number): string {
  return daysAgoString(-n, noon(day));
}

/** The last `n` local days, oldest first, ending today. */
export function lastDays(today: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => daysAgoString(n - 1 - i, noon(today)));
}

export function weekdayName(day: string): string {
  return WEEKDAYS[noon(day).getDay()];
}

/** "today", "yesterday", "on Tuesday" within the week, else "on 3 Oct". */
export function whenSaid(day: string, today: string): string {
  if (day === today) return 'today';
  if (day === addDays(today, -1)) return 'yesterday';
  if (day > addDays(today, -7) && day < today) return `on ${weekdayName(day)}`;
  const d = noon(day);
  return `on ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Thu 12 Nov", for when a focus ends. */
export function shortDate(day: string): string {
  const d = noon(day);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// --- The week ----------------------------------------------------------------

export interface WeekDay {
  day: string;
  /** M T W T F S S */
  letter: string;
  answered: number;
  right: number;
  walks: number;
}

export interface WeekStats {
  days: WeekDay[];
  daysPlayed: number;
  answered: number;
  right: number;
  /** Whole percent right first try, or null with nothing answered. */
  pctRight: number | null;
  /** The busiest day, for sizing the bars. */
  most: number;
}

export function weekStats(l: Learner, today: string): WeekStats {
  const days = lastDays(today).map((day) => {
    const r = l.days[day];
    return {
      day,
      letter: weekdayName(day).charAt(0),
      answered: r?.answered ?? 0,
      right: r?.right ?? 0,
      walks: r?.walks ?? 0,
    };
  });
  const answered = days.reduce((s, d) => s + d.answered, 0);
  const right = days.reduce((s, d) => s + d.right, 0);
  return {
    days,
    daysPlayed: days.filter((d) => d.answered > 0 || d.walks > 0).length,
    answered,
    right,
    pctRight: answered > 0 ? Math.round((right / answered) * 100) : null,
    most: Math.max(0, ...days.map((d) => d.answered)),
  };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "Today: 2 walks, 20 sums" or "Today: not played yet". */
export function todayLine(l: Learner, today: string): string {
  const r = l.days[today];
  if (!r || (r.answered === 0 && r.walks === 0)) return 'Today: not played yet';
  return `Today: ${plural(r.walks, 'walk')}, ${plural(r.answered, 'sum')}`;
}

/** The most recent day they answered anything, or null. */
export function lastPlayed(l: Learner): string | null {
  const played = Object.entries(l.days).filter(([, r]) => r.answered > 0).map(([d]) => d).sort();
  return played.length ? played[played.length - 1] : null;
}

/** Each move up in the last 7 days: the stone they reached and the day. */
export function movesThisWeek(l: Learner, today: string): { track: TrackId; to: number; day: string }[] {
  const from = addDays(today, -6);
  const out: { track: TrackId; to: number; day: string }[] = [];
  for (const t of TRACKS) {
    for (const [stone, day] of Object.entries(l.tracks[t].passed)) {
      if (day >= from && day <= today) out.push({ track: t, to: Math.min(Number(stone) + 1, topStage(t)), day });
    }
  }
  return out.sort((a, b) => (a.day === b.day ? a.to - b.to : a.day < b.day ? -1 : 1));
}

/**
 * The week in a few plain sentences, the course first, e.g.
 * "Passed 2 lessons this week: Make a ten, Counting back. Moved up to ten and
 * some more on Tuesday. 112 sums, 84% right first try."
 */
export function weekSummary(l: Learner, today: string, course: GradeCourse[] = COURSE): string {
  const lessons = lessonsSentence(l, today, course);
  const rest = practiceSummary(l, today);
  return lessons ? `${lessons} ${rest}` : rest;
}

/** The plus/minus half of the week: moves up, sums and accuracy. */
function practiceSummary(l: Learner, today: string): string {
  const w = weekStats(l, today);
  const moves = movesThisWeek(l, today);
  const parts: string[] = [];
  for (const t of TRACKS) {
    const mine = moves.filter((m) => m.track === t);
    if (!mine.length) continue;
    const last = mine.reduce((a, b) => (b.to > a.to ? b : a));
    const label = lowerFirst(STAGES[t][last.to].label);
    parts.push(mine.length === 1
      ? `to ${label} ${whenSaid(last.day, today)}`
      : `${mine.length} steps to ${label}, the last ${whenSaid(last.day, today)}`);
  }
  const moved = parts.length ? `Moved up ${parts.join(', and ')}.` : '';
  if (w.answered === 0) return moved ? `${moved} No sums yet in the last 7 days.` : 'No sums yet in the last 7 days.';
  const tally = `${plural(w.answered, 'sum')}, ${w.pctRight}% right first try.`;
  return moved ? `${moved} ${tally}` : tally;
}

// --- Where they are --------------------------------------------------------------

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Fewer timed answers than this and a "typical speed" would be noise. */
export const MIN_TIMES = 5;
/** How far back "recently" reaches for speed. */
export const RECENT_DAYS = 14;

export interface TrackReport {
  track: TrackId;
  stage: number;
  label: string;
  /** 1-based, as a grown-up counts. */
  step: number;
  /** Steps in their grade: ceilingFor + 1. */
  of: number;
  /** Stones below them, and any they were ever moved up from. */
  passed: Set<number>;
  recentRight: number;
  recentCount: number;
  /** Median ms over their recent right answers on this track's facts, or null. */
  typicalMs: number | null;
  next: { label: string; example: string } | null;
  /** At the top of their grade and earning moves the grade will not give. */
  ready: boolean;
  /** The most common recent mistake on this track, if it happened at least twice. */
  mistake: { tag: ErrorTag; count: number } | null;
}

export function trackReport(l: Learner, t: TrackId, today: string): TrackReport {
  const ts = l.tracks[t];
  const ceiling = ceilingFor(t, l.profile.grade);
  const stage = standingOn(l, t);
  const recent = ts.recent.slice(-8);
  const since = addDays(today, -(RECENT_DAYS - 1));
  const times = Object.entries(l.facts)
    .filter(([id]) => trackOfFact(id) === t)
    .flatMap(([, f]) => f.recent.filter((r) => r.day >= since).map((r) => r.ms));
  const passed = new Set([...Object.keys(ts.passed).map(Number), ...Array.from({ length: stage }, (_, i) => i)]);
  const nextStage = stage < topStage(t) ? STAGES[t][stage + 1] : null;
  const tags = new Map<ErrorTag, number>();
  for (const [id, f] of Object.entries(l.facts)) {
    if (trackOfFact(id) !== t || !f.tag || f.tag === 'unknown' || f.box > 0) continue;
    tags.set(f.tag, (tags.get(f.tag) ?? 0) + 1);
  }
  const top = [...tags.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    track: t,
    stage,
    label: STAGES[t][stage].label,
    step: stage + 1,
    of: ceiling + 1,
    passed,
    recentRight: recent.filter(Boolean).length,
    recentCount: recent.length,
    typicalMs: times.length >= MIN_TIMES ? median(times) : null,
    next: nextStage ? { label: nextStage.label, example: nextStage.example } : null,
    ready: ts.ceilingHits >= 2 && stage >= ceiling && NEXT_GRADE[l.profile.grade] !== null,
    mistake: top && top[1] >= 2 ? { tag: top[0], count: top[1] } : null,
  };
}

/** "about 3 s", "about 2.5 s". */
export function secondsText(ms: number): string {
  if (ms < 1000) return 'under 1 s';
  const s = ms / 1000;
  const r = s < 10 ? Math.round(s * 2) / 2 : Math.round(s);
  return `${r} s`;
}

const MISTAKE_WORDS: Partial<Record<ErrorTag, Record<TrackId, string>>> = {
  'wrong-operation': { plus: 'took away instead of adding', minus: 'added instead of taking away' },
  'off-by-one': { plus: 'was one out', minus: 'was one out' },
  'answered-a-given-number': { plus: 'answered with a number from the sum', minus: 'answered with a number from the sum' },
  'place-value': { plus: 'was ten out', minus: 'was ten out' },
};

/** "On 3 facts they added instead of taking away." */
export function mistakeSentence(r: TrackReport): string | null {
  if (!r.mistake) return null;
  const words = MISTAKE_WORDS[r.mistake.tag]?.[r.track];
  return words ? `On ${r.mistake.count} facts they ${words}.` : null;
}

// --- Facts -----------------------------------------------------------------------

/** The addition grid's cell: row a, column b. */
export const addCellId = (a: number, b: number) => `add-${a}+${b}`;
/** The subtraction grid's cell: row is what is taken away (b), column what it leaves (c). */
export const subCellId = (b: number, c: number) => `sub-${b + c}-${b}`;

export interface ParsedFact { a: number; b: number; op: '+' | '-'; answer: number }

export function parseFact(id: string): ParsedFact | null {
  const m = id.match(/^(add|sub)-(\d+)[+-](\d+)$/);
  if (!m) return null;
  const a = Number(m[2]);
  const b = Number(m[3]);
  const op = m[1] === 'add' ? '+' : '-';
  return { a, b, op, answer: op === '+' ? a + b : a - b };
}

/** "9 − 3", with a real minus sign. */
export function factText(id: string): string {
  const p = parseFact(id);
  return p ? `${p.a} ${p.op === '+' ? '+' : '−'} ${p.b}` : id;
}

export interface FactDetail {
  text: string;
  answer: number | null;
  state: FactState;
  seen: number;
  pctRight: number | null;
  typicalMs: number | null;
  said: string | null;
}

export function factDetail(facts: Record<string, FactRecord>, id: string, quick = quickMs(facts)): FactDetail {
  const f = facts[id];
  const p = parseFact(id);
  return {
    text: factText(id),
    answer: p ? p.answer : null,
    state: factState(f, quick),
    seen: f?.seen ?? 0,
    pctRight: f && f.seen > 0 ? Math.round((f.right / f.seen) * 100) : null,
    typicalMs: f && f.recent.length ? median(f.recent.map((r) => r.ms)) : null,
    // What they said only matters while it is still wrong; a fact they now know
    // keeps its old `said`, and showing it would be unfair.
    said: f && f.said !== undefined && f.box === 0 ? f.said : null,
  };
}

// --- Worth doing together ---------------------------------------------------------

export interface TrickyFact {
  id: string;
  track: TrackId;
  text: string;
  said: string | null;
  tag: ErrorTag | null;
  misses: number;
  seen: number;
  idea: string;
}

/** One thing to try together, from the kind of mistake they made. */
export function ideaFor(id: string, tag: ErrorTag | null | undefined): string {
  const p = parseFact(id);
  const minus = p?.op === '-';
  switch (tag) {
    case 'wrong-operation':
      return 'Point at the sign together first';
    case 'off-by-one':
      if (p && p.b >= 1 && p.b <= 3) {
        const steps = Array.from({ length: p.b }, (_, i) => (minus ? p.a - i - 1 : p.a + i + 1)).join(', ');
        return minus
          ? `Count back from ${p.a} on fingers: ${steps}`
          : `Count on from ${p.a} on fingers: ${steps}`;
      }
      return minus
        ? 'Count back on fingers, saying the start number before the first finger'
        : 'Count on with fingers, starting from the bigger number';
    case 'place-value':
      return 'Build it with tens and ones';
    case 'answered-a-given-number':
      return 'Read the whole sum aloud together before they answer';
    default:
      if (p && !minus && p.a === p.b) return 'Doubles: show it with fingers on two hands';
      if (p && !minus && (p.a === 9 || p.b === 9)) return 'Make 10 first: 9 is one away from ten';
      if (p && minus && p.a > 10 && p.answer < 10) return 'Go back to 10 first, then the rest';
      return 'Show it with small objects, then say the sum together';
  }
}

/**
 * Facts they are stuck on: under 70% right, or still learning. Most-missed
 * first, then lowest hit rate, so the top of the list is where to start.
 */
export function trickyFacts(l: Learner, n = 6): TrickyFact[] {
  const quick = quickMs(l.facts);
  return Object.entries(l.facts)
    .filter(([id, f]) => {
      if (!trackOfFact(id) || f.seen === 0) return false;
      return f.right / f.seen < 0.7 || factState(f, quick) === 'learning';
    })
    .sort(([ia, a], [ib, b]) => {
      const miss = (b.seen - b.right) - (a.seen - a.right);
      if (miss) return miss;
      const rate = a.right / a.seen - b.right / b.seen;
      return rate || (ia < ib ? -1 : 1);
    })
    .slice(0, n)
    .map(([id, f]) => ({
      id,
      track: trackOfFact(id)!,
      text: factText(id),
      said: f.said ?? null,
      tag: f.tag ?? null,
      misses: f.seen - f.right,
      seen: f.seen,
      idea: ideaFor(id, f.tag),
    }));
}

// --- Worksheet --------------------------------------------------------------------

export interface WorksheetItem extends ParsedFact { id: string; tricky: boolean }

function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Twenty sums for the fridge: their tricky facts (up to half), the rest from the
 * stone they are on in each track -- or this week's pick, if a grown-up made one.
 */
export function worksheet(l: Learner, today: string, count = 20, rnd: () => number = Math.random): WorksheetItem[] {
  const seen = new Set<string>();
  const out: WorksheetItem[] = [];
  const push = (id: string, tricky: boolean) => {
    if (seen.has(id)) return false;
    const q = questionFromId(id);
    const p = parseFact(id);
    if (!q || !p || Number(q.correctAnswer) !== p.answer) return false;
    seen.add(id);
    out.push({ id, tricky, ...p });
    return true;
  };
  for (const t of trickyFacts(l, Math.floor(count / 2))) push(t.id, true);

  const focus = activeFocus(l, today);
  const stageOf = (t: TrackId) => (focus?.track === t ? focus.stage : standingOn(l, t));
  let turn = 0;
  for (let tries = 0; out.length < count && tries < 400; tries++) {
    const t = TRACKS[turn % TRACKS.length];
    if (push(STAGES[t][stageOf(t)].make().id, false)) turn++;
    // A small stone (+1 within 5) can run out of new sums; let the other track
    // fill in rather than loop forever.
    else if (tries % 25 === 24) turn++;
  }
  return shuffle(out, rnd);
}

/** The backup file's name, by local date. */
export const backupFileName = (today: string) => `math-stars-backup-${today}.json`;

// --- Their course -------------------------------------------------------------------
//
// Lessons, by unit, by grade. "Done" is `lessonDone`: they passed the check, or
// their plus/minus path already put them past it. The second kind has no record,
// so it reads "already knew this" rather than a date they never had.
// Every function takes the course so tests can hand it a fixture; units with
// no lessons yet are left out, so a unit still being written never shows as 0 of 0.

export type LessonStatus =
  | { kind: 'passed'; on: string }
  /** Known without passing its own check: found in placement, or below their plus/minus path. */
  | { kind: 'placed'; how: 'placement' | 'path'; on?: string }
  | { kind: 'started' }
  | { kind: 'new' };

export interface LessonRow {
  lesson: Lesson;
  status: LessonStatus;
  tries: number;
  /** Best check score as a whole percent, or null before their first check. */
  best: number | null;
}

export interface UnitRow {
  unit: Unit;
  lessons: LessonRow[];
  done: number;
  total: number;
}

export interface GradeRow {
  grade: Grade;
  title: string;
  units: UnitRow[];
  done: number;
  total: number;
  /** Where they are against this grade: below their setting, theirs, or ahead of it. */
  place: 'earlier' | 'current' | 'ahead';
}

export function lessonRow(l: Learner, lesson: Lesson): LessonRow {
  const r = l.lessons[lesson.id];
  const tries = r?.tries ?? 0;
  const best = r && tries > 0 ? Math.round(r.best * 100) : null;
  let status: LessonStatus;
  if (r?.done && r.placed) status = { kind: 'placed', how: 'placement', on: r.done };
  else if (r?.done) status = { kind: 'passed', on: r.done };
  else if (lessonDone(l, lesson)) status = { kind: 'placed', how: 'path' };
  else if (r) status = { kind: 'started' };
  else status = { kind: 'new' };
  return { lesson, status, tries, best };
}

const isDone = (r: LessonRow) => r.status.kind === 'passed' || r.status.kind === 'placed';

export function courseReport(l: Learner, course: GradeCourse[] = COURSE): GradeRow[] {
  const current = l.profile.grade;
  return course.map((g) => {
    const units = g.units
      .filter((u) => u.lessons.length > 0)
      .map((unit) => {
        const lessons = unit.lessons.map((lesson) => lessonRow(l, lesson));
        return { unit, lessons, done: lessons.filter(isDone).length, total: lessons.length };
      });
    return {
      grade: g.grade,
      title: g.title,
      units,
      done: units.reduce((s, u) => s + u.done, 0),
      total: units.reduce((s, u) => s + u.total, 0),
      place: g.grade === current ? 'current' : gradeAtLeast(g.grade, current) ? 'ahead' : 'earlier',
    };
  });
}

/** "Mostly done" for suggesting the next grade: four lessons in five. */
export const MOSTLY_DONE = 0.8;

/** The grade to suggest moving them to, when their own grade's lessons are mostly done. */
export function suggestNextGrade(l: Learner, course: GradeCourse[] = COURSE): Grade | null {
  const next = NEXT_GRADE[l.profile.grade];
  const mine = courseReport(l, course).find((g) => g.place === 'current');
  if (!next || !mine || mine.total === 0) return null;
  return mine.done / mine.total >= MOSTLY_DONE ? next : null;
}

/** The unit a lesson belongs to in this course. */
export function unitInCourse(lessonId: string, course: GradeCourse[] = COURSE): { unit: Unit; grade: GradeCourse } | null {
  for (const grade of course) for (const unit of grade.units) {
    if (unit.lessons.some((x) => x.id === lessonId)) return { unit, grade };
  }
  return null;
}

/** Lessons whose check they passed in the last 7 days, oldest first. */
export function lessonsPassedThisWeek(l: Learner, today: string, course: GradeCourse[] = COURSE): Lesson[] {
  const from = addDays(today, -6);
  const all = course.flatMap((g) => g.units.flatMap((u) => u.lessons));
  const order = new Map(all.map((x, i) => [x.id, i]));
  return Object.entries(l.lessons)
    .filter(([id, r]) => r.done && r.done >= from && r.done <= today && order.has(id))
    // By day, then in course order for lessons passed the same day.
    .sort(([a, ra], [b, rb]) => (ra.done === rb.done ? order.get(a)! - order.get(b)! : ra.done! < rb.done! ? -1 : 1))
    .map(([id]) => all[order.get(id)!]);
}

/** "Passed 2 lessons this week: Make a ten, Counting back." or null. */
export function lessonsSentence(l: Learner, today: string, course: GradeCourse[] = COURSE): string | null {
  const done = lessonsPassedThisWeek(l, today, course);
  if (!done.length) return null;
  const SHOW = 3;
  const titles = done.slice(0, SHOW).map((x) => x.title);
  // "More, fewer, the same" is one title: keep the list readable around it.
  const names = titles.join(titles.some((t) => t.includes(',')) ? '; ' : ', ');
  const more = done.length > SHOW ? ` and ${done.length - SHOW} more` : '';
  return `Passed ${plural(done.length, 'lesson')} this week: ${names}${more}.`;
}

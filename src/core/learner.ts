import { ErrorTag } from '@/types';
import { daysAgoString, todayString } from '@/engine/dates';
import { FactRecord, recordFact } from './facts';
import { Grade, TRACKS, TrackId, ceilingFor, topStage, trackOfFact } from './stages';
import { Move, TrackState, newTrack, standing, stepTrack } from './track';

// Everything the app knows about her, in one place.
//
// The old save kept three overlapping records of the same maths (levels,
// ladders, SRS cards) and a dozen fields for a reward economy. This is one:
// where she stands on each track, how well she knows each fact, what she did
// each day, and her settings. Pure functions only -- no React, no storage --
// so all of it is testable and the screens just render it.

export const LEARNER_SCHEMA = 1;

export interface Profile {
  /** Her name, for the grown-ups screen. Empty until a grown-up sets it. */
  name: string;
  characterId: string | null;
  grade: Grade;
  readAloud: boolean;
  sound: boolean;
  /** Sums in one walk. */
  walkLength: 10 | 20;
  /** The ten-frame picture: fades as she gets steady, always on, or never. */
  pictures: 'auto' | 'always' | 'off';
  /** Four digits, set by a grown-up the first time they open the grown-ups screen. */
  pin: string | null;
  /** Walks that make today's sun full. */
  dailyWalks: number;
}

export interface DayRecord {
  answered: number;
  right: number;
  walks: number;
}

/** A grown-up's "this week, work on…": one stone of one track, until a day. */
export interface Focus {
  track: TrackId;
  stage: number;
  until: string;
}

/** How a lesson went. Sparse: an entry exists once she has started it. */
export interface LessonRecord {
  /** Times she has reached the check. */
  tries: number;
  /** Her best check score, 0..1. */
  best: number;
  /** The day she first passed the check; null until then. */
  done: string | null;
  /** The last day she worked on it. */
  last: string;
}

export interface Learner {
  schema: typeof LEARNER_SCHEMA;
  profile: Profile;
  /** The course: how each lesson she has started went. See src/learn/progress.ts. */
  lessons: Record<string, LessonRecord>;
  /** A grown-up's pick for today's lesson, until she passes it. */
  pinnedLesson: string | null;
  tracks: Record<TrackId, TrackState>;
  facts: Record<string, FactRecord>;
  days: Record<string, DayRecord>;
  focus: Focus | null;
  streak: { current: number; best: number; last: string };
  /** The old save's version, if she came from one. For support, not logic. */
  migratedFrom: number | null;
}

export function newLearner(): Learner {
  return {
    schema: LEARNER_SCHEMA,
    profile: {
      name: '', characterId: null, grade: '1', readAloud: true, sound: true,
      walkLength: 10, pictures: 'auto', pin: null, dailyWalks: 3,
    },
    lessons: {},
    pinnedLesson: null,
    tracks: { plus: newTrack(), minus: newTrack() },
    facts: {},
    days: {},
    focus: null,
    streak: { current: 0, best: 0, last: '' },
    migratedFrom: null,
  };
}

export function standingOn(l: Learner, track: TrackId): number {
  return standing(l.tracks[track], ceilingFor(track, l.profile.grade));
}

/** The grown-up's pick, if it is still this week's. */
export function activeFocus(l: Learner, today = todayString()): Focus | null {
  return l.focus && l.focus.until >= today ? l.focus : null;
}

export type ItemKind = 'fresh' | 'warmup' | 'review' | 'retry' | 'focus';

export interface Outcome {
  track: TrackId;
  /** The stone it came from; null for a review. */
  stage: number | null;
  factId: string;
  /** Right on the first try. What is recorded, whatever she saw. */
  correct: boolean;
  typed?: string;
  tag?: ErrorTag;
  ms?: number;
}

export interface AnswerEvent {
  move: Move;
  track: TrackId;
  from: number;
  to: number;
}

const DAYS_KEPT = 120;

function prune(days: Record<string, DayRecord>, today: string): Record<string, DayRecord> {
  const oldest = daysAgoString(DAYS_KEPT, new Date(`${today}T12:00:00`));
  return Object.fromEntries(Object.entries(days).filter(([d]) => d >= oldest));
}

export function bumpStreak(s: Learner['streak'], today: string): Learner['streak'] {
  if (s.last === today) return s;
  const yesterday = daysAgoString(1, new Date(`${today}T12:00:00`));
  const current = s.last === yesterday ? s.current + 1 : 1;
  return { current, best: Math.max(s.best, current), last: today };
}

/** Fold one answer in. Returns the new learner and whether a track moved. */
export function applyAnswer(l: Learner, o: Outcome, now = Date.now()): { learner: Learner; event: AnswerEvent } {
  const day = todayString(new Date(now));
  const before = l.tracks[o.track];
  const ceiling = ceilingFor(o.track, l.profile.grade);
  const { state, move } = stepTrack(before, {
    correct: o.correct, served: o.stage, ceiling, top: topStage(o.track), day,
  });
  const factTrack = trackOfFact(o.factId);
  const facts = factTrack
    ? { ...l.facts, [o.factId]: recordFact(l.facts[o.factId], { correct: o.correct, ms: o.ms, typed: o.typed, tag: o.tag, now, day }) }
    : l.facts;
  const today = l.days[day] ?? { answered: 0, right: 0, walks: 0 };
  return {
    learner: {
      ...l,
      tracks: { ...l.tracks, [o.track]: state },
      facts,
      days: prune({ ...l.days, [day]: { ...today, answered: today.answered + 1, right: today.right + (o.correct ? 1 : 0) } }, day),
      streak: bumpStreak(l.streak, day),
    },
    event: { move, track: o.track, from: standing(before, ceiling), to: standing(state, ceiling) },
  };
}

export function completeWalk(l: Learner, now = Date.now()): Learner {
  const day = todayString(new Date(now));
  const today = l.days[day] ?? { answered: 0, right: 0, walks: 0 };
  return { ...l, days: { ...l.days, [day]: { ...today, walks: today.walks + 1 } } };
}

/** Today's walks against the goal, 0..1, for the sun. Never more than full. */
export function sunToday(l: Learner, today = todayString()): number {
  const walks = l.days[today]?.walks ?? 0;
  return Math.min(1, walks / Math.max(1, l.profile.dailyWalks));
}

/** Both tracks' stones, for the path: which she has moved up from. */
export function passedStones(l: Learner): Record<TrackId, Set<number>> {
  const out = {} as Record<TrackId, Set<number>>;
  for (const t of TRACKS) {
    const here = standingOn(l, t);
    // Everything below where she stands counts as passed, even a stone she was
    // placed above by migration and so never "moved up from" here.
    out[t] = new Set([...Object.keys(l.tracks[t].passed).map(Number), ...Array.from({ length: here }, (_, i) => i)]);
  }
  return out;
}

import { ErrorTag } from '@/types';

// Every fact they meet, one record each.
//
// The old app knew how they were doing on a *rung* ("Adding within 10", about 36
// facts in one bucket) and could not say that 4 + 4 is fine while 6 + 7 is not.
// A fact record can. It drives two things:
//
//   review   a Leitner box. Right first try moves it up a box and further out;
//            wrong drops it to box 0, due straight away. Due facts come back
//            as reviews in later walks.
//   the grid what the grown-ups see: not met, learning, getting there, knows it.
//
// Speed is used silently. They never see a clock. "Knows it" means right and
// quick -- quick for *them*, measured against how long they take on the facts
// they certainly know (+1, +0) -- on more than one day. A slow right answer is
// never wrong; it just keeps the fact in rotation.

export interface FactRecord {
  seen: number;
  right: number;
  /** Leitner box, 0..5. */
  box: number;
  /** When it is next due for review, epoch ms. */
  due: number;
  /** Their last few right first-try answers: the day and how long it took. */
  recent: { day: string; ms: number }[];
  /** What they typed the last time they got it wrong, for the grown-ups. */
  said?: string;
  tag?: ErrorTag;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days until the next review, by box. */
export const BOX_DAYS = [0, 1, 2, 4, 8, 16] as const;
export const TOP_BOX = BOX_DAYS.length - 1;
const RECENT = 3;
/** Longer than this is a child who wandered off, not a slow answer. */
export const MAX_ANSWER_MS = 60_000;

export function newFact(): FactRecord {
  return { seen: 0, right: 0, box: 0, due: 0, recent: [] };
}

export interface FactAnswer {
  correct: boolean;
  ms?: number;
  typed?: string;
  tag?: ErrorTag;
  now: number;
  day: string;
}

export function recordFact(prev: FactRecord | undefined, a: FactAnswer): FactRecord {
  const f = prev ?? newFact();
  if (!a.correct) {
    return { ...f, seen: f.seen + 1, box: 0, due: a.now, said: a.typed, tag: a.tag };
  }
  const box = Math.min(TOP_BOX, f.box + 1);
  const usable = typeof a.ms === 'number' && Number.isFinite(a.ms) && a.ms > 0 && a.ms <= MAX_ANSWER_MS;
  return {
    ...f,
    seen: f.seen + 1,
    right: f.right + 1,
    box,
    due: a.now + BOX_DAYS[box] * DAY_MS,
    recent: usable ? [...f.recent, { day: a.day, ms: Math.round(a.ms!) }].slice(-RECENT) : f.recent,
  };
}

/** Is a fact one they certainly know, whose time measures only how fast they tap? */
function isBaselineFact(id: string): boolean {
  const m = id.match(/^(add|sub)-(\d+)[+-](\d+)$/);
  if (!m) return false;
  const [, op, a, b] = m;
  if (op === 'add') return Number(a) <= 1 || Number(b) <= 1;
  return Number(b) <= 1;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * How long counts as quick, for them. Their typical time on +0/+1 facts is how
 * long it takes them to read and tap; two seconds on top of that is recall,
 * not counting. Clamped, and a sensible default until there are a few.
 */
export function quickMs(facts: Record<string, FactRecord>): number {
  const times = Object.entries(facts)
    .filter(([id]) => isBaselineFact(id))
    .flatMap(([, f]) => f.recent.map((r) => r.ms));
  const base = times.length >= 3 ? median(times) : 2500;
  return Math.max(3000, Math.min(7000, base + 2000));
}

export type FactState = 'new' | 'learning' | 'slow' | 'fast';

export function factState(f: FactRecord | undefined, quick: number): FactState {
  if (!f || f.seen === 0) return 'new';
  if (f.box === 0 || f.right / f.seen < 0.6) return 'learning';
  const fast = f.recent.filter((r) => r.ms <= quick);
  const days = new Set(fast.map((r) => r.day));
  return fast.length >= 2 && days.size >= 2 ? 'fast' : 'slow';
}

export function isDue(f: FactRecord, now: number): boolean {
  return f.seen > 0 && f.due <= now;
}

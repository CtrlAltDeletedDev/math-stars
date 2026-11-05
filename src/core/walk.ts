import { Question } from '@/types';
import { questionFromId } from '@/engine/questionGenerator';
import { shuffle } from '@/engine/choices';
import { isDue } from './facts';
import { ItemKind, Learner, activeFocus, standingOn } from './learner';
import { STAGES, TRACKS, TrackId, trackOfFact } from './stages';

// One walk: a short run of plain sums.
//
// Plus and minus take turns in shuffled blocks of four, two of each, so they
// have to read the sign rather than follow a pattern. Most sums come from the
// stone they stand on; every fourth is a look back -- a fact that is due for
// review, or failing that a warm-up from one of the last few stones they passed
// -- so what they learned last week keeps coming up. A miss comes back three
// sums later, while the fix is fresh.
//
// A grown-up's "this week" pick takes the walk over: every turn goes to that
// stone on that track, with the look-backs kept.

export interface WalkItem {
  question: Question;
  track: TrackId;
  /** The stone it came from; null for a review. */
  stage: number | null;
  kind: ItemKind;
}

const LOOK_BACK_EVERY = 4;
const RETRY_GAP = 3;
const WARMUP_REACH = 3;
const AVOID_REPEATS = 8;

export function turnPlan(length: number, rng: () => number = Math.random): TrackId[] {
  const plan: TrackId[] = [];
  while (plan.length < length) plan.push(...shuffleWith<TrackId>(['plus', 'plus', 'minus', 'minus'], rng));
  return plan.slice(0, length);
}

function shuffleWith<T>(xs: T[], rng: () => number): T[] {
  if (rng === Math.random) return shuffle(xs);
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Walk {
  private slot = 0;
  private plan: TrackId[];
  private retries: { at: number; item: WalkItem }[] = [];
  private seen: string[] = [];

  constructor(
    private learner: Learner,
    readonly length: number = learner.profile.walkLength,
    private rng: () => number = Math.random,
    private now: () => number = Date.now,
  ) {
    const focus = activeFocus(learner);
    this.plan = focus ? Array(length).fill(focus.track) : turnPlan(length, rng);
  }

  /** Keep the walk's view of their current as they move up mid-walk. */
  sync(learner: Learner) {
    this.learner = learner;
  }

  get done(): number {
    return this.slot;
  }

  /** A miss comes back a few sums later, if the walk is long enough. */
  missed(item: WalkItem) {
    const at = this.slot + RETRY_GAP - 1;
    if (at < this.length) this.retries.push({ at, item: { ...item, kind: 'retry' } });
  }

  next(): WalkItem | null {
    if (this.slot >= this.length) return null;
    const slot = this.slot++;
    const item = this.pick(slot);
    this.seen = [...this.seen, item.question.id].slice(-AVOID_REPEATS);
    return item;
  }

  private pick(slot: number): WalkItem {
    const r = this.retries.findIndex((x) => x.at <= slot);
    if (r >= 0) return this.retries.splice(r, 1)[0].item;

    const track = this.plan[slot];
    const focus = activeFocus(this.learner);
    const here = standingOn(this.learner, track);

    if (slot % LOOK_BACK_EVERY === LOOK_BACK_EVERY - 1) {
      // A due fact from this turn's track, else the other's: a review that
      // waited for its own track's look-back could miss a whole walk.
      for (const t of [track, ...TRACKS.filter((x) => x !== track)]) {
        const review = this.dueReview(t);
        if (review) return { question: review, track: t, stage: null, kind: 'review' };
      }
      // No warm-ups while a track is still placing them: those turns are better
      // spent finding where they are.
      const placing = this.learner.tracks[track].demotions === 0;
      const back = placing ? null : warmupStage(here, this.rng);
      if (back !== null) return { question: this.fresh(track, back), track, stage: back, kind: 'warmup' };
    }

    if (focus && focus.track === track) {
      return { question: this.fresh(track, focus.stage), track, stage: focus.stage, kind: 'focus' };
    }
    return { question: this.fresh(track, here), track, stage: here, kind: 'fresh' };
  }

  /** A sum from a stone they have not just been asked, if a few tries can find one. */
  private fresh(track: TrackId, stage: number): Question {
    const make = STAGES[track][Math.min(stage, STAGES[track].length - 1)].make;
    let q = make();
    for (let i = 0; i < 8 && this.seen.includes(q.id); i++) q = make();
    return q;
  }

  private dueReview(track: TrackId): Question | null {
    const now = this.now();
    const due = Object.entries(this.learner.facts)
      .filter(([id, f]) => trackOfFact(id) === track && isDue(f, now) && !this.seen.includes(id))
      .sort((a, b) => a[1].due - b[1].due);
    for (const [id] of due) {
      const q = questionFromId(id);
      if (q) return q;
    }
    return null;
  }
}

/** One of the last few stones below where they stand; none on the first. */
export function warmupStage(here: number, rng: () => number = Math.random): number | null {
  if (here <= 0) return null;
  const low = Math.max(0, here - WARMUP_REACH);
  return low + Math.floor(rng() * (here - low));
}

export { TRACKS };

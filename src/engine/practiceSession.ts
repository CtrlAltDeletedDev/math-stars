import { Question, SkillState, UserProgress } from '@/types';
import { SKILLS_BY_ID, Skill, questionForRung, unlockedSkillIds } from '@/data/skills';
import { ceilingFor, isInGrade } from '@/data/grades';
import { newSkillState } from './skillLadder';
import { questionFromId } from './questionGenerator';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { TOPICS, skillForQuestion } from '@/data/topics';
import { isDue } from './srs';
import { shuffle, shuffleChoices } from './choices';
import { sameness } from './sessionBuilder';

// Picking the next question in endless practice.
//
// Three things compete for each slot, in priority order:
//   1. a question she got wrong earlier *in this same session* (requeued a few
//      questions later, while the correction is still fresh)
//   2. a question the spaced-repetition engine says is due
//   3. a fresh question at her current rung, on the topic whose turn it is
//
// Play runs in rounds of ten on a few topics (see chooseRoundSkills), so that
// something can actually move within one sitting.

export interface PracticePick {
  question: Question;
  skillId: string | null; // null for an SRS review question
  /**
   * The rung this was served from, so the ladder can tell evidence about her
   * current rung from evidence about some other one. Null for an SRS review,
   * which is deliberately drawn from wherever she has been struggling and so
   * says nothing about where she is standing now.
   */
  rung: number | null;
}

/** A wrong answer comes back this many questions later. */
const REQUEUE_GAP = 4;

/** A fresh question does not repeat one from this many questions back, if it can help it. */
const RECENT_LOOKS = 10;

/** Questions in one round of Play: one card's worth, and half the daily goal. */
export const ROUND_SIZE = 10;

/** Topics one round concentrates on. */
const ROUND_TOPICS = 3;

const TEACHING_ORDER = new Map(TOPICS.map((t, i) => [t.id, i]));

/**
 * The order a round asks its topics in.
 *
 * A round of three asks its two main topics four times each and the extra one
 * twice, interleaved: A B A B C A B A B C. Four is what the fast lane needs and
 * half of what the ordinary window needs, so a topic she is climbing can move
 * within one round; picked at random instead, three topics split ten questions
 * about 3-3-3 and a round would often end with nothing moved. A round of one
 * or two topics simply takes turns.
 */
export function roundPlan(round: readonly string[]): string[] {
  if (round.length === 3) {
    const [a, b, c] = round;
    return [a, b, a, b, c, a, b, a, b, c];
  }
  return [...round];
}

function weightedPick(ids: string[], weight: (id: string) => number): string | undefined {
  const weights = ids.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  if (ids.length === 0 || total <= 0) return undefined;
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

/**
 * The topics one round of Play concentrates on.
 *
 * Play used to spread every question across every topic in her grade — about
 * 1 in 16 each in first grade — so a promotion, which needs 8 answers at one
 * rung, took a week of play to come round on any one topic and a round never
 * felt like it went anywhere. Now a round is mostly about two topics:
 *
 *   1–2  topics she has started and can still climb, the ones nearest their
 *        next step most likely; or, until she has started two, the next topics
 *        in teaching order (TOPICS), so a new player begins with adding
 *   3    one more from anywhere in her grade, for variety, to introduce
 *        something new now and then, and to keep topics she has topped out on
 *        from going stale
 *
 * Last round's topics are weighted down, so rounds rotate rather than repeat.
 * Only topics in her grade take the first two slots. Due reviews and requeued
 * misses still come from anywhere (see `next`).
 */
export function chooseRoundSkills(
  progress: UserProgress,
  pool: string[],
  previous: readonly string[] = [],
  n = ROUND_TOPICS,
  /** Topics that must lead the round, e.g. the one whose lesson she just watched. */
  lead: readonly string[] = [],
): string[] {
  if (pool.length <= n) {
    const first = lead.filter((id) => pool.includes(id));
    return [...first, ...pool.filter((id) => !first.includes(id))];
  }
  const grade = progress.gradeLevel;
  const state = (id: string) => progress.skills?.[id];
  const started = (id: string) => (state(id)?.attempts ?? 0) > 0;
  const climbing = (id: string) => {
    const ceiling = ceilingFor(id, grade);
    return Math.min(state(id)?.rung ?? 0, ceiling) < ceiling;
  };
  const hits = (id: string) => state(id)?.recent.filter(Boolean).length ?? 0;
  const rotated = (id: string) => (previous.includes(id) ? 0.25 : 1);

  // A topic kept only because she started it before her grade moved (see
  // unlockedSkillIds) may still turn up for variety, but never takes a main
  // slot: its ceiling is the ladder's top, so it would always look climbable.
  const inGrade = (id: string) => isInGrade(id, grade);

  const chosen = lead.filter((id) => pool.includes(id)).slice(0, n - 1);
  const left = () => pool.filter((id) => !chosen.includes(id));
  const take = (id: string | undefined) => { if (id) chosen.push(id); };

  while (chosen.length < n - 1) {
    const before = chosen.length;
    take(weightedPick(left().filter((id) => inGrade(id) && started(id) && climbing(id)), (id) => (1 + hits(id)) * rotated(id)));
    if (chosen.length === before) break;
  }
  while (chosen.length < n - 1 && left().length > 0) {
    const order = (id: string) => TEACHING_ORDER.get(id) ?? Number.MAX_SAFE_INTEGER;
    const unstarted = left().filter((id) => inGrade(id) && !started(id)).sort((a, b) => order(a) - order(b));
    const inGradeLeft = left().filter(inGrade);
    take(unstarted[0] ?? weightedPick(inGradeLeft.length > 0 ? inGradeLeft : left(), rotated));
  }
  take(weightedPick(left(), rotated));
  return chosen;
}

export class PracticeQueue {
  private requeue: { at: number; question: Question; skillId: string | null; rung: number | null }[] = [];
  private asked = 0;
  private round: string[] = [];
  /** The round's turns, slot by slot, when the queue chose the round itself. */
  private plan: string[] | null = null;
  private picksThisRound = 0;
  /** Whose turn it is in a round a topic screen or Focus Mode chose. Kept across rounds. */
  private turn = 0;
  /** What the last few questions looked like, whatever their ids (see `sameness`). */
  private recent: string[] = [];

  constructor(
    private progress: UserProgress,
    private characterName = 'You',
    /**
     * One topic to stay on for this session — set when she arrives from a
     * topic screen's Play button. Outranks the parent's Focus Mode, because it
     * is the more specific and more recent intent.
     */
    private sessionSkill: string | null = null,
    private roundSize = ROUND_SIZE,
    /** A topic to lead the first round with: the one whose lesson she just watched. */
    lead: string | null = null,
  ) {
    this.startRound(lead);
  }

  /**
   * Begin a new round, choosing what it concentrates on. The screen calls this
   * from its "Keep going" button; the queue also starts one by itself once a
   * round's worth of questions is used up, so it can never get stuck on one.
   */
  startRound(lead: string | null = null) {
    const pool = this.skillPool();
    const narrowed = this.sessionSkill || (this.progress.practiceFocus ?? []).some((id) => SKILLS_BY_ID.has(id));
    // A topic screen's Play and a parent's Focus Mode have already said what to
    // practise, so those rounds simply take turns through it, carrying on where
    // the last round stopped: starting each round from the top of a Focus Mode
    // list would ask its first few topics every round and never reach the rest.
    // Only the open "everything in her grade" pool is narrowed and planned here.
    if (narrowed) {
      this.round = pool;
      this.plan = null;
    } else {
      this.round = chooseRoundSkills(this.progress, pool, this.round, ROUND_TOPICS, lead ? [lead] : []);
      this.plan = roundPlan(this.round);
    }
    this.picksThisRound = 0;
  }

  /** What this round concentrates on, for the card at its end. */
  roundSkills(): string[] {
    return [...this.round];
  }

  /**
   * Skills practice may draw from: a parent's Focus Mode picks if there are
   * any, otherwise whatever the tiers have unlocked.
   *
   * This used to return every skill unconditionally, which is why a brand-new
   * player met fractions and the times tables in her first session.
   */
  private skillPool(): string[] {
    if (this.sessionSkill && SKILLS_BY_ID.has(this.sessionSkill)) return [this.sessionSkill];
    const focus = (this.progress.practiceFocus ?? []).filter((id) => SKILLS_BY_ID.has(id));
    if (focus.length > 0) return focus;
    return unlockedSkillIds(this.progress.skills, this.progress.gradeLevel);
  }

  private stateFor(skillId: string): SkillState {
    return this.progress.skills?.[skillId] ?? newSkillState(skillId);
  }

  /** The topic whose turn this slot of the round is. */
  private turnFor(slot: number): string | undefined {
    if (this.plan) return this.plan[slot % this.plan.length];
    const turns = this.round.length > 0 ? this.round : this.skillPool();
    return turns[this.turn % turns.length];
  }

  /**
   * The topic whose turns a requeued miss or a review may take, or null if
   * they may take any.
   *
   * In a round the queue planned, only the variety topic gives up its turns,
   * so the two main topics always get their four questions whatever else is
   * due. A miss on a main topic comes back in that topic's own turn instead:
   * it was asked at that rung already, so it costs the topic nothing. Rounds
   * that just take turns have no such slot and can be interrupted anywhere.
   */
  private variety(): string | null {
    return this.plan && this.round.length === ROUND_TOPICS ? this.round[ROUND_TOPICS - 1] : null;
  }

  private dueReview(): Question | null {
    const due = Object.values(this.progress.srsCards ?? {})
      .filter(isDue)
      .sort((a, b) => a.nextDueDate - b.nextDueDate);
    for (const card of due) {
      const q = ALL_QUESTIONS_BY_ID.get(card.questionId) ?? questionFromId(card.questionId, this.characterName);
      if (q) return q;
    }
    return null;
  }

  /** Called after every answer so a miss can come back later in the session. */
  missed(question: Question, skillId: string | null, rung: number | null = null) {
    this.requeue.push({ at: this.asked + REQUEUE_GAP, question, skillId, rung });
  }

  next(): PracticePick | null {
    const pick = this.choose();
    if (pick) this.recent = [...this.recent, sameness(pick.question)].slice(-RECENT_LOOKS);
    return pick;
  }

  /**
   * A question at this rung she has not just been asked. A small rung can only
   * say so many things, and one mixing a bank with a generator says some of
   * them under two ids, so: a few draws, the first she has not seen lately,
   * else the one she saw longest ago.
   */
  private freshAt(skill: Skill, rung: number): Question | null {
    let best: Question | null = null;
    let bestAge = -1;
    for (let i = 0; i < 8; i++) {
      const q = questionForRung(skill, rung);
      if (!q) break;
      const seen = this.recent.lastIndexOf(sameness(q));
      if (seen < 0) return q;
      const age = this.recent.length - seen;
      if (age > bestAge) { best = q; bestAge = age; }
    }
    return best;
  }

  private choose(): PracticePick | null {
    if (this.picksThisRound >= this.roundSize) this.startRound();
    const slot = this.picksThisRound++;
    this.asked++;
    const turn = this.turnFor(slot);
    const variety = this.variety();
    const main = variety === null ? [] : this.round.slice(0, ROUND_TOPICS - 1);
    const mayInterrupt = (skillId: string | null) =>
      variety === null || turn === skillId || (turn === variety && !main.includes(skillId ?? ''));

    // 1. Something she just got wrong, now far enough back to be worth retrying.
    const dueIdx = this.requeue.findIndex((r) => r.at <= this.asked && mayInterrupt(r.skillId));
    if (dueIdx >= 0) {
      const [item] = this.requeue.splice(dueIdx, 1);
      return {
        question: { ...item.question, choices: shuffleChoices(item.question.choices) },
        skillId: item.skillId,
        rung: item.rung,
      };
    }

    // 2. An SRS review, occasionally, so old mistakes resurface across days: in
    // a planned round, in the variety topic's two turns; otherwise every fifth.
    if (variety === null ? this.asked % 5 === 0 : turn === variety) {
      const review = this.dueReview();
      if (review) {
        // Routed to a ladder like any other answer. It carries no rung -- a
        // review is drawn from wherever she has been struggling, so it says
        // nothing about where she is standing -- but it used to carry no skill
        // either, which made up to a fifth of every practice session invisible
        // to the learner model.
        return {
          question: { ...review, choices: shuffleChoices(review.choices) },
          skillId: skillForQuestion(review, ''),
          rung: null,
        };
      }
    }

    // 3. Fresh question at her current rung, on the topic whose turn it is. The
    // rest of the round, then anything in her grade, are a fallback, so a round
    // whose topic cannot ask a question right now still never runs dry.
    if (!this.plan) this.turn++;
    const preferred = turn ?? '';
    const fallback = [
      ...shuffle(this.round.filter((id) => id !== preferred)),
      ...shuffle(this.skillPool().filter((id) => id !== preferred && !this.round.includes(id))),
    ];
    for (const skillId of [preferred, ...fallback]) {
      const skill = SKILLS_BY_ID.get(skillId);
      if (!skill) continue;
      const rung = Math.min(
        this.stateFor(skillId).rung,
        ceilingFor(skillId, this.progress.gradeLevel),
      );
      const q = this.freshAt(skill, rung);
      if (!q) continue;
      return { question: { ...q, choices: shuffleChoices(q.choices) }, skillId, rung };
    }
    return null;
  }

  /** Keep the queue's view of progress current as she levels up mid-session. */
  syncProgress(progress: UserProgress) {
    this.progress = progress;
  }
}

import { Question, SkillState, UserProgress } from '@/types';
import { SKILLS_BY_ID, questionForRung, unlockedSkillIds } from '@/data/skills';
import { ceilingFor } from '@/data/grades';
import { newSkillState } from './skillLadder';
import { questionFromId } from './questionGenerator';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { TOPICS, skillForQuestion } from '@/data/topics';
import { isDue } from './srs';
import { shuffle, shuffleChoices } from './choices';

// Picking the next question in endless practice.
//
// Three things compete for each slot, in priority order:
//   1. a question she got wrong earlier *in this same session* (requeued a few
//      questions later, while the correction is still fresh)
//   2. a question the spaced-repetition engine says is due
//   3. a fresh question at her current rung on some skill
//
// Skill choice is weighted toward the ones she has practised least today, so a
// session spreads out instead of drilling whichever skill won the first coin
// toss.

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

/** Questions in one round of Play: one card's worth, and half the daily goal. */
export const ROUND_SIZE = 10;

/** Topics one round concentrates on. */
const ROUND_TOPICS = 3;

const TEACHING_ORDER = new Map(TOPICS.map((t, i) => [t.id, i]));

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
 * Due reviews and requeued misses still come from anywhere (see `next`).
 */
export function chooseRoundSkills(
  progress: UserProgress,
  pool: string[],
  previous: readonly string[] = [],
  n = ROUND_TOPICS,
): string[] {
  if (pool.length <= n) return [...pool];
  const grade = progress.gradeLevel;
  const state = (id: string) => progress.skills?.[id];
  const started = (id: string) => (state(id)?.attempts ?? 0) > 0;
  const climbing = (id: string) => {
    const ceiling = ceilingFor(id, grade);
    return Math.min(state(id)?.rung ?? 0, ceiling) < ceiling;
  };
  const hits = (id: string) => state(id)?.recent.filter(Boolean).length ?? 0;
  const rotated = (id: string) => (previous.includes(id) ? 0.25 : 1);

  const chosen: string[] = [];
  const left = () => pool.filter((id) => !chosen.includes(id));
  const take = (id: string | undefined) => { if (id) chosen.push(id); };

  for (let i = 0; i < n - 1; i++) {
    take(weightedPick(left().filter((id) => started(id) && climbing(id)), (id) => (1 + hits(id)) * rotated(id)));
  }
  while (chosen.length < n - 1 && left().length > 0) {
    const order = (id: string) => TEACHING_ORDER.get(id) ?? Number.MAX_SAFE_INTEGER;
    const unstarted = left().filter((id) => !started(id)).sort((a, b) => order(a) - order(b));
    take(unstarted[0] ?? weightedPick(left(), rotated));
  }
  take(weightedPick(left(), rotated));
  return chosen;
}

export class PracticeQueue {
  private requeue: { at: number; question: Question; skillId: string | null; rung: number | null }[] = [];
  private asked = 0;
  private recentSkills: string[] = [];
  private round: string[] = [];
  private picksThisRound = 0;

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
  ) {
    this.startRound();
  }

  /**
   * Begin a new round, choosing what it concentrates on. The screen calls this
   * from its "Keep going" button; the queue also starts one by itself once a
   * round's worth of questions is used up, so it can never get stuck on one.
   */
  startRound() {
    const pool = this.skillPool();
    const narrowed = this.sessionSkill || (this.progress.practiceFocus ?? []).some((id) => SKILLS_BY_ID.has(id));
    // A topic screen's Play and a parent's Focus Mode have already said what to
    // practise; only the open "everything in her grade" pool is narrowed here.
    this.round = narrowed ? pool : chooseRoundSkills(this.progress, pool, this.round);
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

  private pickSkill(): string {
    const pool = this.round.length > 0 ? this.round : this.skillPool();
    // Weight down anything asked in the last few questions so topics rotate.
    const weights = pool.map((id) => {
      const recentUses = this.recentSkills.filter((s) => s === id).length;
      return 1 / (1 + recentUses * 3);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
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
    if (this.picksThisRound >= this.roundSize) this.startRound();
    this.picksThisRound++;
    this.asked++;

    // 1. Something she just got wrong, now far enough back to be worth retrying.
    const dueIdx = this.requeue.findIndex((r) => r.at <= this.asked);
    if (dueIdx >= 0) {
      const [item] = this.requeue.splice(dueIdx, 1);
      return {
        question: { ...item.question, choices: shuffleChoices(item.question.choices) },
        skillId: item.skillId,
        rung: item.rung,
      };
    }

    // 2. An SRS review, occasionally, so old mistakes resurface across days.
    if (this.asked % 5 === 0) {
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

    // 3. Fresh question at her current rung.
    //
    // The weighted pick goes FIRST and the rest are a shuffled fallback. They
    // used to be shuffled together, so `pickSkill()` — and with it the whole
    // `recentSkills` anti-repeat weighting — won only ~2/(n+1) of the time and
    // the rotation was effectively uniform.
    // Anything in her grade is a fallback, so a round whose topics cannot ask a
    // question right now still never runs dry.
    const preferred = this.pickSkill();
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
      const q = questionForRung(skill, rung);
      if (!q) continue;
      this.recentSkills = [...this.recentSkills, skillId].slice(-6);
      return { question: { ...q, choices: shuffleChoices(q.choices) }, skillId, rung };
    }
    return null;
  }

  /** Keep the queue's view of progress current as she levels up mid-session. */
  syncProgress(progress: UserProgress) {
    this.progress = progress;
  }
}

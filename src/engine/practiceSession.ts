import { Question, SkillState, UserProgress } from '@/types';
import { SKILLS, SKILLS_BY_ID, questionForRung } from '@/data/skills';
import { newSkillState } from './skillLadder';
import { questionFromId } from './questionGenerator';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
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
}

/** A wrong answer comes back this many questions later. */
const REQUEUE_GAP = 4;

export class PracticeQueue {
  private requeue: { at: number; question: Question; skillId: string | null }[] = [];
  private asked = 0;
  private recentSkills: string[] = [];

  constructor(private progress: UserProgress, private characterName = 'You') {}

  /** Skills she has already unlocked, or all of them for a brand-new player. */
  private skillPool(): string[] {
    return SKILLS.map((s) => s.id);
  }

  private stateFor(skillId: string): SkillState {
    return this.progress.skills?.[skillId] ?? newSkillState(skillId);
  }

  private pickSkill(): string {
    const pool = this.skillPool();
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
  missed(question: Question, skillId: string | null) {
    this.requeue.push({ at: this.asked + REQUEUE_GAP, question, skillId });
  }

  next(): PracticePick | null {
    this.asked++;

    // 1. Something she just got wrong, now far enough back to be worth retrying.
    const dueIdx = this.requeue.findIndex((r) => r.at <= this.asked);
    if (dueIdx >= 0) {
      const [item] = this.requeue.splice(dueIdx, 1);
      return { question: { ...item.question, choices: shuffleChoices(item.question.choices) }, skillId: item.skillId };
    }

    // 2. An SRS review, occasionally, so old mistakes resurface across days.
    if (this.asked % 5 === 0) {
      const review = this.dueReview();
      if (review) return { question: { ...review, choices: shuffleChoices(review.choices) }, skillId: null };
    }

    // 3. Fresh question at her current rung.
    for (const skillId of shuffle([this.pickSkill(), ...this.skillPool()])) {
      const skill = SKILLS_BY_ID.get(skillId);
      if (!skill) continue;
      const q = questionForRung(skill, this.stateFor(skillId).rung);
      if (!q) continue;
      this.recentSkills = [...this.recentSkills, skillId].slice(-6);
      return { question: { ...q, choices: shuffleChoices(q.choices) }, skillId };
    }
    return null;
  }

  /** Keep the queue's view of progress current as she levels up mid-session. */
  syncProgress(progress: UserProgress) {
    this.progress = progress;
  }
}

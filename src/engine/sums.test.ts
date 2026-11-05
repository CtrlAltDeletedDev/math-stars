import { describe, it, expect } from 'vitest';
import {
  PracticeQueue, SUMS_ROUND_SIZE, SUMS_SKILLS, WARMUP_EVERY, sumsPlan, warmupRung,
} from './practiceSession';
import { recordSkillAnswer, newSkillState } from './skillLadder';
import { buildInitialProgress } from '@/store/storage';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { ceilingFor } from '@/data/grades';
import { UserProgress, SRSCard } from '@/types';

// Plus & Minus: the plain-sums stream on Home. Adding and taking away only,
// mixed evenly, getting harder by itself, with the facts they have passed still
// coming up.

const due = (questionId: string): SRSCard => ({
  questionId, easeFactor: 2.5, intervalDays: 1, nextDueDate: 0, repetitions: 1, lastSeen: 0,
});

function child(rungs: Record<string, number>, extra: Partial<UserProgress> = {}): UserProgress {
  const p = buildInitialProgress();
  p.gradeLevel = '1';
  p.characterId = 'cat';
  p.skills = Object.fromEntries(Object.entries(rungs).map(([id, rung]) => [id, { ...newSkillState(id), rung }]));
  return { ...p, ...extra };
}

const clockId = [...ALL_QUESTIONS_BY_ID.values()].find((q) => q.type === 'tell_time')!.id;

describe('the Plus & Minus plan', () => {
  it('asks two of each in every block of four', () => {
    for (let i = 0; i < 50; i++) {
      const plan = sumsPlan(SUMS_ROUND_SIZE);
      expect(plan).toHaveLength(SUMS_ROUND_SIZE);
      for (let b = 0; b < plan.length; b += 4) {
        const block = plan.slice(b, b + 4);
        expect(block.filter((s) => s === 'adding'), block.join()).toHaveLength(2);
        expect(block.filter((s) => s === 'taking-away'), block.join()).toHaveLength(2);
      }
    }
  });

  it('is not a strict alternation they could follow without reading the sign', () => {
    const plans = new Set(Array.from({ length: 50 }, () => sumsPlan(8).join()));
    expect(plans.size).toBeGreaterThan(5);
  });

  it('warms up from one of the last few steps they passed, and never below the first', () => {
    expect(warmupRung(0)).toBeNull();
    for (let i = 0; i < 200; i++) {
      const r = warmupRung(5)!;
      expect(r).toBeGreaterThanOrEqual(2);
      expect(r).toBeLessThan(5);
      expect(warmupRung(1)).toBe(0);
    }
  });
});

describe('a Plus & Minus queue', () => {
  it('only ever asks adding and taking away, whatever else is due or focused', () => {
    const p = child(
      { adding: 4, 'taking-away': 4, clocks: 1 },
      {
        srsCards: { [clockId]: due(clockId), 'dbl-6': due('dbl-6'), 'sub-9-4': due('sub-9-4') },
        practiceFocus: ['clocks'],
      },
    );
    const q = new PracticeQueue(p, 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    let sawReview = false;
    for (let i = 0; i < 500; i++) {
      const pick = q.next()!;
      expect(pick.question.type, pick.question.id).toMatch(/^(addition|subtraction)$/);
      expect(SUMS_SKILLS as readonly string[]).toContain(pick.skillId);
      if (pick.question.id === 'sub-9-4' && pick.rung === null) sawReview = true;
      if (i % 3 === 0) q.missed(pick.question, pick.skillId, pick.rung);
    }
    expect(sawReview, 'its own reviews still come up').toBe(true);
  });

  it('mixes the two evenly', () => {
    const q = new PracticeQueue(child({ adding: 4, 'taking-away': 4 }), 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    const picks = Array.from({ length: 200 }, () => q.next()!);
    const adds = picks.filter((p) => p.skillId === 'adding').length;
    expect(adds).toBeGreaterThan(80);
    expect(adds).toBeLessThan(120);
  });

  it('serves a warm-up from below their rung now and then, and it never moves the window', () => {
    let p = child({ adding: 6, 'taking-away': 6 });
    const q = new PracticeQueue(p, 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    let warmups = 0;
    for (let i = 0; i < 40; i++) {
      const pick = q.next()!;
      const before = p.skills[pick.skillId!];
      const standing = Math.min(before.rung, ceilingFor(pick.skillId!, '1'));
      if (pick.rung !== null && pick.rung < standing) {
        warmups++;
        const after = recordSkillAnswer(before, true, ceilingFor(pick.skillId!, '1'), pick.rung).state;
        expect(after.recent, 'a warm-up is not evidence about their rung').toEqual(before.recent);
        expect(after.attempts).toBe(before.attempts + 1);
      }
    }
    expect(warmups).toBeGreaterThanOrEqual(40 / WARMUP_EVERY - 2);
    expect(warmups).toBeLessThanOrEqual(40 / WARMUP_EVERY);
  });

  it('serves no warm-ups to a child on the very first step', () => {
    const q = new PracticeQueue(child({}), 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    for (let i = 0; i < 40; i++) expect(q.next()!.rung).toBe(0);
  });

  it('climbs both ladders in one round when they know it', () => {
    let p = child({ adding: 2, 'taking-away': 2 });
    for (const id of SUMS_SKILLS) p.skills[id].demotions = 0; // still placing them
    const q = new PracticeQueue(p, 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    for (let i = 0; i < SUMS_ROUND_SIZE; i++) {
      const pick = q.next()!;
      const id = pick.skillId!;
      const next = recordSkillAnswer(p.skills[id], true, ceilingFor(id, '1'), pick.rung).state;
      p = { ...p, skills: { ...p.skills, [id]: next } };
      q.syncProgress(p);
    }
    expect(p.skills.adding.rung).toBeGreaterThanOrEqual(3);
    expect(p.skills['taking-away'].rung).toBeGreaterThanOrEqual(3);
  });

  it('does not let choice order give the answer away', () => {
    const q = new PracticeQueue(child({ adding: 4, 'taking-away': 4 }), 'You', null, SUMS_ROUND_SIZE, null, { sums: true });
    const slots = [0, 0, 0, 0];
    const n = 2000;
    for (let i = 0; i < n; i++) {
      const pick = q.next()!;
      slots[pick.question.choices.indexOf(pick.question.correctAnswer)]++;
    }
    for (const s of slots) expect(s / n).toBeGreaterThan(0.18);
  });
});

describe('a topic screen\'s Play', () => {
  it('keeps its reviews in the topic it promised', () => {
    // Adding's own Play used to pull a clock review every fifth question.
    const p = child({ adding: 4 }, { srsCards: { [clockId]: due(clockId), 'add-7+5': due('add-7+5') } });
    const q = new PracticeQueue(p, 'You', 'adding');
    for (let i = 0; i < 200; i++) expect(q.next()!.question.id).not.toBe(clockId);
  });
});

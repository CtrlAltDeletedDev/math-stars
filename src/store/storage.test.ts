import { describe, it, expect } from 'vitest';
import { UserProgress } from '@/types';
import { SKILLS_BY_ID } from '@/data/skills';
import { buildInitialProgress, normalizeProgress } from './storage';
import { recordSkillAnswer } from '@/engine/skillLadder';
import { rungAccuracy } from '@/engine/skillLadder';

// This layer holds the only copy of a year of her work, and until now it had no
// tests at all. `looksLikeProgress` validates the *shape* of the containers and
// stops there, so a damaged value inside one reached the ladder and the Parent
// screen intact — and crashed behind the screen that says her stars are safe.
//
// Import takes an arbitrary parent-chosen file, so none of this needs a disk
// fault to happen.

const save = (over: Partial<UserProgress> = {}): UserProgress =>
  ({ ...buildInitialProgress(), ...over }) as UserProgress;

describe('a damaged skill state cannot reach the ladder', () => {
  it('repairs a null window rather than throwing on the next answer', () => {
    const p = normalizeProgress(save({
      skills: { adding: { skillId: 'adding', rung: 3, recent: null, attempts: 5, correct: 4 } },
    } as unknown as Partial<UserProgress>))!;

    expect(p).not.toBeNull();
    expect(p.skills.adding.recent).toEqual([]);
    expect(p.skills.adding.rung, 'her place is the part worth keeping').toBe(3);
    // The two call sites that used to throw.
    expect(() => recordSkillAnswer(p.skills.adding, true)).not.toThrow();
    expect(() => rungAccuracy(p.skills.adding)).not.toThrow();
  });

  it('strips non-booleans out of a window', () => {
    const p = normalizeProgress(save({
      skills: { adding: { skillId: 'adding', rung: 1, recent: [true, 'yes', null, false], attempts: 4, correct: 2 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.skills.adding.recent).toEqual([true, false]);
  });

  it('drops a skill the catalogue does not have', () => {
    // A renamed or removed id could never promote — its ladder top reads as 0 —
    // and never recorded a ceiling hit, so it sat frozen and silent forever.
    const p = normalizeProgress(save({
      skills: {
        adding: { skillId: 'adding', rung: 2, recent: [], attempts: 9, correct: 7 },
        'adding-old-name': { skillId: 'adding-old-name', rung: 4, recent: [], attempts: 9, correct: 7 },
      },
    } as unknown as Partial<UserProgress>))!;
    expect(Object.keys(p.skills)).toEqual(['adding']);
  });

  it('clamps a rung past the end of its ladder', () => {
    const top = SKILLS_BY_ID.get('adding')!.rungs.length - 1;
    const p = normalizeProgress(save({
      skills: { adding: { skillId: 'adding', rung: 99, recent: [], attempts: 1, correct: 1 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.skills.adding.rung).toBe(top);
  });

  it('resets a rung that is negative or not a whole number', () => {
    for (const rung of [-3, 1.5, NaN, '2']) {
      const p = normalizeProgress(save({
        skills: { adding: { skillId: 'adding', rung, recent: [], attempts: 0, correct: 0 } },
      } as unknown as Partial<UserProgress>))!;
      expect(p.skills.adding.rung, `rung ${String(rung)}`).toBe(0);
    }
  });

  it('never reports more correct answers than attempts', () => {
    const p = normalizeProgress(save({
      skills: { adding: { skillId: 'adding', rung: 0, recent: [], attempts: 3, correct: 900 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.skills.adding.correct).toBeLessThanOrEqual(p.skills.adding.attempts);
  });
});

describe('a damaged SRS card cannot reach the scheduler', () => {
  it('drops cards with no usable due date or ease', () => {
    const p = normalizeProgress(save({
      srsCards: {
        good: { questionId: 'good', easeFactor: 2.5, intervalDays: 1, nextDueDate: 1, repetitions: 0, lastSeen: 0 },
        noDate: { questionId: 'noDate', easeFactor: 2.5, intervalDays: 1, repetitions: 0, lastSeen: 0 },
        nanEase: { questionId: 'nanEase', easeFactor: NaN, intervalDays: 1, nextDueDate: 1, repetitions: 0, lastSeen: 0 },
        notACard: 'nonsense',
      },
    } as unknown as Partial<UserProgress>))!;
    expect(Object.keys(p.srsCards)).toEqual(['good']);
  });

  it('recovers a card whose questionId went missing from its key', () => {
    const p = normalizeProgress(save({
      srsCards: {
        'add-3+4': { easeFactor: 2.5, intervalDays: 1, nextDueDate: 1, repetitions: 0, lastSeen: 0 },
      },
    } as unknown as Partial<UserProgress>))!;
    expect(p.srsCards['add-3+4'].questionId).toBe('add-3+4');
  });
});

describe('what her mistakes meant', () => {
  it('starts empty and additive for a save from before v6', () => {
    const old = { ...buildInitialProgress(), version: 5 } as UserProgress;
    delete (old as Partial<UserProgress>).errorPatterns;
    const p = normalizeProgress(old)!;
    expect(p).not.toBeNull();
    expect(p.errorPatterns).toEqual({});
    expect(p.version).toBe(6);
  });

  it('keeps real counts untouched', () => {
    const patterns = { adding: { 'off-by-one': 4, 'wrong-operation': 2 } };
    const p = normalizeProgress(save({ errorPatterns: patterns } as Partial<UserProgress>))!;
    expect(p.errorPatterns).toEqual(patterns);
  });

  it('drops a tag this build does not know', () => {
    // This feeds a sentence a parent is meant to act on. A tag from a future
    // build, or a hand-edited file, must not turn into advice.
    const p = normalizeProgress(save({
      errorPatterns: { adding: { 'off-by-one': 3, 'invented-tag': 99 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.errorPatterns.adding).toEqual({ 'off-by-one': 3 });
  });

  it('drops a skill the catalogue does not have', () => {
    const p = normalizeProgress(save({
      errorPatterns: { adding: { 'off-by-one': 1 }, 'not-a-skill': { 'off-by-one': 50 } },
    } as unknown as Partial<UserProgress>))!;
    expect(Object.keys(p.errorPatterns)).toEqual(['adding']);
  });

  it('drops counts that are not usable numbers', () => {
    const p = normalizeProgress(save({
      errorPatterns: { adding: { 'off-by-one': -5, 'wrong-operation': NaN, 'place-value': 'lots', reversed: 2.7 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.errorPatterns.adding).toEqual({ reversed: 2 });
  });

  it('leaves out a skill whose counts were all rejected', () => {
    // An empty bucket would render as a topic with findings and nothing in it.
    const p = normalizeProgress(save({
      errorPatterns: { adding: { 'off-by-one': 0 } },
    } as unknown as Partial<UserProgress>))!;
    expect(p.errorPatterns).toEqual({});
  });
});

describe('a healthy save is left alone', () => {
  it('passes a fresh profile through unchanged', () => {
    const fresh = buildInitialProgress();
    const p = normalizeProgress({ ...fresh })!;
    expect(p).not.toBeNull();
    expect(p.totalStars).toBe(fresh.totalStars);
    expect(p.skills).toEqual({});
  });

  it('keeps a real skill state exactly as it was', () => {
    const state = { skillId: 'adding', rung: 2, recent: [true, false, true], attempts: 12, correct: 9, ceilingHits: 1 };
    const p = normalizeProgress(save({ skills: { adding: { ...state } } }))!;
    expect(p.skills.adding).toEqual(state);
  });

  it('rejects a version it cannot migrate, rather than guessing', () => {
    expect(normalizeProgress(save({ version: 1 }))).toBeNull();
    expect(normalizeProgress(save({ version: 99 }))).toBeNull();
    expect(normalizeProgress({ } as UserProgress)).toBeNull();
  });

  it('rejects a container of the wrong shape outright', () => {
    expect(normalizeProgress(save({ skills: [] } as unknown as Partial<UserProgress>))).toBeNull();
    expect(normalizeProgress(save({ categories: [] } as unknown as Partial<UserProgress>))).toBeNull();
  });
});

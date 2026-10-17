import { describe, it, expect } from 'vitest';
import { SkillState, UserProgress } from '@/types';
import { buildInitialProgress } from '@/store/storage';
import { GradeLevel } from '@/data/grades';
import { ladderProgress } from './mastery';
import { newBadgesFor, newStickersFor } from './rewards';

// Play is the big button on Home and passes no levels. Every reward that used
// to need a passed level has to be reachable from there too, or the path the
// app steers her down is the one that never pays.

function child(grade: GradeLevel, rungs: Record<string, number>, attempts = 40): UserProgress {
  const skills: Record<string, SkillState> = {};
  for (const [skillId, rung] of Object.entries(rungs)) {
    skills[skillId] = { skillId, rung, recent: [], attempts, correct: Math.floor(attempts * 0.8), ceilingHits: 0 };
  }
  return { ...buildInitialProgress(), characterId: 'cat', gradeLevel: grade, skills };
}

const fresh = () => ({ ...buildInitialProgress(), characterId: 'cat', gradeLevel: '1' as const });
const badgeIds = (prev: UserProgress, next: UserProgress) => newBadgesFor(prev, next, 0, 0).map((b) => b.badgeId);
const stickerIds = (prev: UserProgress, next: UserProgress) => newStickersFor(prev, next, 0, 0);

describe('what the ladders count', () => {
  it('sums the rungs she stands on and the answers she has given', () => {
    const p = child('1', { adding: 3, 'taking-away': 2, clocks: 0 }, 10);
    expect(ladderProgress(p)).toMatchObject({ rungsClimbed: 5, questionsAnswered: 30 });
  });

  it('counts a topic as climbed once she stands on her grade\'s top rung', () => {
    // Clocks stops at "half past" (rung 1) in first grade.
    expect(ladderProgress(child('1', { clocks: 1 })).topicsAtTop).toBe(1);
    expect(ladderProgress(child('1', { clocks: 0 })).topicsAtTop).toBe(0);
  });

  it('does not count a topic whose grade stops at its first rung', () => {
    // Money is "naming coins" only in first grade: she would be at the top of
    // it before answering anything.
    expect(ladderProgress(child('1', { money: 0 })).topicsAtTop).toBe(0);
  });
});

describe('a child who only ever presses Play', () => {
  it('gets the first-game sticker on her first answer', () => {
    expect(stickerIds(fresh(), child('1', { adding: 0 }, 1))).toContain('sk-sun');
  });

  it('gets "Level Up!" for her first rung', () => {
    expect(badgeIds(fresh(), child('1', { adding: 1 }))).toContain('first_level');
  });

  it('gets "Level Master" and the level stickers for climbing', () => {
    const next = child('1', { adding: 3, 'taking-away': 2 });
    expect(badgeIds(fresh(), next)).toContain('five_levels');
    expect(stickerIds(fresh(), next)).toEqual(expect.arrayContaining(['sk-dog', 'sk-frog']));
    expect(stickerIds(fresh(), next)).not.toContain('sk-fox');
  });

  it('gets "Topic Champ!" for climbing a topic to the top', () => {
    const next = child('1', { clocks: 1 });
    expect(badgeIds(fresh(), next)).toContain('category_complete');
    expect(stickerIds(fresh(), next)).toContain('sk-rainbow');
  });

  it('earns nothing for climbing she has not done', () => {
    const next = child('1', { adding: 0, money: 0 }, 5);
    expect(badgeIds(fresh(), next)).not.toContain('first_level');
    expect(badgeIds(fresh(), next)).not.toContain('category_complete');
  });
});

describe('the level route still pays', () => {
  it('awards "Level Up!" for a passed level with no ladder progress at all', () => {
    const next: UserProgress = {
      ...fresh(),
      categories: {
        steps: {
          categoryId: 'steps',
          totalStarsEarned: 3,
          levels: { 'steps-add-1': { levelId: 'steps-add-1', bestScore: 1, starsEarned: 3, totalAttempts: 1, lastPlayed: 0 } },
        },
      },
    };
    expect(badgeIds(fresh(), next)).toContain('first_level');
    expect(stickerIds(fresh(), next)).toContain('sk-sun');
  });

  it('never awards a badge twice', () => {
    const prev = { ...child('1', { adding: 1 }), earnedBadges: [{ badgeId: 'first_level', earnedAt: 0 }] };
    expect(badgeIds(prev, child('1', { adding: 2 }))).not.toContain('first_level');
  });
});

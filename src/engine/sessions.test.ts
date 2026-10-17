import { describe, it, expect } from 'vitest';
import { Question, SkillState, UserProgress } from '@/types';
import { buildInitialProgress } from '@/store/storage';
import { GradeLevel, ceilingFor } from '@/data/grades';
import { RUNG_FOR_LEVEL, SKILL_FOR_LEVEL, allCatalogueLevelIds, nextLevelInTopic, topicIdFor } from '@/data/topics';
import { createNewSRSCard } from './srs';
import { buildDailyChallengeSession, buildMasterSession, buildRungSession } from './sessionBuilder';

// The sessions that used to be built from categories — the daily challenge,
// Master Mode and Quick Review — and the "Next" button after a level. All of
// them now read the ladders, so they follow her whichever button she pressed.

function child(grade: GradeLevel, rungs: Record<string, number>, due: string[] = []): UserProgress {
  const skills: Record<string, SkillState> = {};
  for (const [skillId, rung] of Object.entries(rungs)) {
    skills[skillId] = { skillId, rung, recent: [], attempts: 40, correct: 32, ceilingHits: 0 };
  }
  const srsCards = Object.fromEntries(due.map((id) => [id, { ...createNewSRSCard(id), nextDueDate: Date.now() - 1000 }]));
  return { ...buildInitialProgress(), characterId: 'cat', gradeLevel: grade, skills, srsCards };
}

/** [a, b] for an `add-a+b` question, else null. */
function addends(q: Question): [number, number] | null {
  const m = /^add-(\d+)\+(\d+)$/.exec(q.id);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

describe('the daily challenge', () => {
  it('asks a Play-only child questions at her rung, not ten "n + 1"s', () => {
    // She has never passed a level, so the old category-based builder fell
    // back to "Adding 1 More" for her every single day.
    const qs = buildDailyChallengeSession(child('1', { adding: 4 }));
    expect(qs).toHaveLength(10);
    const pairs = qs.map(addends);
    expect(pairs.every((p) => p !== null), 'all from the adding ladder').toBe(true);
    expect(pairs.some((p) => p![0] !== 1 && p![1] !== 1), 'not all "+ 1"').toBe(true);
    expect(pairs.every((p) => p![0] + p![1] <= 20)).toBe(true);
  });

  it('mixes every topic she has started', () => {
    const qs = buildDailyChallengeSession(child('1', { adding: 4, clocks: 1, 'counting-up': 2 }));
    expect(qs).toHaveLength(10);
    const types = new Set(qs.map((q) => q.type));
    expect(types).toEqual(new Set(['addition', 'tell_time', 'skip_count']));
  });

  it('starts a brand-new child gently, on the first topic of her grade', () => {
    const qs = buildDailyChallengeSession(child('1', {}));
    expect(qs).toHaveLength(10);
    expect(qs.every((q) => q.type === 'addition')).toBe(true);
  });

  it('never reaches above her grade, even with a saved rung above it', () => {
    // A child whose grade was moved down keeps her saved rung, but is served at the ceiling.
    const qs = buildDailyChallengeSession(child('1', { adding: 7 }));
    expect(qs.every((q) => { const p = addends(q); return p !== null && p[0] + p[1] <= 20; })).toBe(true);
  });

  it('brings back a few due mistakes, and leaves most of the room for fresh questions', () => {
    const due = ['sub-9-4', 'sub-12-5', 'sub-15-7', 'sub-11-3', 'sub-13-6', 'sub-17-9'];
    const qs = buildDailyChallengeSession(child('1', { adding: 4 }, due));
    expect(qs).toHaveLength(10);
    expect(qs.filter((q) => due.includes(q.id))).toHaveLength(3);
  });

  it('never repeats a question within the session', () => {
    for (let i = 0; i < 20; i++) {
      const qs = buildDailyChallengeSession(child('1', { adding: 0, clocks: 0 }));
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    }
  });
});

describe('Master Mode', () => {
  it('stays inside its own topic', () => {
    // Taking Away's Master Mode used to be the "One Step at a Time" category,
    // which is half adding — the same session as Adding's.
    const p = child('1', { 'taking-away': 3, adding: 4 }, ['add-8+7', 'sub-9-4']);
    const qs = buildMasterSession(p, 'taking-away');
    expect(qs).toHaveLength(10);
    expect(qs.every((q) => q.type === 'subtraction')).toBe(true);
    expect(qs.map((q) => q.id)).toContain('sub-9-4');
    expect(qs.map((q) => q.id)).not.toContain('add-8+7');
  });

  it('reaches no higher than she has climbed', () => {
    // Rungs 0 and 1 of adding are "+ 1" and "+ 2".
    const qs = buildMasterSession(child('1', { adding: 1 }), 'adding');
    expect(qs).toHaveLength(10);
    expect(qs.every((q) => { const p = addends(q); return p !== null && (p[0] <= 2 || p[1] <= 2); })).toBe(true);
  });

  it('draws from every rung she has climbed through, not only the top one', () => {
    // Rung 4 is "within 20"; rungs 0 and 1 hold an addend at 1 or 2.
    const qs = buildMasterSession(child('1', { adding: 4 }), 'adding');
    const small = qs.filter((q) => { const p = addends(q); return p !== null && (p[0] <= 2 || p[1] <= 2); });
    expect(small.length).toBeGreaterThan(0);
  });

  it('keeps the times tables away from a first grader', () => {
    const qs = buildMasterSession(child('1', { 'counting-up': 6 }), 'counting-up');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.some((q) => q.type === 'multiplication')).toBe(false);
  });

  it('works for a topic that has no hand-built levels', () => {
    const qs = buildMasterSession(child('2', { fractions: 3 }), 'fractions');
    expect(qs).toHaveLength(10);
    expect(qs.every((q) => q.type === 'fraction')).toBe(true);
  });

  it('runs short rather than repeat itself when there is little to ask', () => {
    // "Naming coins" has four questions. Ten taps of the same four coins is a
    // chore, not a challenge.
    const qs = buildMasterSession(child('1', { money: 0 }), 'money');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(4);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });

  it('builds nothing for a topic that does not exist', () => {
    expect(buildMasterSession(child('1', {}), 'no-such-topic')).toEqual([]);
  });
});

describe('Quick Review', () => {
  it('is at her rung, not the topic\'s first level', () => {
    // It used to replay the first level, so Quick Review on Adding was "+ 1" for ever.
    const qs = buildRungSession(child('1', { adding: 3 }), 'adding');
    expect(qs).toHaveLength(10);
    const pairs = qs.map(addends);
    expect(pairs.every((p) => p !== null && p[0] + p[1] <= 10)).toBe(true);
    expect(pairs.some((p) => p![0] !== 1 && p![1] !== 1)).toBe(true);
    expect(new Set(qs.map((q) => q.id)).size).toBe(10);
  });

  it('starts at the bottom for a child who has not played the topic', () => {
    const qs = buildRungSession(child('1', {}), 'adding');
    expect(qs.every((q) => { const p = addends(q); return p !== null && (p[0] === 1 || p[1] === 1); })).toBe(true);
  });
});

describe('old links', () => {
  it('pass a topic id straight through', () => {
    expect(topicIdFor('adding')).toBe('adding');
    expect(topicIdFor('fractions')).toBe('fractions');
  });

  it('turn an old category id into its topic', () => {
    expect(topicIdFor('addition')).toBe('adding');
    expect(topicIdFor('steps')).toBe('adding');
    expect(topicIdFor('multiplication')).toBe('counting-up');
    expect(topicIdFor('time')).toBe('clocks');
    expect(topicIdFor('measure')).toBe('measuring');
  });

  it('give up on an id that means nothing', () => {
    expect(topicIdFor('nope')).toBeUndefined();
  });
});

describe('"Next" after a level', () => {
  it('stays in the topic', () => {
    // Category order offered "Taking Away (to 5)" after "Adding to 20".
    expect(nextLevelInTopic('addition-3', '1')?.id).toBe('mixed-1');
    expect(nextLevelInTopic('subtraction-2', '1')?.id).toBe('subtraction-3');
  });

  it('stops at the edge of her grade', () => {
    // Category order offered the × 2 table to a first grader after "Count by 10s".
    expect(nextLevelInTopic('skip-10', '1')).toBeNull();
    expect(nextLevelInTopic('skip-10', '2')?.id).toBe('times-2');
  });

  it('offers nothing after the last level of a topic', () => {
    expect(nextLevelInTopic('mixed-1', '1')).toBeNull();
  });

  it('is always the same topic and inside the grade, for every level', () => {
    const bad: string[] = [];
    for (const grade of ['K', '1', '2'] as const) {
      for (const id of allCatalogueLevelIds()) {
        const next = nextLevelInTopic(id, grade);
        if (!next) continue;
        const skill = SKILL_FOR_LEVEL.get(id)!;
        if (SKILL_FOR_LEVEL.get(next.id) !== skill) bad.push(`${grade}: ${id} -> ${next.id} changes topic`);
        if (RUNG_FOR_LEVEL.get(next.id)! > ceilingFor(skill, grade)) bad.push(`${grade}: ${id} -> ${next.id} is above the grade`);
      }
    }
    expect(bad).toEqual([]);
  });
});

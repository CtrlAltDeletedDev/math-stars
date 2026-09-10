import { describe, it, expect } from 'vitest';
import { GRADES, GradeLevel, ceilingFor, isInGrade, skillIdsForGrade } from '@/data/grades';
import {
  TOPICS,
  TOPICS_BY_ID,
  SKILL_FOR_LEVEL,
  allCatalogueLevelIds,
  allSkillIds,
  topicsForGrade,
  topicLevelsInScope,
  skillForQuestion,
} from '@/data/topics';
import { SKILLS, SKILLS_BY_ID, questionForRung } from '@/data/skills';
import { getLevelById } from '@/data/categories';

// These are the tables that hold the redesign together: every level belongs to
// exactly one topic, every topic is a real skill, and the grade bands nest. Get
// any of them wrong and a topic silently vanishes from a child's home screen, so
// they are asserted rather than trusted.

describe('topics cover the catalogue', () => {
  it('claims every level exactly once', () => {
    const claimed = TOPICS.flatMap((t) => t.levels.map((l) => l.levelId));
    const dupes = claimed.filter((id, i) => claimed.indexOf(id) !== i);
    expect(dupes, 'a level is claimed by two topics').toEqual([]);

    const catalogue = allCatalogueLevelIds();
    const unclaimed = catalogue.filter((id) => !claimed.includes(id));
    expect(unclaimed, 'levels with no topic — they would be unreachable').toEqual([]);

    const phantom = claimed.filter((id) => !catalogue.includes(id));
    expect(phantom, 'topic references a level that does not exist').toEqual([]);
  });

  it('references only levels that resolve', () => {
    const bad = TOPICS.flatMap((t) => t.levels)
      .filter((ref) => getLevelById(ref.levelId) === null)
      .map((ref) => ref.levelId);
    expect(bad).toEqual([]);
  });

  it('is one-to-one with the skill ladders', () => {
    const topicIds = [...TOPICS_BY_ID.keys()].sort();
    const skillIds = allSkillIds().sort();
    expect(topicIds).toEqual(skillIds);
  });

  it('gives every level ref a rung its skill actually has', () => {
    const bad: string[] = [];
    for (const topic of TOPICS) {
      const skill = SKILLS_BY_ID.get(topic.id)!;
      for (const ref of topic.levels) {
        if (ref.rung < 0 || ref.rung >= skill.rungs.length) {
          bad.push(`${ref.levelId}: rung ${ref.rung} but ${topic.id} has ${skill.rungs.length}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('routes a mixed level to both ladders', () => {
    // steps-mix-2 asks "+2" and "-2" questions. Ten subtraction answers must not
    // land in the adding ladder just because the level lives under Adding.
    expect(skillForQuestion({ type: 'addition' } as never, 'steps-mix-2')).toBe('adding');
    expect(skillForQuestion({ type: 'subtraction' } as never, 'steps-mix-2')).toBe('taking-away');
  });

  it('falls back to the level topic for a type it does not route', () => {
    expect(skillForQuestion({ type: 'nonsense' } as never, 'nb-bonds-5')).toBe('number-bonds');
    expect(SKILL_FOR_LEVEL.get('measure-length')).toBe('measuring');
  });
});

describe('grade bands', () => {
  const ORDER: GradeLevel[] = ['K', '1', '2'];

  it('nest: K is inside 1st is inside 2nd', () => {
    for (let i = 0; i < ORDER.length - 1; i++) {
      const lower = skillIdsForGrade(ORDER[i]);
      const higher = skillIdsForGrade(ORDER[i + 1]);
      const dropped = lower.filter((id) => !higher.includes(id));
      expect(dropped, `${ORDER[i]} topics missing from ${ORDER[i + 1]}`).toEqual([]);

      // And a ceiling must never fall when she moves up a year.
      const lowered = lower.filter((id) => ceilingFor(id, ORDER[i + 1]) < ceilingFor(id, ORDER[i]));
      expect(lowered, `ceiling drops going ${ORDER[i]} -> ${ORDER[i + 1]}`).toEqual([]);
    }
  });

  it('only names ceilings for skills that exist, at rungs that exist', () => {
    const bad: string[] = [];
    for (const band of GRADES) {
      for (const [skillId, rung] of Object.entries(band.ceilings)) {
        const skill = SKILLS_BY_ID.get(skillId);
        if (!skill) { bad.push(`${band.id}: no such skill "${skillId}"`); continue; }
        if (rung < 0 || rung >= skill.rungs.length) {
          bad.push(`${band.id}/${skillId}: ceiling ${rung} but only ${skill.rungs.length} rungs`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps the hard stuff out of Kindergarten', () => {
    for (const id of ['fractions', 'money', 'clocks', 'place-value', 'even-odd', 'counting-up']) {
      expect(isInGrade(id, 'K'), `${id} should not be in K`).toBe(false);
    }
    // ...and does teach the basics.
    expect(isInGrade('adding', 'K')).toBe(true);
    expect(isInGrade('counting', 'K')).toBe(true);
  });

  it('keeps times tables out of first grade but allows them in second', () => {
    expect(ceilingFor('counting-up', '1')).toBe(2); // skip counting only
    expect(ceilingFor('counting-up', '2')).toBe(4); // x2, x5, x10
  });

  it('treats no grade as no limit, so an un-graded save is never narrowed', () => {
    for (const skill of SKILLS) {
      expect(ceilingFor(skill.id, null)).toBe(skill.rungs.length - 1);
      expect(isInGrade(skill.id, null)).toBe(true);
    }
  });

  it('produces a playable question at every in-scope rung of every grade', () => {
    for (const band of GRADES) {
      for (const skillId of skillIdsForGrade(band.id)) {
        const skill = SKILLS_BY_ID.get(skillId)!;
        for (let rung = 0; rung <= ceilingFor(skillId, band.id); rung++) {
          const q = questionForRung(skill, rung);
          expect(q, `${band.id}/${skillId} rung ${rung} produced nothing`).not.toBeNull();
          expect(q!.choices).toContain(q!.correctAnswer);
        }
      }
    }
  });
});

describe('grade scoping of topics and levels', () => {
  it('shows fewer topics to a younger child', () => {
    expect(topicsForGrade('K').length).toBeLessThan(topicsForGrade('1').length);
    expect(topicsForGrade('1').length).toBeLessThanOrEqual(topicsForGrade('2').length);
    expect(topicsForGrade(null).length).toBe(TOPICS.length);
  });

  it('hides above-ceiling levels from the replay strip', () => {
    const adding = TOPICS_BY_ID.get('adding')!;
    const kLevels = topicLevelsInScope(adding, 'K').map((l) => l.id);
    const g2Levels = topicLevelsInScope(adding, '2').map((l) => l.id);

    // "Adding to 20" is rung 4 — beyond K's ceiling of 3, inside 2nd's of 7.
    expect(kLevels).not.toContain('addition-3');
    expect(g2Levels).toContain('addition-3');
    // The easiest level is always there.
    expect(kLevels).toContain('steps-add-1');
  });

  it('leaves a practice-only topic with no levels rather than breaking', () => {
    const fractions = TOPICS_BY_ID.get('fractions')!;
    expect(fractions.levels).toEqual([]);
    expect(topicLevelsInScope(fractions, '2')).toEqual([]);
  });
});

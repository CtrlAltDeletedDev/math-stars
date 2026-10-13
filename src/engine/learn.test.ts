import { describe, it, expect } from 'vitest';
import {
  ALL_LESSONS, INTERACTIVE_LESSONS, LESSONS_BY_ID, Lesson, Scene,
  lessonsFor, recommendedLesson, lessonForMistake,
} from '@/data/learn';
import { LESSONS } from '@/data/lessons';
import { SKILLS_BY_ID } from '@/data/skills';
import { getLevelById } from '@/data/categories';
import { ceilingFor } from '@/data/grades';

// Lessons are data, so the mistakes worth guarding are data mistakes: a "try"
// whose marked answer is wrong, a picture that shows a different sum from the
// one being asked, a lesson filed under a topic that would never show it.

function steps(l: Lesson) {
  return l.steps.map((s, i) => ({ s, where: `${l.id} step ${i + 1}` }));
}

/** Where a number-line picture ends up. */
function landing(scene: Scene): number | null {
  if (scene.kind !== 'numberLine' || !scene.hops) return null;
  return scene.start + (scene.dir ?? 1) * scene.hops;
}

/** "17 − 6 = ?", "9 + 4 = ?", "17 = ? + 6", "17 − ? = 6", "6 + ? = 10" → the ?. */
function solve(text: string): number | null {
  const t = text.replace(/−/g, '-').replace(/\s+/g, '');
  let m = t.match(/^(\d+)([+-])(\d+)=\?$/);
  if (m) return m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
  m = t.match(/^(\d+)\+\?=(\d+)$/);
  if (m) return +m[2] - +m[1];
  m = t.match(/^(\d+)=\?\+(\d+)$/);
  if (m) return +m[1] - +m[2];
  m = t.match(/^(\d+)-\?=(\d+)$/);
  if (m) return +m[1] - +m[2];
  return null;
}

describe('every lesson', () => {
  it('has a unique id and at least one step', () => {
    expect(new Set(ALL_LESSONS.map((l) => l.id)).size).toBe(ALL_LESSONS.length);
    for (const l of ALL_LESSONS) expect(l.steps.length, l.id).toBeGreaterThan(0);
  });

  it('lives in a topic at a rung that topic has, and practises a real level', () => {
    for (const l of ALL_LESSONS) {
      expect(l.places.length, l.id).toBeGreaterThan(0);
      for (const p of l.places) {
        const skill = SKILLS_BY_ID.get(p.skillId);
        expect(skill, `${l.id}: no topic ${p.skillId}`).toBeDefined();
        expect(p.rung, l.id).toBeGreaterThanOrEqual(0);
        expect(p.rung, l.id).toBeLessThan(skill!.rungs.length);
      }
      expect(getLevelById(l.practiceLevelId), `${l.id}: no level ${l.practiceLevelId}`).not.toBeNull();
    }
  });

  it('says something at every step', () => {
    for (const l of ALL_LESSONS) {
      for (const { s, where } of steps(l)) {
        expect(s.say.trim().length, where).toBeGreaterThan(0);
        expect(s.caption.trim().length, where).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every number line on the line', () => {
    for (const l of ALL_LESSONS) {
      for (const { s, where } of steps(l)) {
        for (const scene of [s.scene, s.kind === 'try' ? s.then.scene : undefined]) {
          if (scene?.kind !== 'numberLine') continue;
          expect(scene.start, where).toBeGreaterThanOrEqual(0);
          expect(scene.start, where).toBeLessThanOrEqual(scene.max);
          const end = landing(scene);
          if (end !== null) {
            expect(end, where).toBeGreaterThanOrEqual(0);
            expect(end, where).toBeLessThanOrEqual(scene.max);
          }
        }
      }
    }
  });

  it('fits a ten frame', () => {
    for (const l of ALL_LESSONS) {
      for (const { s, where } of steps(l)) {
        for (const scene of [s.scene, s.kind === 'try' ? s.then.scene : undefined]) {
          if (scene?.kind === 'tenFrame') expect(scene.first + (scene.second ?? 0), where).toBeLessThanOrEqual(10);
        }
      }
    }
  });
});

describe('"try" steps', () => {
  const tries = INTERACTIVE_LESSONS.flatMap((l) => steps(l)).filter(({ s }) => s.kind === 'try');

  it('exist in every interactive lesson', () => {
    for (const l of INTERACTIVE_LESSONS) {
      expect(l.steps.some((s) => s.kind === 'try'), `${l.id} never lets her try`).toBe(true);
    }
  });

  it('offer the answer once, among distinct choices', () => {
    for (const { s, where } of tries) {
      if (s.kind !== 'try') continue;
      expect(s.choices, where).toContain(s.answer);
      expect(new Set(s.choices).size, where).toBe(s.choices.length);
      expect(s.choices.length, where).toBeGreaterThanOrEqual(2);
      expect(s.choices.length, where).toBeLessThanOrEqual(4);
    }
  });

  it('only give hints for wrong choices that are on screen', () => {
    for (const { s, where } of tries) {
      if (s.kind !== 'try') continue;
      for (const key of Object.keys(s.hints ?? {})) {
        expect(s.choices, `${where}: hint for "${key}", which is not a choice`).toContain(key);
        expect(key, `${where}: a hint on the right answer`).not.toBe(s.answer);
      }
    }
  });

  it('have a hint written for every wrong number', () => {
    // A generic "try again" teaches nothing. Each wrong option is a specific
    // mistake and gets a sentence about that mistake.
    for (const { s, where } of tries) {
      if (s.kind !== 'try') continue;
      for (const c of s.choices.filter((c) => c !== s.answer)) {
        expect(s.hints?.[c], `${where}: no hint for "${c}"`).toBeDefined();
      }
    }
  });

  it('mark the answer the arithmetic gives', () => {
    let checked = 0;
    for (const { s, where } of tries) {
      if (s.kind !== 'try') continue;
      const expected = solve(s.caption);
      if (expected === null || Number.isNaN(Number(s.answer))) continue;
      checked++;
      expect(Number(s.answer), `${where}: "${s.caption}"`).toBe(expected);
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('play the picture through to the answer they marked', () => {
    for (const { s, where } of tries) {
      if (s.kind !== 'try' || !s.then.scene) continue;
      // Only where the question is the sum being drawn ("Start on which?" isn't).
      const end = landing(s.then.scene);
      if (end !== null && solve(s.caption) !== null) {
        // "17 − 6 = ?" lands on the answer; "7 + ? = 12" counts up, so the
        // answer is how many hops it took.
        const countsHops = !/=\s*\?$/.test(s.caption);
        const shown = countsHops && s.then.scene.kind === 'numberLine' ? s.then.scene.hops : end;
        expect(shown, `${where}: the picture shows a different answer`).toBe(Number(s.answer));
      }
      if (s.then.scene.kind === 'partWhole') {
        const { whole, parts } = s.then.scene;
        expect(whole, where).toBe((parts[0] ?? NaN) + (parts[1] ?? NaN));
      }
    }
  });

  it('do not guess a pronoun for anyone in a story', () => {
    for (const l of INTERACTIVE_LESSONS) {
      for (const { s, where } of steps(l)) {
        const text = [s.say, s.caption, ...(s.kind === 'try' ? [s.then.say, ...Object.values(s.hints ?? {})] : [])].join(' ');
        expect(text, where).not.toMatch(/\b(he|she|him|his|her|hers)\b/i);
      }
    }
  });
});

describe('finding a lesson', () => {
  it('turns every old slide lesson into a playable one', () => {
    for (const levelId of Object.keys(LESSONS)) {
      expect(LESSONS_BY_ID.has(`read-${levelId}`), `slides for ${levelId} are unreachable`).toBe(true);
    }
  });

  it('gives a first grader a lesson in every topic from the add & subtract unit', () => {
    for (const skillId of ['adding', 'taking-away', 'strategies', 'stories', 'fact-families', 'mystery-number']) {
      expect(lessonsFor(skillId, ceilingFor(skillId, '1')).length, skillId).toBeGreaterThan(0);
    }
  });

  it('keeps lessons above her grade out of her topic', () => {
    // Kindergarten's taking-away ceiling is rung 3; "hop back" teaches rung 4.
    expect(lessonsFor('taking-away', ceilingFor('taking-away', 'K')).map((l) => l.id)).not.toContain('hop-back');
  });

  it('puts the lesson for her commonest mistake first', () => {
    const l = recommendedLesson('stories', 9, 9, {}, 'added-story-numbers');
    expect(l?.helpsWith).toContain('added-story-numbers');
  });

  it('otherwise suggests one she has not done yet', () => {
    const first = recommendedLesson('stories', 9, 4, {});
    const next = recommendedLesson('stories', 9, 4, { [first!.id]: '2026-10-12' });
    expect(next!.id).not.toBe(first!.id);
  });

  it('finds the lesson for a parent-screen mistake', () => {
    expect(lessonForMistake('stories', 'added-story-numbers', 9, 4)?.id).toBe('some-and-the-rest');
    expect(lessonForMistake('taking-away', 'off-by-one', 4, 4)?.id).toBe('hop-back');
    expect(lessonForMistake('shapes', 'off-by-one', 2, 0)).toBeNull();
  });
});

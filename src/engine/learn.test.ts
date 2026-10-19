import { describe, it, expect } from 'vitest';
import {
  ALL_LESSONS, INTERACTIVE_LESSONS, LESSONS_BY_ID, Lesson, Scene,
  lessonsFor, recommendedLesson, lessonForMistake, practiceLevelFor,
} from '@/data/learn';
import { LESSONS } from '@/data/lessons';
import { SKILLS_BY_ID, questionForRung } from '@/data/skills';
import { getLevelById } from '@/data/categories';
import { ceilingFor } from '@/data/grades';
import { SKILL_FOR_LEVEL, TOPICS_BY_ID } from '@/data/topics';
import { GRADES } from '@/data/grades';
import { ErrorTag } from '@/types';

// Lessons are data, so the mistakes worth guarding are data mistakes: a "try"
// whose marked answer is wrong, a picture that shows a different sum from the
// one being asked, a lesson filed under a topic that would never show it.

function steps(l: Lesson) {
  return l.steps.map((s, i) => ({ s, where: `${l.id} step ${i + 1}` }));
}

/** Where a number-line picture ends up. */
function landing(scene: Scene): number | null {
  if (scene.kind !== 'numberLine' || !scene.hops) return null;
  return scene.start + (scene.dir ?? 1) * scene.hops * (scene.step ?? 1);
}

/**
 * The one answer a picture shows, written the way a choice would be: "7",
 * "25¢", "3:30", "1/4", "Odd". Null for a picture that shows no one answer.
 */
function shows(scene: Scene): string | null {
  switch (scene.kind) {
    case 'objects': return String(scene.n);
    case 'pairs': return scene.n % 2 === 0 ? 'Even' : 'Odd';
    case 'groups': return String(scene.groups * scene.size);
    case 'tensOnes': return scene.numbers.length === 1 ? String(scene.numbers[0]) : null;
    case 'coins': return `${scene.coins.reduce((a, b) => a + b, 0)}¢`;
    case 'clock': return `${scene.hour}:${String(scene.minute).padStart(2, '0')}`;
    case 'shape': return scene.mark ? String(SIDES[scene.shape]) : null;
    case 'fraction': return scene.unequal ? null : `${scene.shaded}/${scene.parts}`;
    default: return null;
  }
}

/** Sides, and so corners, of each shape a lesson can draw. */
const SIDES = { triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, pentagon: 5, hexagon: 6, octagon: 8, circle: 0 } as const;

/** Is this answer written the way `shows` writes what the picture shows? */
function sameKindOfAnswer(shown: string, answer: string): boolean {
  const kind = (t: string) => (/^\d+$/.test(t) ? 'n' : /¢$/.test(t) ? 'c' : /^\d+:\d\d$/.test(t) ? 't' : /^\d+\/\d+$/.test(t) ? 'f' : /^(Even|Odd)$/.test(t) ? 'p' : t);
  return kind(shown) === kind(answer);
}

/** Every picture in a lesson, wherever it appears. */
function scenes(l: Lesson): { scene: Scene; where: string }[] {
  return steps(l).flatMap(({ s, where }) => [s.scene, s.kind === 'try' ? s.then.scene : undefined]
    .filter((x): x is Scene => !!x).map((scene) => ({ scene, where })));
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
      if (l.practiceLevelId) {
        expect(getLevelById(l.practiceLevelId), `${l.id}: no level ${l.practiceLevelId}`).not.toBeNull();
      } else {
        // Only a practice-only topic may leave it out; "Practice it now" then opens Play.
        for (const p of l.places) expect(TOPICS_BY_ID.get(p.skillId)?.levels, `${l.id} needs a practiceLevelId`).toEqual([]);
      }
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

  it('draws only what its pictures can hold', () => {
    const bad: string[] = [];
    for (const l of ALL_LESSONS) {
      for (const { scene, where } of scenes(l)) {
        const fail = (why: string) => bad.push(`${where}: ${why}`);
        switch (scene.kind) {
          case 'objects': if (scene.n < 0 || scene.n > 30) fail(`${scene.n} objects`); break;
          case 'pairs': if (scene.n < 0 || scene.n > 20) fail(`${scene.n} in pairs`); break;
          case 'groups': if (scene.groups < 1 || scene.groups > 10 || scene.size < 1 || scene.size > 10) fail('groups'); break;
          case 'tensOnes':
            if (scene.numbers.length < 1 || scene.numbers.length > 2) fail('tensOnes draws one or two numbers');
            if (scene.numbers.some((n) => !Number.isInteger(n) || n < 0 || n > 120)) fail(`tensOnes ${scene.numbers}`);
            break;
          case 'bond': {
            const [a, b] = scene.parts;
            if (scene.whole !== null && a !== null && b !== null && scene.whole !== a + b) fail(`bond ${scene.whole} ≠ ${a} + ${b}`);
            break;
          }
          case 'coins':
            if (scene.coins.length < 1 || scene.coins.length > 10) fail(`${scene.coins.length} coins`);
            if (scene.coins.some((c) => ![1, 5, 10, 25].includes(c))) fail(`coin ${scene.coins}`);
            break;
          case 'clock':
            if (scene.hour < 1 || scene.hour > 12 || scene.minute < 0 || scene.minute > 55 || scene.minute % 5) fail(`clock ${scene.hour}:${scene.minute}`);
            break;
          case 'pattern':
            if (scene.unit) {
              const off = scene.items.findIndex((item, i) => item !== scene.items[i % scene.unit!]);
              if (off >= 0) fail(`pattern breaks at item ${off + 1}`);
              if (scene.items.length < scene.unit * 2) fail('pattern shows its repeat fewer than twice');
            }
            break;
          case 'lengths':
            if (scene.items.length < 1 || scene.items.length > 4) fail('lengths draws 1 to 4 things');
            if (scene.items.some((i) => i.length < 1 || (i.start ?? 0) < 0 || (i.start ?? 0) + i.length > 14)) fail('length off the ruler');
            break;
          case 'fraction':
            if (scene.parts < 2 || scene.parts > 8 || scene.shaded < 0 || scene.shaded > scene.parts) fail(`fraction ${scene.shaded}/${scene.parts}`);
            break;
          case 'numberLine':
            if (scene.step !== undefined && (scene.step < 1 || !Number.isInteger(scene.step))) fail(`step ${scene.step}`);
            break;
        }
      }
    }
    expect(bad).toEqual([]);
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
      // Clocks, coins, tens and ones, pairs, fractions, counted things: once
      // she has it, the picture shows that answer and no other.
      const shown = shows(s.then.scene);
      if (shown !== null && sameKindOfAnswer(shown, s.answer)) {
        expect(shown, `${where}: the picture shows ${shown}, the answer is ${s.answer}`).toBe(s.answer);
      }
      if (s.then.scene.kind === 'bond') {
        const { whole, parts } = s.then.scene;
        expect(whole, `${where}: a solved bond has nothing missing`).toBe((parts[0] ?? NaN) + (parts[1] ?? NaN));
      }
    }
  });

  it('ask for the next thing in a pattern only when the pattern says what it is', () => {
    for (const { s, where } of tries) {
      if (s.kind !== 'try' || s.scene?.kind !== 'pattern' || !s.scene.blank || !s.scene.unit) continue;
      const { items, unit } = s.scene;
      expect(s.answer, where).toBe(items[items.length % unit]);
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

describe('a lesson in every topic', () => {
  // Play offers a lesson when she is stuck, but only from the topic she is
  // stuck in. A topic with no lesson meant struggling there went unanswered.
  //
  // Not written yet: the add & subtract unit's lessons start where first grade
  // does, so kindergarten's adding, taking away and doubles, the "1 more" and
  // "within 5" steps below them, the top of second grade, and the first story
  // and fact-family steps have none near. Take each one off as it gets one.
  const NOT_YET = new Set([
    'K: adding', 'K: taking-away', 'K: strategies',
    'adding rung 0', 'adding rung 1', 'adding rung 2', 'adding rung 6', 'adding rung 7',
    'taking-away rung 0', 'taking-away rung 1', 'taking-away rung 2', 'taking-away rung 6',
    'mystery-number rung 0', 'stories rung 0', 'stories rung 1', 'stories rung 2', 'stories rung 9',
    'fact-families rung 0',
  ]);

  it('has a lesson she can do, in every topic of every grade', () => {
    const missing: string[] = [];
    for (const grade of GRADES) {
      for (const [skillId, ceiling] of Object.entries(grade.ceilings)) {
        const interactive = lessonsFor(skillId, ceiling).filter((l) => INTERACTIVE_LESSONS.includes(l));
        if (interactive.length === 0) missing.push(`${grade.id}: ${skillId}`);
      }
    }
    expect(missing.filter((m) => !NOT_YET.has(m))).toEqual([]);
    expect([...NOT_YET].filter((m) => m.includes(':') && !missing.includes(m)), 'has a lesson now: take it off NOT_YET').toEqual([]);
  });

  it('has one near every rung a grade teaches', () => {
    // Within a rung either way, so whatever step she is moved down to, the
    // lesson offered is about roughly that step.
    const far: string[] = [];
    for (const skillId of SKILLS_BY_ID.keys()) {
      const top = Math.max(...GRADES.map((g) => g.ceilings[skillId] ?? -1));
      const rungs = INTERACTIVE_LESSONS.flatMap((l) => l.places.filter((p) => p.skillId === skillId).map((p) => p.rung));
      for (let r = 0; r <= top; r++) if (!rungs.some((x) => Math.abs(x - r) <= 1)) far.push(`${skillId} rung ${r}`);
    }
    expect(far.filter((f) => !NOT_YET.has(f))).toEqual([]);
    expect([...NOT_YET].filter((f) => f.includes('rung') && !far.includes(f)), 'has a lesson now: take it off NOT_YET').toEqual([]);
  });

  it('lists the old text slides only where nothing better teaches that rung', () => {
    for (const skillId of SKILLS_BY_ID.keys()) {
      const listed = lessonsFor(skillId, 99);
      for (const slide of listed.filter((l) => l.id.startsWith('read-'))) {
        const rung = slide.places.find((p) => p.skillId === skillId)!.rung;
        const better = INTERACTIVE_LESSONS.filter((l) => l.places.some((p) => p.skillId === skillId && p.rung === rung));
        expect(better.map((l) => l.id), `${slide.id} is listed beside a lesson that replaces it`).toEqual([]);
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

describe('Number Tricks lessons', () => {
  // Number Tricks mistakes were filed under Adding and Mystery Number until
  // its questions said which ladder they belong to. Filed in the right place,
  // they need lessons in that place for "do this lesson together" to work.

  it('has a lesson for doubles, making ten and counting on', () => {
    expect(lessonsFor('strategies', ceilingFor('strategies', '1')).map((l) => l.id))
      .toEqual(['doubles', 'make-ten', 'equals-same', 'count-on']);
  });

  it('finds the lesson for each Number Tricks mistake a parent is shown', () => {
    // Every tag a Number Tricks question carries except 'place-value', which
    // had no lesson before its mistakes were filed here either.
    expect(lessonForMistake('strategies', 'answered-a-given-number', 4, 1)?.id).toBe('doubles');
    expect(lessonForMistake('strategies', 'answered-the-whole', 4, 2)?.id).toBe('make-ten');
    expect(lessonForMistake('strategies', 'off-by-one', 4, 2)?.id).toBe('make-ten');
    expect(lessonForMistake('strategies', 'off-by-one', 4, 3)?.id).toBe('count-on');
    // "8 + ? = 10" answered 18: The Equals Sign is the lesson for adding the
    // two numbers shown, and it was the one offered while these were misfiled
    // under Mystery Number.
    expect(lessonForMistake('strategies', 'wrong-operation', 4, 2)?.id).toBe('equals-same');
  });

  it('only claims to help with mistakes the topic\'s questions can actually show', () => {
    // A tag no question in the topic carries could never be her commonest
    // mistake there, so a lesson claiming it would never be suggested.
    const bad: string[] = [];
    for (const l of ALL_LESSONS) {
      for (const p of l.places) {
        const skill = SKILLS_BY_ID.get(p.skillId)!;
        const seen = new Set<ErrorTag>();
        skill.rungs.forEach((_, rung) => {
          for (let i = 0; i < 150; i++) {
            for (const t of Object.values(questionForRung(skill, rung)?.distractorMeaning ?? {})) seen.add(t);
          }
        });
        for (const tag of l.helpsWith ?? []) if (!seen.has(tag)) bad.push(`${l.id} in ${p.skillId}: ${tag}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('"Practice it now"', () => {
  it('practises the level of the topic the lesson was opened from', () => {
    const countOn = LESSONS_BY_ID.get('count-on')!;
    expect(practiceLevelFor(countOn, 'strategies')?.id).toBe('strategy-count-on');
    expect(practiceLevelFor(countOn, 'adding')?.id).toBe('addition-3');
  });

  it('falls back to the lesson\'s own level when it was opened from nowhere in particular', () => {
    const countOn = LESSONS_BY_ID.get('count-on')!;
    expect(practiceLevelFor(countOn, null)?.id).toBe('addition-3');
    expect(practiceLevelFor(countOn, 'clocks')?.id, 'not one of its topics').toBe('addition-3');
  });

  it('stays inside the topic for every place every lesson has', () => {
    const bad: string[] = [];
    for (const l of ALL_LESSONS) {
      for (const p of l.places) {
        // A topic with no levels (Fractions) practises in Play instead.
        if (!TOPICS_BY_ID.get(p.skillId)?.levels.length) continue;
        const level = practiceLevelFor(l, p.skillId);
        if (!level || SKILL_FOR_LEVEL.get(level.id) !== p.skillId) bad.push(`${l.id} from ${p.skillId} -> ${level?.id}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

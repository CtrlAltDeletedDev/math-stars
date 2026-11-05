import { describe, it, expect } from 'vitest';
import {
  AddPattern, SubPattern, additionHint, subtractionHint,
  generateAdditionPattern, generateSubtractionPattern, questionFromId,
} from './questionGenerator';
import { SKILLS_BY_ID } from '@/data/skills';
import { ceilingFor } from '@/data/grades';
import { RUNG_REMAP_V7, buildInitialProgress, normalizeProgress } from '@/store/storage';
import { UserProgress } from '@/types';

// The fact strategies between "+2" and "within 20" (v7). Each pattern has to
// deliver the family of facts its rung is named for -- a "+9" rung that serves
// 4 + 3 is teaching nothing in particular -- and has to have enough distinct
// facts to fill a ten-question session.

const N = 600;

function parts(prompt: string): [number, number] {
  const m = prompt.match(/^(\d+) [+-] (\d+) = \?$/);
  if (!m) throw new Error(`not a plain sum: ${prompt}`);
  return [Number(m[1]), Number(m[2])];
}

const ADD: Record<AddPattern, (a: number, b: number) => boolean> = {
  countOn: (a, b) => Math.min(a, b) >= 1 && Math.min(a, b) <= 3 && a + b <= 20,
  plusTen: (a, b) => (a === 10 || b === 10) && a + b <= 20,
  nearDoubles: (a, b) => Math.abs(a - b) <= 1 && a + b <= 20,
  plusNine: (a, b) => (a === 9 || b === 9) && a + b > 10,
  bridge: (a, b) => a <= 9 && b <= 9 && a + b > 10,
};

const SUB: Record<SubPattern, (a: number, b: number) => boolean> = {
  countBack: (a, b) => b >= 1 && b <= 3 && a >= b && a <= 20,
  teenMinusTen: (a, b) => a >= 10 && a <= 19 && (b === 10 || b === a - 10),
  halves: (a, b) => Math.abs(a - 2 * b) <= 1 && a <= 20,
  minusNine: (a, b) => (b === 9 || b === 8) && a >= 11 && a <= 18,
  bridge: (a, b) => a >= 11 && a <= 18 && b <= 9 && b > a - 10,
};

describe('fact-strategy patterns', () => {
  for (const [pattern, fits] of Object.entries(ADD) as [AddPattern, typeof ADD.countOn][]) {
    it(`adding "${pattern}" serves only its own facts, enough of them`, () => {
      const ids = new Set<string>();
      for (let i = 0; i < N; i++) {
        const q = generateAdditionPattern(pattern);
        const [a, b] = parts(q.prompt);
        expect(fits(a, b), q.prompt).toBe(true);
        expect(Number(q.correctAnswer)).toBe(a + b);
        expect(q.choices).toContain(q.correctAnswer);
        ids.add(q.id);
      }
      expect(ids.size).toBeGreaterThanOrEqual(12);
    });
  }

  for (const [pattern, fits] of Object.entries(SUB) as [SubPattern, typeof SUB.countBack][]) {
    it(`taking away "${pattern}" serves only its own facts, enough of them`, () => {
      const ids = new Set<string>();
      for (let i = 0; i < N; i++) {
        const q = generateSubtractionPattern(pattern);
        const [a, b] = parts(q.prompt);
        expect(fits(a, b), q.prompt).toBe(true);
        expect(Number(q.correctAnswer)).toBe(a - b);
        ids.add(q.id);
      }
      expect(ids.size).toBeGreaterThanOrEqual(12);
    });
  }

  it('turns counting-on facts around some of the time', () => {
    // "2 + 9" is 9 + 2: knowing that is half of counting on.
    const small = (q: { prompt: string }) => parts(q.prompt)[0] <= 3 && parts(q.prompt)[1] > 3;
    const turned = Array.from({ length: N }, () => generateAdditionPattern('countOn')).filter(small).length;
    expect(turned).toBeGreaterThan(N * 0.2);
    expect(turned).toBeLessThan(N * 0.5);
  });

  it('is the same fact, id and SRS card as anywhere else', () => {
    for (let i = 0; i < 100; i++) {
      const q = generateAdditionPattern('bridge');
      expect(q.id).toMatch(/^add-\d+\+\d+$/);
      expect(questionFromId(q.id)?.correctAnswer).toBe(q.correctAnswer);
    }
  });
});

describe('strategy hints', () => {
  // A hint is shown after the first wrong tap, which has already been scored.
  // One that states the answer turns the retry into copying it.
  const numbersIn = (s: string) => (s.match(/\d+/g) ?? []).map(Number);

  it('every fact within 20 has one, and none gives the answer away', () => {
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; a + b <= 20; b++) {
        const hint = additionHint(a, b);
        expect(hint, `${a} + ${b}`).toBeTruthy();
        expect(numbersIn(hint), `${a} + ${b}: ${hint}`).not.toContain(a + b);
      }
    }
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= a; b++) {
        const hint = subtractionHint(a, b);
        const answer = a - b;
        expect(hint, `${a} - ${b}`).toBeTruthy();
        // The answer may appear only as a number she was already shown
        // ("6 - 3": count back 3), or as one hop of going back through ten.
        const incidental = answer === a || answer === b || hint.startsWith('Go back to 10');
        if (!incidental) expect(numbersIn(hint), `${a} - ${b}: ${hint}`).not.toContain(answer);
      }
    }
  });

  it('names the strategy the fact calls for', () => {
    expect(additionHint(2, 9)).toMatch(/Turn it around/);
    expect(additionHint(6, 7)).toMatch(/double/);
    expect(additionHint(9, 6)).toMatch(/one away from 10/);
    expect(additionHint(8, 5)).toMatch(/Make a ten/);
    expect(subtractionHint(13, 5)).toMatch(/back to 10/);
    expect(subtractionHint(12, 6)).toMatch(/double/);
    expect(subtractionHint(11, 9)).toMatch(/Count up/);
  });
});

describe('v7 migration', () => {
  // The rungs each ladder had in v6, by index. Saved rungs are indices, so the
  // only safe test is that every one of them still *means* the same thing.
  const V6: Record<string, string[]> = {
    adding: ['Adding 1 more', 'Adding 2 more', 'Adding within 5', 'Adding within 10', 'Adding within 20',
      'Adding within 50', 'Adding within 100', 'Adding within 200'],
    'taking-away': ['Taking away 1', 'Taking away 2', 'Subtracting within 5', 'Subtracting within 10',
      'Subtracting within 20', 'Subtracting within 50', 'Subtracting within 100'],
  };

  for (const [skillId, labels] of Object.entries(V6)) {
    it(`keeps every ${skillId} rung meaning what it meant`, () => {
      expect(RUNG_REMAP_V7[skillId]).toHaveLength(labels.length);
      labels.forEach((label, rung) => {
        const v6 = { ...buildInitialProgress(), version: 6 } as UserProgress;
        v6.skills = { [skillId]: { skillId, rung, recent: [true], attempts: 5, correct: 4, demotions: 1 } };
        const m = normalizeProgress(v6)!;
        expect(SKILLS_BY_ID.get(skillId)!.rungs[m.skills[skillId].rung].label).toBe(label);
        expect(m.skills[skillId].recent, 'same rung, same evidence').toEqual([true]);
      });
    });
  }

  it('does not remap a save that is already v7', () => {
    const v7 = { ...buildInitialProgress(), version: 7 } as UserProgress;
    v7.skills = { adding: { skillId: 'adding', rung: 5, recent: [], attempts: 0, correct: 0 } };
    expect(normalizeProgress(v7)!.skills.adding.rung).toBe(5);
  });

  it('still tops first grade out at within 20, kindergarten at within 10', () => {
    const label = (id: string, g: 'K' | '1' | '2') => SKILLS_BY_ID.get(id)!.rungs[ceilingFor(id, g)].label;
    expect(label('adding', 'K')).toBe('Adding within 10');
    expect(label('adding', '1')).toBe('Adding within 20');
    expect(label('adding', '2')).toBe('Adding within 200');
    expect(label('taking-away', 'K')).toBe('Subtracting within 10');
    expect(label('taking-away', '1')).toBe('Subtracting within 20');
    expect(label('taking-away', '2')).toBe('Subtracting within 100');
  });
});

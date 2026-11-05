import { describe, it, expect } from 'vitest';
import { UNITS, LESSONS } from './course';
import { Item, Lesson, TeachStep } from './types';

// Every lesson in the course, checked the same way. Whoever writes a lesson
// gets these for free: a "do" task she cannot finish, a question with two
// right answers, or a hint that gives the answer away fails here.

const SAMPLES = 40;
const PRONOUN = /\b(he|she|him|his|hers|herself|himself)\b/i;

function itemsOf(lesson: Lesson): Item[] {
  const gens = [lesson.practice, lesson.check, lesson.review].filter(Boolean) as (() => Item)[];
  const asked = lesson.teach.filter((s): s is Extract<TeachStep, { type: 'ask' }> => s.type === 'ask').map((s) => s.item);
  return [...asked, ...gens.flatMap((g) => Array.from({ length: SAMPLES }, g))];
}

function spoken(lesson: Lesson): string[] {
  const out: string[] = [];
  for (const s of lesson.teach) {
    out.push(s.type === 'ask' ? s.item.say : s.say);
    if (s.type !== 'ask' && s.caption) out.push(s.caption);
    if (s.type === 'do') { out.push(s.then); if (typeof s.hint === 'string') out.push(s.hint); }
  }
  return out;
}

describe('the course', () => {
  it('has unique lesson ids, written as kebab-case', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has unique unit ids', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
  });
});

for (const unit of UNITS) {
  describe(`unit: ${unit.title}`, () => {
    if (unit.lessons.length === 0) {
      it.todo('has lessons');
      return;
    }

    it('has at least three lessons, each with something to show and something to do', () => {
      expect(unit.lessons.length).toBeGreaterThanOrEqual(3);
      for (const l of unit.lessons) {
        expect(l.teach.some((s) => s.type === 'show'), `${l.id}: nothing shown`).toBe(true);
        expect(l.teach.some((s) => s.type === 'do'), `${l.id}: nothing for her to do`).toBe(true);
        expect(l.goal.length, `${l.id}: no goal for the grown-ups`).toBeGreaterThan(10);
      }
    });

    for (const lesson of unit.lessons) {
      describe(lesson.id, () => {
        it('has do tasks that need doing and can be done', () => {
          for (const [i, s] of lesson.teach.entries()) {
            if (s.type !== 'do') continue;
            expect(s.goal(s.model), `step ${i}: already done before she starts`).toBe(false);
            expect(s.solution.model, `step ${i}: solution is a different model`).toBe(s.model.model);
            expect(s.goal(s.solution), `step ${i}: the solution does not meet the goal`).toBe(true);
            if (typeof s.hint === 'function') expect(s.hint(s.model).length).toBeGreaterThan(0);
          }
        });

        it('asks questions with exactly one right answer', () => {
          for (const item of itemsOf(lesson)) {
            const where = `${item.id}: ${item.prompt}`;
            expect(item.id, where).toBeTruthy();
            expect(item.say.length, where).toBeGreaterThan(0);
            expect(item.prompt.length, where).toBeGreaterThan(0);
            expect(item.answer.length, where).toBeGreaterThan(0);
            if (item.input === 'number') {
              expect(item.answer, where).toMatch(/^\d{1,3}$/);
            } else if ('choices' in item.input) {
              const values = item.input.choices.map((c) => c.value);
              expect(values.length, where).toBeGreaterThanOrEqual(2);
              expect(values.length, where).toBeLessThanOrEqual(4);
              expect(new Set(values).size, `${where}: two choices the same`).toBe(values.length);
              expect(values.filter((v) => v === item.answer), `${where}: ${values}`).toHaveLength(1);
            } else {
              expect(item.input.goal(item.input.model), `${where}: already done`).toBe(false);
              expect(item.input.goal(item.input.solution), `${where}: solution fails`).toBe(true);
            }
          }
        });

        it('never lets the order of the choices give the answer away', () => {
          const gen = lesson.practice;
          const slots: number[] = [];
          for (let i = 0; i < 200; i++) {
            const item = gen();
            if (typeof item.input === 'object' && 'choices' in item.input) {
              slots.push(item.input.choices.findIndex((c) => c.value === item.answer));
            }
          }
          // Only the choice questions count: a practice can mix them with
          // number-pad ones, and comparing against all 200 failed at random.
          if (slots.length < 30) return;
          const counts = slots.reduce<Record<number, number>>((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {});
          const width = Math.max(...slots) + 1;
          if (width < 2) return;
          for (let k = 0; k < width; k++) expect(counts[k] ?? 0, `slot ${k} of ${width}`).toBeGreaterThan(slots.length / width / 3);
        });

        it('has hints that never state the answer', () => {
          for (const item of itemsOf(lesson)) {
            if (!item.hint || item.input !== 'number') continue;
            const inPrompt = new RegExp(`\\b${item.answer}\\b`).test(item.prompt);
            if (inPrompt) continue;
            expect(item.hint, `${item.id}: ${item.hint}`).not.toMatch(new RegExp(`(=|is|makes)\\s*${item.answer}\\b`));
          }
        });

        it('names its characters every time, never "he" or "she"', () => {
          for (const text of [...spoken(lesson), ...itemsOf(lesson).map((i) => i.say)]) {
            expect(text, text).not.toMatch(PRONOUN);
          }
        });
      });
    }
  });
}

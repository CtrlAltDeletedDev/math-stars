import { describe, it, expect } from 'vitest';
import type { Lesson, Scene, TryStep } from '@/data/learn';
import { NUMBER_BOND_LESSONS } from '@/data/learnTopics/numberBonds';
import { EVEN_ODD_LESSONS } from '@/data/learnTopics/evenOdd';
import { ErrorTag } from '@/types';

// What the generic lesson tests cannot see in Number Bonds and Even & Odd: that
// the bond drawn is the bond asked about, that each wrong choice is a mistake
// play really tags, and that every even/odd answer is the right parity.

const tries = (ls: Lesson[]) =>
  ls.flatMap((l) => l.steps.map((s, i) => ({ s, l, where: `${l.id} step ${i + 1}` })))
    .filter((x): x is { s: TryStep; l: Lesson; where: string } => x.s.kind === 'try');

/** "6 + ? = 10" → the part shown, where the gap is, and the whole. */
function missingPart(caption: string): { part: number; gap: 0 | 1; whole: number } | null {
  let m = caption.match(/^(\d+) \+ \? = (\d+)$/);
  if (m) return { part: +m[1], gap: 1, whole: +m[2] };
  m = caption.match(/^\? \+ (\d+) = (\d+)$/);
  if (m) return { part: +m[1], gap: 0, whole: +m[2] };
  return null;
}

/** What bondGen.ts tags each wrong answer to whole = part + ? as. */
function bondTag(whole: number, part: number, v: number): ErrorTag | null {
  const correct = whole - part;
  if (v === whole) return 'answered-the-whole';
  if (v === part) return 'answered-a-given-number';
  if (v === whole + part) return 'wrong-operation';
  if (whole === 20 && correct !== 10 && v === (correct > 10 ? correct - 10 : correct + 10)) return 'place-value';
  if (Math.abs(v - correct) === 1) return 'off-by-one';
  return null;
}

describe('Number Bonds lessons', () => {
  const asked = tries(NUMBER_BOND_LESSONS).map((t) => ({ ...t, q: missingPart(t.s.caption) }));

  it('ask for a missing part every time, and mark the part that makes the whole', () => {
    for (const { s, q, where } of asked) {
      expect(q, `${where}: "${s.caption}"`).not.toBeNull();
      expect(Number(s.answer), where).toBe(q!.whole - q!.part);
    }
  });

  it('draw the bond being asked about, and fill in the gap with the answer', () => {
    const check = (scene: Scene | undefined, q: NonNullable<ReturnType<typeof missingPart>>, fill: number | null, where: string) => {
      if (scene?.kind === 'bond') {
        const parts: [number | null, number | null] = q.gap === 1 ? [q.part, fill] : [fill, q.part];
        expect({ whole: scene.whole, parts: scene.parts }, where).toEqual({ whole: q.whole, parts });
      } else if (scene?.kind === 'tenFrame') {
        expect(q.whole, `${where}: a ten frame only shows bonds to 10`).toBe(10);
        expect(scene.first, where).toBe(q.part);
        expect(scene.second ?? null, where).toBe(fill);
      }
    };
    for (const { s, q, where } of asked) {
      check(s.scene, q!, null, `${where} (question)`);
      check(s.then.scene, q!, Number(s.answer), `${where} (answer)`);
    }
  });

  it('show the sum its caption says', () => {
    for (const l of NUMBER_BOND_LESSONS) {
      for (const [i, s] of l.steps.entries()) {
        const m = s.caption.match(/^(\d+) (?:\+|and) (\d+) (?:=|make) (\d+)$/);
        if (!m || s.scene?.kind !== 'bond') continue;
        expect(s.scene, `${l.id} step ${i + 1}`).toMatchObject({ whole: +m[3], parts: [+m[1], +m[2]] });
      }
    }
  });

  it('offer only the mistakes play tags, and claim only mistakes a hint is written for', () => {
    for (const l of NUMBER_BOND_LESSONS) {
      const hinted = new Set<ErrorTag>();
      for (const { s, q, where } of asked.filter((a) => a.l === l)) {
        for (const c of s.choices.filter((c) => c !== s.answer)) {
          const tag = bondTag(q!.whole, q!.part, Number(c));
          expect(tag, `${where}: ${c} is not a mistake play offers for "${s.caption}"`).not.toBeNull();
          hinted.add(tag!);
        }
      }
      for (const tag of l.helpsWith ?? []) expect(hinted.has(tag), `${l.id} claims ${tag} with no hint for it`).toBe(true);
    }
  });
});

describe('Even & Odd lessons', () => {
  const parity = (n: number) => (n % 2 === 0 ? 'Even' : 'Odd');

  it('answer "Is 7 even or odd?" with its parity, and pair up that number to show it', () => {
    let checked = 0;
    for (const { s, where } of tries(EVEN_ODD_LESSONS)) {
      const m = s.caption.match(/^Is (\d+) even or odd\?$/);
      if (!m) continue;
      checked++;
      expect(s.answer, where).toBe(parity(+m[1]));
      expect(s.then.scene, where).toMatchObject({ kind: 'pairs', n: +m[1] });
    }
    expect(checked).toBeGreaterThan(2);
  });

  it('offer exactly one number of the kind asked for in "Which number is even?"', () => {
    let checked = 0;
    for (const { s, where } of tries(EVEN_ODD_LESSONS)) {
      const m = s.caption.match(/^Which number is (even|odd)\?$/);
      if (!m) continue;
      checked++;
      const want = m[1] === 'even' ? 'Even' : 'Odd';
      expect(s.choices.filter((c) => parity(+c) === want), where).toEqual([s.answer]);
    }
    expect(checked).toBeGreaterThan(2);
  });

  it('land the next even number two on, by a hop of 2', () => {
    for (const { s, where } of tries(EVEN_ODD_LESSONS)) {
      const m = s.caption.match(/^Next (even|odd) after (\d+)\?$/);
      if (!m) continue;
      const n = +m[2];
      const next = n + (parity(n) === (m[1] === 'even' ? 'Even' : 'Odd') ? 2 : 1);
      expect(Number(s.answer), where).toBe(next);
      const sc = s.then.scene;
      expect(sc?.kind === 'numberLine' && sc.start + (sc.hops ?? 0) * (sc.step ?? 1), where).toBe(next);
    }
  });

  it('count by 2s from an even number, so every landing is even', () => {
    for (const l of EVEN_ODD_LESSONS) {
      for (const s of l.steps) {
        for (const sc of [s.scene, s.kind === 'try' ? s.then.scene : undefined]) {
          if (sc?.kind === 'numberLine' && sc.hops) {
            expect(sc.step, l.id).toBe(2);
            expect(sc.start % 2, `${l.id}: hops of 2 from ${sc.start}`).toBe(0);
          }
        }
      }
    }
  });

  it('say "6 is even" only where the picture pairs up 6', () => {
    for (const l of EVEN_ODD_LESSONS) {
      for (const [i, s] of l.steps.entries()) {
        for (const [text, sc] of [[s.caption, s.scene], ...(s.kind === 'try' ? [[s.then.caption ?? '', s.then.scene] as const] : [])] as const) {
          const m = text.match(/^(\d+)(?: \S+)?(?: is|:) (even|odd)$/);
          if (!m) continue;
          expect(m[2], `${l.id} step ${i + 1}: "${text}"`).toBe(parity(+m[1]).toLowerCase());
          if (sc?.kind === 'pairs') expect(sc.n, `${l.id} step ${i + 1}`).toBe(+m[1]);
        }
      }
    }
  });
});

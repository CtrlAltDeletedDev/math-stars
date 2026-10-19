import { describe, it, expect } from 'vitest';
import type { Lesson, Scene } from '@/data/learn';
import { COUNTING_LESSONS } from '@/data/learnTopics/counting';
import { COUNTING_UP_LESSONS } from '@/data/learnTopics/countingUp';

// What the generic lesson tests cannot see in Counting and Skip Counting: that
// a number pattern's marked answer is the one the pattern gives, that the guide
// says the same numbers the picture counts out, and that "how many?" asks
// about what is really in the picture.

const LESSONS: Lesson[] = [...COUNTING_LESSONS, ...COUNTING_UP_LESSONS];

const steps = () => LESSONS.flatMap((l) => l.steps.map((s, i) => ({ s, where: `${l.id} step ${i + 1}` })));

/** "12, 14, 16, ?", "?, 10, 11", "12, ?, 14" → what the ? must be. Null if the caption is no pattern, NaN if it is a broken one. */
function patternAnswer(caption: string): number | null {
  const parts = caption.split(',').map((p) => p.trim());
  if (parts.length < 3 || parts.filter((p) => p === '?').length !== 1) return null;
  if (!parts.every((p) => p === '?' || /^\d+$/.test(p))) return null;
  const known = parts.flatMap((p, i) => (p === '?' ? [] : [[i, Number(p)] as const]));
  const [[i0, v0], [i1, v1]] = known;
  const step = (v1 - v0) / (i1 - i0);
  if (known.some(([i, v]) => v !== v0 + (i - i0) * step)) return NaN;
  return v0 + (parts.indexOf('?') - i0) * step;
}

/** The one number a picture ends on, for the pictures these lessons play through. */
function endsOn(scene: Scene): number | null {
  switch (scene.kind) {
    case 'numberLine': return scene.hops ? scene.start + (scene.dir ?? 1) * scene.hops * (scene.step ?? 1) : null;
    case 'groups': return scene.groups * scene.size;
    case 'tensOnes': return scene.numbers.length === 1 ? scene.numbers[0] : null;
    case 'objects': return scene.n;
    default: return null;
  }
}

/** The numbers a moving picture counts out, in order, or null if it counts nothing aloud. */
function countsOut(scene: Scene): number[] | null {
  switch (scene.kind) {
    case 'groups': return scene.counting ? Array.from({ length: scene.groups }, (_, i) => (i + 1) * scene.size) : null;
    case 'coins': return scene.counting ? scene.coins.map((_, i) => scene.coins.slice(0, i + 1).reduce((a, b) => a + b, 0)) : null;
    // Past ten the guide counts on from the ten instead of saying every number.
    case 'objects': return scene.counting && scene.n <= 10 ? Array.from({ length: scene.n }, (_, i) => i + 1) : null;
    case 'numberLine':
      return scene.animate && scene.hops
        ? Array.from({ length: scene.hops }, (_, i) => scene.start + (scene.dir ?? 1) * (i + 1) * (scene.step ?? 1))
        : null;
    default: return null;
  }
}

describe('Counting and Skip Counting lessons', () => {
  it('mark the number every pattern gives, and play the picture through to it', () => {
    let checked = 0;
    for (const { s, where } of steps()) {
      if (s.kind !== 'try') continue;
      const expected = patternAnswer(s.caption);
      if (expected === null) continue;
      checked++;
      expect(Number(s.answer), `${where}: "${s.caption}"`).toBe(expected);
      expect(s.then.scene && endsOn(s.then.scene), `${where}: the picture ends somewhere else`).toBe(expected);
    }
    expect(checked).toBeGreaterThanOrEqual(8);
  });

  it('say the numbers their pictures count out, in the same order', () => {
    // A hop line that lands on 25 while the guide says "5, 10, 15, 20" teaches
    // the wrong count; so does counting 7 ducks out loud over a picture of 8.
    for (const { s, where } of steps()) {
      const pairs: [string, Scene | undefined][] = [[s.say, s.scene]];
      if (s.kind === 'try') pairs.push([s.then.say, s.then.scene]);
      for (const [said, scene] of pairs) {
        const run = scene && countsOut(scene);
        if (!run) continue;
        expect(said, `${where}: should say ${run.join(', ')}`).toMatch(new RegExp(`(^|\\D)${run.join(', ')}(\\D|$)`));
      }
    }
  });

  it('hop by 2s, 5s and 10s only onto numbers she says when counting that way', () => {
    for (const { s, where } of steps()) {
      for (const scene of [s.scene, s.kind === 'try' ? s.then.scene : undefined]) {
        if (scene?.kind !== 'numberLine' || !scene.step || scene.step === 1) continue;
        expect(scene.start % scene.step, `${where}: starts between ${scene.step}s`).toBe(0);
        expect(scene.max % scene.step, `${where}: the line ends between ${scene.step}s`).toBe(0);
      }
    }
  });

  it('ask how many only about what the picture holds', () => {
    let checked = 0;
    for (const { s, where } of steps()) {
      // "How many 🍎?" on a try, or "Only the 🐶: 3" shown on a watch step.
      const ask = s.kind === 'try' ? s.caption.match(/^How many (.+)\?$/u) : s.caption.match(/^Only the (.+): (\d+)$/u);
      if (!ask || !s.scene) continue;
      const [, thing, said] = ask;
      const answer = s.kind === 'try' ? s.answer : said;
      if (s.scene.kind === 'objects') {
        expect(s.scene.emoji, where).toBe(thing);
        expect(String(s.scene.n), where).toBe(answer);
      } else if (s.scene.kind === 'big') {
        // Two kinds mixed together: only the kind asked about is counted.
        expect(String(s.scene.text.split(thing).length - 1), `${where}: ${s.scene.text}`).toBe(answer);
      } else continue;
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });
});

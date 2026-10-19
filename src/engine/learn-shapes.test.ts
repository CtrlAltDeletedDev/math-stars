import { describe, it, expect } from 'vitest';
import type { Lesson, Scene, TryStep } from '@/data/learn';
import { SHAPE_LESSONS } from '@/data/learnTopics/shapes';
import { MEASURING_LESSONS } from '@/data/learnTopics/measuring';

// What the generic lesson tests cannot see in Shapes & Patterns and Measuring:
// that a caption names the shape and the count that is drawn; that the answer
// to "what comes next?" is what the pattern's repeat (or its jump) says even
// when the try hides the repeat; and that "which is longer / heavier?" is
// answered by the picture that plays once she has it.

const LESSONS: Lesson[] = [...SHAPE_LESSONS, ...MEASURING_LESSONS];
const SIDES: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8, circle: 0 };

const tries = LESSONS.flatMap((l) =>
  l.steps.flatMap((s, i) => (s.kind === 'try' ? [{ s: s as TryStep, where: `${l.id} step ${i + 1}` }] : [])));

/** Every caption with the picture it sits over. */
const captioned = LESSONS.flatMap((l) => l.steps.flatMap((s, i) => {
  const where = `${l.id} step ${i + 1}`;
  const out: { caption: string; scene?: Scene; where: string }[] = [{ caption: s.caption, scene: s.scene, where }];
  if (s.kind === 'try' && s.then.caption) out.push({ caption: s.then.caption, scene: s.then.scene ?? s.scene, where });
  return out;
}));

describe('shape and measuring lessons', () => {
  it('speak no emoji and no symbols', () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const said = [s.say, ...(s.kind === 'try' ? [s.then.say, ...Object.values(s.hints ?? {})] : [])];
        for (const words of said) expect(words, `${l.id}: "${words}"`).not.toMatch(/\p{Extended_Pictographic}|¢|[<>=]/u);
      }
    }
  });

  it('name in a caption only the shape, and the count, that is drawn', () => {
    for (const { caption, scene, where } of captioned) {
      if (scene?.kind !== 'shape') continue;
      for (const name of caption.toLowerCase().match(/triangle|square|rectangle|pentagon|hexagon|octagon|circle/g) ?? []) {
        expect(name, `${where}: "${caption}"`).toBe(scene.shape);
      }
      if (scene.mark) for (const n of caption.match(/\d+/g) ?? []) expect(Number(n), `${where}: "${caption}"`).toBe(SIDES[scene.shape]);
    }
  });

  it('finish a pattern with the thing its repeat, or its jump, says comes next', () => {
    let checked = 0;
    for (const { s, where } of tries) {
      if (s.scene?.kind !== 'pattern' || !s.scene.blank) continue;
      checked++;
      const { items } = s.scene;
      const then = s.then.scene;
      if (items.every((x) => /^\d+$/.test(x))) {
        // A number pattern: the same jump every time, and the picture hops it.
        const nums = items.map(Number);
        const jump = nums[1] - nums[0];
        expect(nums.every((n, i) => i === 0 || n - nums[i - 1] === jump), `${where}: not one jump`).toBe(true);
        expect(Number(s.answer), where).toBe(nums[nums.length - 1] + jump);
        expect(then?.kind === 'numberLine' && [then.start, then.step, then.hops], `${where}: the line hops the pattern`)
          .toEqual([nums[0], jump, nums.length]);
      } else {
        // Shown with its repeat boxed once she has it, and the repeat holds all the way.
        expect(then?.kind === 'pattern' && then.items, `${where}: the answer goes on the end`).toEqual([...items, s.answer]);
        const unit = then?.kind === 'pattern' ? then.unit : undefined;
        expect(unit, `${where}: the repeat is boxed`).toBeDefined();
        expect([...items, s.answer].every((x, i) => x === items[i % unit!]), where).toBe(true);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it('answer "which is longer?" with the lined-up picture', () => {
    let checked = 0;
    for (const { s, where } of tries) {
      const pic = s.then.scene ?? s.scene;
      if (pic?.kind !== 'lengths' || pic.items.length < 2) continue;
      checked++;
      expect(pic.items.every((i) => !i.start), `${where}: once she has it, the ends are lined up`).toBe(true);
      const lengths = pic.items.map((i) => i.length);
      if (s.answer === 'Same length') {
        expect(new Set(lengths).size, where).toBe(1);
        continue;
      }
      const want = /shorter/.test(s.say) ? Math.min(...lengths) : Math.max(...lengths);
      expect(lengths.filter((n) => n === want), `${where}: a tie`).toHaveLength(1);
      const item = pic.items.find((i) => i.length === want)!;
      expect(s.answer.toLowerCase(), where).toContain(item.label.toLowerCase());
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  it('answer "which is heavier?" with the side that goes down', () => {
    let checked = 0;
    for (const { s, where } of tries) {
      const pic = s.then.scene ?? s.scene;
      if (pic?.kind !== 'weigh') continue;
      checked++;
      const [heavy, light] = pic.heavier === 'left' ? [pic.left, pic.right] : [pic.right, pic.left];
      const wantsLight = /lighter|weighs less/.test(s.say);
      expect(s.answer.startsWith(wantsLight ? light : heavy), `${where}: ${s.answer}`).toBe(true);
    }
    expect(checked).toBeGreaterThanOrEqual(2);
  });
});

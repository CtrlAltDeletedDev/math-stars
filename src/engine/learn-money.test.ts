import { describe, it, expect } from 'vitest';
import type { Lesson, Scene, TryStep } from '@/data/learn';
import { MONEY_LESSONS } from '@/data/learnTopics/money';
import { FRACTION_LESSONS } from '@/data/learnTopics/fractions';
import { moneyFromId } from '@/data/moneyGen';
import { fractionFromId } from '@/data/fractions';
import { ErrorTag, Question } from '@/types';

// Money and Fractions lessons ask the questions play asks, in play's own words
// ("How much is 4 nickels?", "You have 25¢ and you spend 21¢", "What fraction is
// shaded?"). So each "try" can be rebuilt as the play question it imitates and
// checked against it: the same answer, wrong choices play really offers, and a
// helpsWith that names only tags play gives one of those wrong choices. The
// generic tests check the picture a "try" ends on; these also check the one it
// asks about, and that the guide says the totals a picture counts out.

const tries = (ls: Lesson[]) =>
  ls.flatMap((l) => l.steps.flatMap((s, i) => (s.kind === 'try' ? [{ lesson: l, s, where: `${l.id} step ${i + 1}` }] : [])));

const COIN: Record<string, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
const SINGULAR: Record<string, string> = { nickels: 'nickel', dimes: 'dime', quarters: 'quarter' };
const DENOMINATOR: Record<string, number> = { half: 2, third: 3, fourth: 4 };

/** The play question a money "try" asks, by its card id, from its caption and picture. */
function moneyId(s: TryStep): string | null {
  let m: RegExpMatchArray | null;
  if ((m = s.caption.match(/^1 (penny|nickel|dime|quarter) = \?$/))) return `money-name-${m[1]}`;
  if ((m = s.caption.match(/^How much is (\d+) (nickels|dimes|quarters)\?$/))) return `money-like-${SINGULAR[m[2]]}-${m[1]}`;
  if ((m = s.caption.match(/^Have (\d+)¢\. Spend (\d+)¢\. Left\?$/))) return `money-change-${m[1]}-${m[2]}`;
  if (s.caption === 'How much money is this?' && s.scene?.kind === 'coins') {
    return `money-mixed-${[...s.scene.coins].sort((a, b) => b - a).join('-')}`;
  }
  return null;
}

/** The play question a fractions "try" asks, or null for "is it cut into halves?", which play never asks. */
function fractionId(s: TryStep): string | null {
  let m: RegExpMatchArray | null;
  if (s.caption === 'What fraction is shaded?' && s.scene?.kind === 'fraction') {
    return `frac-shaded-bar-${s.scene.shaded}-${s.scene.parts}`;
  }
  if ((m = s.caption.match(/^Which one is 1 (half|third|fourth)\?$/))) return `frac-which-bar-${DENOMINATOR[m[1]]}`;
  if (s.caption === 'Which is bigger?' && s.scene?.kind === 'big') {
    return `frac-cmp-biggest-${[...s.scene.text.matchAll(/1\/(\d+)/g)].map((d) => d[1]).join('-')}`;
  }
  return null;
}

/** Deal a play question many times: its wrong options, and their tags, are dealt at random. */
function deal(id: string, build: (id: string) => Question | null) {
  const offered = new Map<string, ErrorTag | undefined>();
  let answer: string | null = null;
  for (let i = 0; i < 400; i++) {
    const q = build(id);
    if (!q) return null;
    answer = q.correctAnswer;
    for (const c of q.choices) if (c !== q.correctAnswer && !offered.get(c)) offered.set(c, q.distractorMeaning?.[c]);
  }
  return { answer: answer!, offered };
}

/** Do these numbers come up in this order in what the guide says? */
function saysInOrder(text: string, numbers: number[]): boolean {
  let at = 0;
  for (const n of numbers) {
    const found = new RegExp(`(^|\\D)${n}(?!\\d)`, 'g');
    found.lastIndex = at;
    const hit = found.exec(text);
    if (!hit) return false;
    at = hit.index + hit[0].length;
  }
  return true;
}

/** The totals a moving picture counts out, in order, or null if it counts nothing. */
function countsOut(scene: Scene): number[] | null {
  if (scene.kind === 'coins' && scene.counting) return scene.coins.map((_, i) => scene.coins.slice(0, i + 1).reduce((a, b) => a + b, 0));
  if (scene.kind === 'numberLine' && scene.animate && scene.hops) {
    return Array.from({ length: scene.hops }, (_, i) => scene.start + (scene.dir ?? 1) * (i + 1) * (scene.step ?? 1));
  }
  return null;
}

describe('Money lessons', () => {
  it('ask the question play asks, about the picture shown, with the wrong answers play offers', () => {
    let asked = 0;
    for (const { s, where } of tries(MONEY_LESSONS)) {
      const id = moneyId(s);
      if (!id) {
        // The one question play does not ask: which of two coins is worth more.
        expect(s.caption, `${where}: "${s.caption}" is not a question play asks`).toBe('Which is worth more?');
        const coins = s.scene?.kind === 'coins' ? s.scene.coins : [];
        expect(COIN[s.answer.toLowerCase()], where).toBe(Math.max(...coins));
        continue;
      }
      asked++;
      const play = deal(id, moneyFromId);
      expect(play, `${where}: play cannot ask ${id}`).not.toBeNull();
      expect(s.answer, `${where}: ${id}`).toBe(play!.answer);
      for (const c of s.choices.filter((c) => c !== s.answer)) {
        expect(play!.offered.has(c), `${where}: play never offers ${c} for ${id}`).toBe(true);
      }

      // The picture asked about is the one in the caption.
      const scene = s.scene!;
      let m: RegExpMatchArray | null;
      if ((m = id.match(/^money-like-(\w+)-(\d+)$/))) {
        expect(scene.kind === 'coins' && scene.coins, where).toEqual(Array(+m[2]).fill(COIN[m[1]]));
      } else if ((m = id.match(/^money-change-(\d+)-(\d+)$/))) {
        const shown = scene.kind === 'partWhole' ? [scene.whole, scene.parts[0]] : scene.kind === 'numberLine' ? [scene.max, scene.start] : null;
        expect(shown, `${where}: the picture is not "have ${m[1]}, spend ${m[2]}"`).toEqual([+m[1], +m[2]]);
      } else if (id.startsWith('money-mixed-')) {
        // Counted from the coin worth the most, the way the guide says to.
        const counted = s.then.scene?.kind === 'coins' ? s.then.scene.coins : [];
        expect(`money-mixed-${counted.join('-')}`, `${where}: not counted biggest first`).toBe(id);
      }
    }
    expect(asked).toBeGreaterThanOrEqual(10);
  });

  it('claim to help only with mistakes play tags on one of their own wrong choices', () => {
    for (const l of MONEY_LESSONS) {
      const tagged = new Set<ErrorTag>();
      for (const { s } of tries([l])) {
        const id = moneyId(s);
        const play = id ? deal(id, moneyFromId) : null;
        for (const c of s.choices) {
          const tag = play?.offered.get(c);
          if (c !== s.answer && tag) tagged.add(tag);
        }
      }
      for (const tag of l.helpsWith ?? []) expect(tagged.has(tag), `${l.id}: no wrong choice means ${tag}`).toBe(true);
    }
  });

  it('say the totals their pictures count out, in the same order', () => {
    // Coins counting "25, 35, 40, 41" under a guide who says something else
    // teaches two different counts at once.
    for (const l of MONEY_LESSONS) {
      l.steps.forEach((s, i) => {
        const pairs: [string, Scene | undefined][] = [[s.say, s.scene]];
        if (s.kind === 'try') pairs.push([s.then.say, s.then.scene]);
        for (const [said, scene] of pairs) {
          const run = scene && countsOut(scene);
          if (run) expect(saysInOrder(said, run), `${l.id} step ${i + 1}: should say ${run.join(', ')}`).toBe(true);
        }
      });
    }
  });
});

describe('Fractions lessons', () => {
  it('ask the question play asks, about the picture shown, with the wrong answers play offers', () => {
    let asked = 0;
    for (const { s, where } of tries(FRACTION_LESSONS)) {
      const id = fractionId(s);
      if (!id) {
        // "Is it cut into halves?" The answer is no exactly when the parts are not equal.
        const m = s.caption.match(/^Is it cut into (halves|thirds|fourths)\?$/);
        expect(m, `${where}: "${s.caption}" is not a question play asks`).not.toBeNull();
        const scene = s.scene?.kind === 'fraction' ? s.scene : null;
        expect(scene?.parts, where).toBe({ halves: 2, thirds: 3, fourths: 4 }[m![1]]);
        expect(s.answer, where).toBe(scene?.unequal ? 'No' : 'Yes');
        continue;
      }
      asked++;
      const play = deal(id, fractionFromId);
      expect(play, `${where}: play cannot ask ${id}`).not.toBeNull();
      expect(s.answer, `${where}: ${id}`).toBe(play!.answer);
      for (const c of s.choices.filter((c) => c !== s.answer)) {
        expect(play!.offered.has(c), `${where}: play never offers ${c} for ${id}`).toBe(true);
      }
    }
    expect(asked).toBeGreaterThanOrEqual(6);
  });
});

describe('Money and Fractions lessons', () => {
  it('never hand the speech a sign it would read out wrong', () => {
    // "25¢" is read as "25 cent sign" or skipped, and "1/4" as a date.
    for (const l of [...MONEY_LESSONS, ...FRACTION_LESSONS]) {
      l.steps.forEach((s, i) => {
        const said = [s.say, ...(s.kind === 'try' ? [s.then.say, ...Object.values(s.hints ?? {})] : [])];
        for (const words of said) expect(words, `${l.id} step ${i + 1}`).not.toMatch(/¢|\d\s*\/\s*\d|\d:\d\d/);
      });
    }
  });
});

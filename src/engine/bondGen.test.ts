import { describe, it, expect } from 'vitest';
import { Question, ErrorTag } from '@/types';
import { generateBondQuestion, bondFromId, BOND_ID_PATTERN } from '@/data/bondGen';

// The number-bond generator the practice ladder deals from. Everything here
// re-derives the answer from what she is shown — the numbers in the prompt and
// the pairs on the buttons — and never trusts `correctAnswer`.

const RUNGS = [
  ['bonds to 5 and 10', { operation: 'bond', targets: '5,10' }, [5, 10]],
  ['bonds to 20', { operation: 'bond', targets: '5,10,20' }, [5, 10, 20]],
] as const;

const SAMPLE = 4000;

const sample = (params: Record<string, number | string>, n = SAMPLE): Question[] =>
  Array.from({ length: n }, () => generateBondQuestion(params));

const EMOJI: Record<number, string> = { 5: '🖐️', 10: '🔟', 20: '2️⃣0️⃣' };

type Read =
  | { shape: 'missing'; whole: number; part: number; gapFirst: boolean }
  | { shape: 'pair'; whole: number };

/** What the prompt asks, read only from the prompt. */
function read(q: Question): Read {
  let m = q.prompt.match(/^(\d+) \+ \? = (\d+)$/);
  if (m) return { shape: 'missing', part: Number(m[1]), whole: Number(m[2]), gapFirst: false };
  m = q.prompt.match(/^\? \+ (\d+) = (\d+)$/);
  if (m) return { shape: 'missing', part: Number(m[1]), whole: Number(m[2]), gapFirst: true };
  m = q.prompt.match(/^Which two numbers make (\d+)\?$/);
  if (m) return { shape: 'pair', whole: Number(m[1]) };
  throw new Error(`unrecognised prompt: ${q.prompt}`);
}

/** "3 + 7" → [3, 7], or null if the option is not written that way. */
function readPair(option: string): [number, number] | null {
  const m = option.match(/^(\d+) \+ (\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** The one option that is right, worked out from the prompt and the options alone. */
function solve(q: Question): string {
  const r = read(q);
  expect(q.promptEmoji, q.id).toBe(EMOJI[r.whole]);
  if (r.shape === 'missing') {
    const right = q.choices.filter((c) => /^\d+$/.test(c) && r.part + Number(c) === r.whole);
    expect(right, `${q.prompt}: ${q.choices}`).toHaveLength(1);
    return right[0];
  }
  const pairs = q.choices.map(readPair);
  expect(pairs.every((p) => p !== null), `${q.id}: ${q.choices}`).toBe(true);
  const right = q.choices.filter((_, i) => pairs[i]![0] + pairs[i]![1] === r.whole);
  expect(right, `${q.prompt}: ${q.choices}`).toHaveLength(1);
  return right[0];
}

const numbersIn = (text: string): string[] => text.match(/\d+/g) ?? [];
const isMissing = (q: Question) => read(q).shape === 'missing';
const wholeOf = (q: Question) => read(q).whole;

describe.each(RUNGS)('%s', (_label, params, wholes) => {
  const qs = sample(params);
  const top = Math.max(...wholes);

  it('offers 2 to 4 distinct options, the answer among them', () => {
    for (const q of qs) {
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.choices.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.choices).size, `${q.id}: ${q.choices}`).toBe(q.choices.length);
      expect(q.choices, q.id).toContain(q.correctAnswer);
    }
  });

  it('marks the one option that actually makes the whole', () => {
    for (const q of qs) expect(solve(q), `${q.id}: ${q.prompt} ${q.choices}`).toBe(q.correctAnswer);
  });

  it('is a number_bond question with nothing borrowed from another ladder', () => {
    for (const q of qs) {
      expect(q.type).toBe('number_bond');
      expect(q.skill).toBeUndefined();
      expect(q.id.startsWith('gbond-'), q.id).toBe(true);
      expect(q.prompt.length, q.prompt).toBeLessThanOrEqual(40);
    }
  });

  it('stays inside its rung', () => {
    const seen = new Set(qs.map(wholeOf));
    expect([...seen].sort((a, b) => a - b)).toEqual([...wholes]);
    for (const q of qs) {
      const r = read(q);
      if (r.shape === 'missing') {
        expect(r.part, q.id).toBeLessThanOrEqual(r.whole);
        // Bonds with 0 in them are left to the second rung.
        if (top === 10) expect(r.part > 0 && r.part < r.whole, q.id).toBe(true);
      } else {
        expect(r.whole, q.id).not.toBe(5);
        for (const c of q.choices) {
          for (const v of readPair(c)!) {
            expect(v, `${q.id}: ${c}`).toBeGreaterThanOrEqual(1);
            expect(v, `${q.id}: ${c}`).toBeLessThan(r.whole);
          }
        }
      }
      expect([1, 2, 3]).toContain(q.difficulty);
      if (top === 10) expect(q.difficulty, q.id).toBe(1);
      if (r.whole === 20) expect(q.difficulty, q.id).toBe(2);
    }
  });

  it(top === 10 ? 'is mostly bonds to 10' : 'is mostly bonds to 20', () => {
    const share = qs.filter((q) => wholeOf(q) === top).length / qs.length;
    expect(share).toBeGreaterThan(0.55);
    expect(share).toBeLessThan(0.8);
  });

  it('asks the gap both ways round, and sometimes which two numbers make it', () => {
    const missing = qs.filter(isMissing);
    const first = missing.filter((q) => q.prompt.startsWith('?')).length / missing.length;
    expect(first).toBeGreaterThan(0.4);
    expect(first).toBeLessThan(0.6);
    const pairs = qs.filter((q) => !isMissing(q)).length / qs.length;
    expect(pairs).toBeGreaterThan(0.05);
    expect(pairs).toBeLessThan(0.3);
  });

  it('gives every bond its turn', () => {
    for (const whole of wholes) {
      const answers = qs.filter((q) => isMissing(q) && wholeOf(q) === whole).map((q) => Number(q.correctAnswer));
      const nonZero = answers.filter((a) => a > 0 && a < whole);
      for (let a = 1; a < whole; a++) {
        const share = nonZero.filter((v) => v === a).length / nonZero.length;
        expect(share, `${whole}: answer ${a}`).toBeGreaterThan(0.5 / (whole - 1));
        expect(share, `${whole}: answer ${a}`).toBeLessThan(2 / (whole - 1));
      }
    }
  });

  it('does not park the answer at a predictable rank, for any whole', () => {
    for (const whole of wholes) {
      const ranks = [0, 0, 0, 0];
      const these = qs.filter((q) => isMissing(q) && wholeOf(q) === whole);
      for (const q of these) {
        expect(q.choices, q.id).toHaveLength(4);
        const nums = q.choices.map(Number).sort((a, b) => a - b);
        ranks[nums.indexOf(Number(q.correctAnswer))]++;
      }
      const shares = ranks.map((r) => r / these.length);
      expect(Math.max(...shares), `${whole}: ${shares}`).toBeLessThan(0.45);
      expect(Math.min(...shares), `${whole}: ${shares}`).toBeGreaterThan(0.08);
    }
  });

  it('never offers four in a row, and rarely three around the answer', () => {
    const missing = qs.filter(isMissing);
    let sandwich = 0;
    for (const q of missing) {
      const nums = q.choices.map(Number).sort((a, b) => a - b);
      expect(nums[3] - nums[0], `${q.id}: ${nums}`).not.toBe(3);
      const c = Number(q.correctAnswer);
      if (nums.includes(c - 1) && nums.includes(c + 1)) sandwich++;
    }
    expect(sandwich / missing.length).toBeLessThan(0.05);
  });

  it('cannot be answered by a rule that never adds anything up', () => {
    const missing = qs.filter(isMissing);
    const score = (rule: (q: Question) => string[]) => missing.reduce((s, q) => {
      const picks = rule(q);
      return s + (picks.length === 0 ? 0.25 : picks.filter((p) => p === q.correctAnswer).length / picks.length);
    }, 0) / missing.length;
    const nums = (q: Question) => q.choices.map(Number);
    const rules: Record<string, (q: Question) => string[]> = {
      biggest: (q) => [String(Math.max(...nums(q)))],
      smallest: (q) => [String(Math.min(...nums(q)))],
      'not a number she can see': (q) => q.choices.filter((c) => !numbersIn(q.prompt).includes(c)),
      'one of the numbers that touch': (q) => q.choices.filter((c) => nums(q).includes(Number(c) - 1) || nums(q).includes(Number(c) + 1)),
    };
    for (const [name, rule] of Object.entries(rules)) expect(score(rule), name).toBeLessThan(0.47);

    // Nor by remembering which number is usually right. Only numbers offered
    // on at least one question in ten: 10 on a bond to 20 is right more often
    // than not, because 10 + 10 is one bond in nineteen and 10 is a poor wrong
    // answer to the rest, but "pick 10" then wins two questions in a hundred.
    for (const whole of wholes) {
      const these = missing.filter((q) => wholeOf(q) === whole);
      const offered = new Map<string, [number, number]>();
      for (const q of these) {
        for (const c of q.choices) {
          const e = offered.get(c) ?? [0, 0];
          e[0]++;
          if (c === q.correctAnswer) e[1]++;
          offered.set(c, e);
        }
      }
      for (const [v, [n, right]] of offered) {
        if (n < these.length * 0.1) continue;
        expect(right / n, `${whole}: ${v} is right ${right} of the ${n} times it is offered`).toBeLessThan(0.6);
      }
    }
  });

  it('lays out "which two numbers?" with nothing to spot but the sums', () => {
    const pairs = qs.filter((q) => !isMissing(q));
    let sameKind = 0;
    for (const q of pairs) {
      const ps = q.choices.map((c) => readPair(c)!);
      // No option is the same bond as another written backwards.
      const bonds = ps.map(([x, y]) => [Math.min(x, y), Math.max(x, y)].join('+'));
      expect(new Set(bonds).size, `${q.id}: ${q.choices}`).toBe(4);
      // Every option shares a number with as many others as every other option.
      const degree = ps.map((p, i) => ps.filter((o, j) => j !== i && p.some((v) => o.includes(v))).length);
      expect(new Set(degree).size, `${q.id}: ${q.choices}`).toBe(1);
      // "Both numbers odd or both even" is not the answer's alone.
      const same = q.choices.filter((_, i) => ps[i][0] % 2 === ps[i][1] % 2);
      if (same.includes(q.correctAnswer)) sameKind += 1 / same.length;
    }
    expect(sameKind / pairs.length).toBeLessThan(0.5);
  });

  it('says what every wrong option would mean, and only what it does mean', () => {
    let meaningful = 0, total = 0;
    for (const q of qs) {
      const wrong = q.choices.filter((c) => c !== q.correctAnswer);
      expect(Object.keys(q.distractorMeaning ?? {}).sort(), q.id).toEqual([...wrong].sort());
      const r = read(q);
      for (const w of wrong) {
        const tag: ErrorTag = q.distractorMeaning![w];
        total++;
        if (tag !== 'unknown') meaningful++;
        if (r.shape === 'missing') {
          const v = Number(w), correct = r.whole - r.part;
          const story: Partial<Record<ErrorTag, boolean>> = {
            'answered-the-whole': v === r.whole,
            'answered-a-given-number': v === r.part,
            'wrong-operation': v === r.part + r.whole,
            'off-by-one': Math.abs(v - correct) === 1,
            // A ten dropped or kept, within 20, from a number that has one to lose.
            'place-value': r.whole === 20 && Math.abs(v - correct) === 10
              && correct % 10 !== 0 && v > 0 && v < 20,
          };
          if (tag === 'unknown') {
            expect(Object.values(story).some(Boolean), `${q.prompt}: ${w} has a story but says 'unknown'`).toBe(false);
          } else {
            expect(story[tag], `${q.prompt}: ${w} tagged ${tag}`).toBe(true);
          }
        } else {
          const [x, y] = readPair(w)!;
          const off = x + y - r.whole;
          if (tag === 'off-by-one') expect(Math.abs(off), `${q.id}: ${w}`).toBe(1);
          else if (tag === 'place-value') expect([r.whole, x + y], `${q.id}: ${w}`).toEqual([20, 10]);
          else expect([tag, Math.abs(off)], `${q.id}: ${w}`).toEqual(['unknown', 2]);
        }
      }
    }
    expect(meaningful / total).toBeGreaterThan(0.6);
  });

  it('gives hints that say how to find the part, never the part', () => {
    for (const q of qs) {
      expect(q.hint, q.id).toBeTruthy();
      const shown = numbersIn(q.prompt);
      if (isMissing(q)) {
        // The answer may appear only where the prompt already shows it (5 + ? = 10).
        if (!shown.includes(q.correctAnswer)) {
          expect(q.hint!, `${q.prompt}: ${q.hint}`).not.toMatch(new RegExp(`\\b${q.correctAnswer}\\b`));
        }
      } else {
        // No digit but the whole: naming a number would point at a button.
        expect(numbersIn(q.hint!).every((d) => d === String(wholeOf(q))), `${q.id}: ${q.hint}`).toBe(true);
      }
    }
  });

  it('can be answered by ear', () => {
    for (const q of qs) {
      const spoken = q.speakText ?? '';
      const r = read(q);
      if (r.shape === 'missing') {
        expect(spoken, q.id).toBe(r.gapFirst
          ? `What plus ${r.part} makes ${r.whole}?`
          : `${r.part} plus what makes ${r.whole}?`);
      } else {
        expect(spoken.startsWith(`Which two numbers make ${r.whole}?`), spoken).toBe(true);
        for (const c of q.choices) expect(spoken, q.id).toContain(c.replace(' + ', ' plus '));
      }
    }
  });

  it('rebuilds every question from its id', () => {
    for (const q of qs.slice(0, 1500)) {
      expect(BOND_ID_PATTERN.test(q.id), `${q.id} not matched`).toBe(true);
      const r = bondFromId(q.id);
      expect(r, `no rebuild for ${q.id}`).not.toBeNull();
      expect(r!.id).toBe(q.id);
      expect(r!.prompt).toBe(q.prompt);
      expect(r!.correctAnswer).toBe(q.correctAnswer);
      expect(r!.promptEmoji).toBe(q.promptEmoji);
      expect(r!.visual).toEqual(q.visual);
      expect(r!.difficulty).toBe(q.difficulty);
      expect(solve(r!)).toBe(r!.correctAnswer);
    }
  });
});

describe('number-bond ids', () => {
  const every: string[] = [5, 10, 20].flatMap((w) => [
    ...Array.from({ length: w + 1 }, (_, p) => [`gbond-${w}-${p}+x`, `gbond-${w}-x+${p}`]).flat(),
    ...(w === 5 ? [] : Array.from({ length: w - 1 }, (_, i) => `gbond-${w}-pair-${i + 1}+${w - i - 1}`)),
  ]);

  it('accepts and faithfully rebuilds every bond there is', () => {
    expect(every).toHaveLength(2 * 6 + 2 * 11 + 9 + 2 * 21 + 19);
    for (const id of every) {
      expect(BOND_ID_PATTERN.test(id), id).toBe(true);
      for (let i = 0; i < 6; i++) {
        const q = bondFromId(id);
        expect(q, id).not.toBeNull();
        expect(q!.id).toBe(id);
        expect(solve(q!)).toBe(q!.correctAnswer);
        if (!isMissing(q!)) {
          const ps = q!.choices.map((c) => readPair(c)!);
          const degree = ps.map((p, j) => ps.filter((o, k) => k !== j && p.some((v) => o.includes(v))).length);
          expect(new Set(degree).size, `${id}: ${q!.choices}`).toBe(1);
        }
      }
    }
  });

  it('refuses an id it cannot honestly rebuild', () => {
    for (const bad of [
      'gbond-5-6+x',            // the part is bigger than the whole
      'gbond-10-x+11',
      'gbond-20-21+x',
      'gbond-15-3+x',           // not a whole this file makes bonds to
      'gbond-0-0+x',
      'gbond-10-03+x',          // not how the id is written
      'gbond-10-3+y',
      'gbond-10-3+x+x',
      'gbond-10--3+x',
      'gbond-10-x+',
      'gbond-10-+x',
      'gbond-5-pair-1+4',       // no "which two?" for 5
      'gbond-10-pair-3+6',      // does not make 10
      'gbond-10-pair-0+10',     // both numbers are at least 1
      'gbond-20-pair-20+0',
      'gbond-20-pair-3+17+0',
      'gbond-10-pair-3',
      'nb10-3+x',               // the bank's id, not ours
      'mk10-3',                 // Number Tricks' make-ten, not ours
      'gbond-',
      '',
      ' gbond-10-3+x',
      'gbond-10-3+x ',
      'GBOND-10-3+x',
    ]) {
      expect(BOND_ID_PATTERN.test(bad), `${bad} should not match`).toBe(false);
      expect(bondFromId(bad), `${bad} should not rebuild`).toBeNull();
    }
  });

  it('matches exactly the ids it can rebuild', () => {
    const mutants = every.flatMap((id) => [
      id,
      id.replace(/(\d+)(\+x)?$/, '0$1$2'),
      id.replace(/(\d+)(\+x)?$/, (_, d, x = '') => `${Number(d) + 1}${x}`),
      id.replace(/(\d+)(\+x)?$/, (_, d, x = '') => `${Number(d) - 1}${x}`),
      id.replace(/^gbond-(\d+)/, (_, w) => `gbond-${Number(w) + 5}`),
      id.replace('pair-', ''),
      id.replace('+x', '+y'),
      id + '-',
    ]);
    for (const id of mutants) {
      const rebuilt = bondFromId(id);
      expect(rebuilt !== null, id).toBe(BOND_ID_PATTERN.test(id));
      if (rebuilt) expect(rebuilt.id).toBe(id);
    }
  });
});

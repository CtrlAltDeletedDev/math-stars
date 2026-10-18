import { describe, it, expect } from 'vitest';
import { Question, ErrorTag } from '@/types';
import { generateEvenOddQuestion, evenOddFromId, EVEN_ODD_ID_PATTERN, PAIR_GAP } from '@/data/evenOddGen';

// The even-and-odd generator the practice ladder deals from. Everything here
// re-derives the answer from what she is shown — the number in the prompt, the
// keycaps, the objects in the picture — and never trusts `correctAnswer`.

const RUNGS = [
  ['even or odd to 10', { operation: 'even_odd', max: 10 }, 10],
  ['even or odd to 20', { operation: 'even_odd', max: 20 }, 20],
] as const;

const SAMPLE = 4000;

function sample(params: Record<string, number | string>, n = SAMPLE): Question[] {
  return Array.from({ length: n }, () => generateEvenOddQuestion(params));
}

const KEYCAP_TAIL = String.fromCharCode(0xfe0f, 0x20e3);

/** 1️⃣4️⃣ → 14, 🔟 → 10, anything else → null. */
function readKeycaps(emoji: string): number | null {
  if (emoji === '🔟') return 10;
  const parts = emoji.split(KEYCAP_TAIL);
  if (parts.pop() !== '' || parts.length === 0 || parts.some((d) => !/^\d$/.test(d))) return null;
  return Number(parts.join(''));
}

/** The objects in a picture of pairs, or null if it is not one. */
function readPairs(emoji: string): { count: number; groups: number[]; kinds: Set<string> } | null {
  const groups = emoji.split(PAIR_GAP).map((g) => [...g]);
  if (groups.some((g) => g.length === 0)) return null;
  const kinds = new Set(groups.flat());
  return { count: groups.flat().length, groups: groups.map((g) => g.length), kinds };
}

const isWhich = (q: Question) => /^Which number is (even|odd)\?$/.test(q.prompt);

/** The answer, worked out only from what is on screen. */
function solve(q: Question): string {
  let m = q.prompt.match(/^Is (\d+) even or odd\?$/);
  if (m) {
    const n = Number(m[1]);
    const shown = readKeycaps(q.promptEmoji ?? '');
    if (shown !== null) {
      expect(shown, `${q.id}: keycaps say ${shown}, prompt says ${n}`).toBe(n);
      return n % 2 === 0 ? 'Even' : 'Odd';
    }
    const pic = readPairs(q.promptEmoji ?? '');
    expect(pic, `${q.id}: picture is neither keycaps nor pairs`).not.toBeNull();
    expect(pic!.count, `${q.id}: ${pic!.count} objects drawn for ${n}`).toBe(n);
    expect(pic!.kinds.size, `${q.id}: more than one kind of object`).toBe(1);
    // Every group a pair, except a lone one at the very end.
    expect(pic!.groups.slice(0, -1).every((g) => g === 2), `${q.id}: ${pic!.groups}`).toBe(true);
    expect([1, 2]).toContain(pic!.groups[pic!.groups.length - 1]);
    // Read the parity off the picture itself: does the last one have a partner?
    return pic!.groups[pic!.groups.length - 1] === 2 ? 'Even' : 'Odd';
  }
  m = q.prompt.match(/^Which number is (even|odd)\?$/);
  if (m) {
    const want = m[1] === 'even' ? 0 : 1;
    const right = q.choices.filter((c) => Number(c) % 2 === want);
    expect(right, `${q.id}: ${q.choices} has ${right.length} right answers`).toHaveLength(1);
    return right[0];
  }
  throw new Error(`unrecognised prompt: ${q.prompt}`);
}

describe.each(RUNGS)('%s', (_label, params, max) => {
  const qs = sample(params);

  it('offers 2 to 4 distinct options, the answer among them', () => {
    for (const q of qs) {
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.choices.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.choices).size, `${q.id}: ${q.choices}`).toBe(q.choices.length);
      expect(q.choices, q.id).toContain(q.correctAnswer);
    }
  });

  it('marks the answer that the prompt and picture actually give', () => {
    for (const q of qs) expect(solve(q), `${q.id}: ${q.prompt} ${q.promptEmoji} ${q.choices}`).toBe(q.correctAnswer);
  });

  it('is an even_odd question with nothing borrowed from another ladder', () => {
    for (const q of qs) {
      expect(q.type).toBe('even_odd');
      expect(q.skill).toBeUndefined();
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.prompt.length, q.prompt).toBeLessThanOrEqual(40);
    }
  });

  it('asks the binary question with exactly Even and Odd, each the answer about half the time', () => {
    const binary = qs.filter((q) => !isWhich(q));
    expect(binary.length).toBeGreaterThan(SAMPLE * 0.4);
    let even = 0;
    for (const q of binary) {
      expect([...q.choices].sort(), q.id).toEqual(['Even', 'Odd']);
      if (q.correctAnswer === 'Even') even++;
    }
    expect(even / binary.length).toBeGreaterThan(0.4);
    expect(even / binary.length).toBeLessThan(0.6);
  });

  // Three numbers to 10, four to 20 (see `wrongCount` in evenOddGen.ts).
  const width = max === 10 ? 3 : 4;

  it(`asks "which number is even?" and "which is odd?" with ${width} numbers`, () => {
    const which = qs.filter(isWhich);
    expect(which.length).toBeGreaterThan(SAMPLE * 0.3);
    expect(which.filter((q) => q.prompt.includes('even')).length).toBeGreaterThan(which.length * 0.35);
    expect(which.filter((q) => q.prompt.includes('odd')).length).toBeGreaterThan(which.length * 0.35);
    for (const q of which) expect(q.choices, q.id).toHaveLength(width);
  });

  it('stays inside its rung', () => {
    for (const q of qs) {
      const shown = [...(q.prompt.match(/\d+/g) ?? []), ...(isWhich(q) ? q.choices : [])].map(Number);
      for (const n of shown) {
        expect(n, `${q.id} shows ${n}`).toBeLessThanOrEqual(max);
        expect(n, `${q.id} shows ${n}`).toBeGreaterThanOrEqual(max === 10 ? 1 : 0);
      }
      expect([1, 2, 3]).toContain(q.difficulty);
      if (max === 10) expect(q.difficulty, q.id).toBe(1);
    }
  });

  if (max === 20) {
    it('is mostly about the teens, with some review to 10', () => {
      const n = (q: Question) => Number(isWhich(q) ? q.correctAnswer : q.prompt.match(/\d+/)![0]);
      const teens = qs.filter((q) => n(q) > 10).length / qs.length;
      expect(teens).toBeGreaterThan(0.6);
      expect(teens).toBeLessThan(0.95);
    });
  }

  it('draws pairs pictures of at most 10 things, and only sometimes', () => {
    const pictures = qs.filter((q) => q.id.startsWith('geo-pairs-'));
    expect(pictures.length).toBeGreaterThan(0);
    expect(pictures.length).toBeLessThan(qs.length * 0.5);
    for (const q of pictures) expect(readPairs(q.promptEmoji!)!.count).toBeLessThanOrEqual(10);
  });

  it('never draws a thing whose emoji is already a pair', () => {
    // 🧦 shows two socks, so "🧦🧦 🧦" would be six socks with the answer "odd".
    // Gloves and the like are the same trap.
    for (const q of qs) expect(q.promptEmoji ?? '', q.id).not.toMatch(/🧦|🧤|👖|👀/u);
  });

  it('does not park the answer at a predictable rank', () => {
    for (const want of ['even', 'odd']) {
      const ranks = Array<number>(width).fill(0);
      const which = qs.filter((q) => q.prompt === `Which number is ${want}?`);
      for (const q of which) {
        const nums = q.choices.map(Number).sort((a, b) => a - b);
        ranks[nums.indexOf(Number(q.correctAnswer))]++;
      }
      const shares = ranks.map((r) => r / which.length);
      expect(Math.max(...shares), `${want}: ${shares}`).toBeLessThan(0.45);
      expect(Math.min(...shares), `${want}: ${shares}`).toBeGreaterThan(0.08);
    }
  });

  it('never offers four in a row, nor a run of three around the answer', () => {
    for (const q of qs.filter(isWhich)) {
      const nums = q.choices.map(Number).sort((a, b) => a - b);
      if (nums.length === 4) expect(nums[3] - nums[0], `${q.id}: ${nums}`).not.toBe(3);
      // One kind against three of the other: any run of three is centred on
      // the answer, so it must never happen.
      const c = Number(q.correctAnswer);
      expect(nums.includes(c - 1) && nums.includes(c + 1), `${q.id}: ${nums}`).toBe(false);
    }
  });

  it('cannot be answered by spotting a pattern instead of knowing the kind', () => {
    // Every wrong option is one kind and the answer the other, so the answer is
    // never two from a wrong option and always an odd distance from each. Each
    // rule below finds it without reading "even" or "odd" in the prompt; none
    // may do much better than a guess.
    const which = qs.filter(isWhich);
    const guess = 1 / width;
    const rules: Record<string, (nums: number[]) => number[]> = {
      // "3 and 5 go together counting in twos, so it isn't either of them"
      'skip the numbers two apart': (nums) => nums.filter((v) => !nums.includes(v - 2) && !nums.includes(v + 2)),
      'pick from the two closest numbers': (nums) => {
        let best = Infinity;
        let out: number[] = [];
        for (const a of nums) for (const b of nums) {
          if (a >= b) continue;
          if (b - a < best) { best = b - a; out = [a, b]; } else if (b - a === best) out.push(a, b);
        }
        return out;
      },
      'pick one of the numbers that touch': (nums) => nums.filter((v) => nums.includes(v - 1) || nums.includes(v + 1)),
    };
    for (const [name, rule] of Object.entries(rules)) {
      let score = 0;
      for (const q of which) {
        const nums = q.choices.map(Number);
        const picks = rule(nums);
        // Where the rule says nothing she guesses.
        score += picks.length === 0 ? guess : picks.filter((v) => v === Number(q.correctAnswer)).length / picks.length;
      }
      expect(score / which.length, name).toBeLessThan(guess + 0.17);
    }
  });

  it('does not let "pick one of the two touching numbers" work most of the time', () => {
    const which = qs.filter(isWhich);
    const touching = which.filter((q) => {
      const nums = q.choices.map(Number).sort((a, b) => a - b);
      return nums.some((v, i) => i > 0 && v - nums[i - 1] === 1);
    });
    expect(touching.length / which.length).toBeLessThan(0.4);
  });

  it('tags every wrong option, and only with "unknown" — no mistake here has a better name', () => {
    for (const q of qs) {
      const wrong = q.choices.filter((c) => c !== q.correctAnswer);
      expect(q.distractorMeaning, q.id).toBeDefined();
      expect(Object.keys(q.distractorMeaning!).sort()).toEqual([...wrong].sort());
      for (const w of wrong) expect(q.distractorMeaning![w] as ErrorTag, `${q.id}: ${w}`).toBe('unknown');
    }
  });

  it('gives hints that say how to look, never which answer', () => {
    for (const q of qs) {
      expect(q.hint, q.id).toBeTruthy();
      if (isWhich(q)) {
        // No digits at all: listing "0, 2, 4, 6 or 8" would point at the button.
        expect(q.hint!, `${q.id}: ${q.hint}`).not.toMatch(/\d/);
      } else {
        expect(q.hint!.toLowerCase(), `${q.id}: ${q.hint}`).not.toMatch(/\b(even|odd)\b/);
      }
    }
  });

  it('can be answered by ear', () => {
    for (const q of qs) {
      const spoken = q.speakText ?? '';
      if (isWhich(q)) {
        for (const c of q.choices) expect(spoken, `${q.id}: ${spoken}`).toMatch(new RegExp(`\\b${c}\\b`));
        expect(spoken).toMatch(q.prompt.includes('even') ? /\beven\b/ : /\bodd\b/);
      } else {
        const n = q.prompt.match(/\d+/)![0];
        expect(spoken, q.id).toMatch(new RegExp(`\\b${n}\\b.*even or odd\\?$`));
      }
      if (q.id.startsWith('geo-pairs-')) {
        expect(spoken, q.id).toMatch(/^(Here is 1 [a-z]+\.|Here are \d+ [a-z]+, in pairs\.) Is \d+ even or odd\?$/);
      }
    }
  });

  it('rebuilds every question from its id', () => {
    for (const q of qs.slice(0, 1500)) {
      expect(EVEN_ODD_ID_PATTERN.test(q.id), `${q.id} not matched`).toBe(true);
      const r = evenOddFromId(q.id);
      expect(r, `no rebuild for ${q.id}`).not.toBeNull();
      expect(r!.id).toBe(q.id);
      expect(r!.prompt).toBe(q.prompt);
      expect(r!.correctAnswer).toBe(q.correctAnswer);
      expect(r!.promptEmoji).toBe(q.promptEmoji);
      expect(r!.visual).toEqual(q.visual);
      expect(r!.difficulty).toBe(q.difficulty);
      expect(r!.choices).toContain(r!.correctAnswer);
      expect(solve(r!)).toBe(r!.correctAnswer);
    }
  });
});

describe('even-and-odd ids', () => {
  const things = [...new Set(sample({ operation: 'even_odd', max: 10 }, 3000)
    .filter((q) => q.id.startsWith('geo-pairs-'))
    .map((q) => q.id.replace(/^geo-pairs-\d+-/, '')))];

  const every: string[] = [
    ...Array.from({ length: 20 }, (_, i) => `geo-is-${i + 1}`),
    ...things.flatMap((t) => Array.from({ length: 10 }, (_, i) => `geo-pairs-${i + 1}-${t}`)),
    ...[10, 20].flatMap((r) => Array.from({ length: r }, (_, i) => i + 1)
      .map((n) => `geo-which-${n % 2 === 0 ? 'even' : 'odd'}-${r}-${n}`)),
  ];

  it('accepts and faithfully rebuilds every id in range', () => {
    expect(things.length).toBeGreaterThanOrEqual(8);
    for (const id of every) {
      expect(EVEN_ODD_ID_PATTERN.test(id), id).toBe(true);
      for (let i = 0; i < 5; i++) {
        const q = evenOddFromId(id);
        expect(q, id).not.toBeNull();
        expect(q!.id).toBe(id);
        expect(solve(q!)).toBe(q!.correctAnswer);
      }
    }
  });

  it('refuses an id it cannot honestly rebuild', () => {
    for (const bad of [
      'geo-is-0',              // zero is left to the bank
      'geo-is-21',             // past the top rung
      'geo-is-07',             // not how the id is written
      'geo-is--3',
      'geo-is-7x',
      'geo-pairs-11-sock',     // pictures stop at 10
      'geo-pairs-0-sock',
      'geo-pairs-4-dragon',    // not an object this file draws
      'geo-pairs-4',
      'geo-which-even-10-7',   // 7 is not even
      'geo-which-odd-20-12',   // 12 is not odd
      'geo-which-even-10-12',  // outside its own range
      'geo-which-even-15-8',   // not a range this file uses
      'geo-which-even-20-0',
      'geo-which-maybe-10-4',
      'eo-id-7',               // the bank's id, not ours
      'geo-',
      '',
      ' geo-is-4',
      'geo-is-4 ',
      'GEO-IS-4',
    ]) {
      expect(EVEN_ODD_ID_PATTERN.test(bad), `${bad} should not match`).toBe(false);
      expect(evenOddFromId(bad), `${bad} should not rebuild`).toBeNull();
    }
  });

  it('matches exactly the ids it can rebuild', () => {
    // Near misses of every real id: the pattern and the rebuilder must agree on
    // every one, so nothing passes canRebuildFromId and then fails to rebuild.
    const mutants = every.flatMap((id) => [
      id,
      id.replace(/(\d+)$/, '0$1'),
      id.replace(/(\d+)$/, (d) => String(Number(d) + 1)),
      id.replace(/(\d+)$/, (d) => String(Number(d) + 2)),
      id.replace(/(\d+)$/, (d) => String(Number(d) - 1)),
      id.replace(/-(10|20)-/, '-30-'),
      id.replace('even', 'odd'),
      id + '-',
    ]);
    for (const id of mutants) {
      const rebuilt = evenOddFromId(id);
      expect(rebuilt !== null, id).toBe(EVEN_ODD_ID_PATTERN.test(id));
      if (rebuilt) expect(rebuilt.id).toBe(id);
    }
  });
});

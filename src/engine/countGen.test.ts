import { describe, it, expect } from 'vitest';
import { Question } from '@/types';
import { generateCountQuestion, countFromId, COUNT_ID_PATTERN } from '@/data/countGen';

// Every check here re-derives the answer from what she sees — the objects in
// the picture, the numbers in the sequence, the words of the prompt — and
// never from `correctAnswer`.

const SAMPLE = 4000;

const RUNGS = [
  { label: 'counting to 10', params: { operation: 'count', max: 10 }, difficulty: 1, lo: 0, hi: 10 },
  { label: 'counting to 20', params: { operation: 'count', max: 20 }, difficulty: 2, lo: 11, hi: 20 },
  { label: 'ordering to 100', params: { operation: 'count', max: 100, mode: 'order' }, difficulty: 3, lo: 21, hi: 100 },
] as const;

const sampleOf = (params: Record<string, number | string>, n = SAMPLE) =>
  Array.from({ length: n }, () => generateCountQuestion(params));

const SAMPLES = RUNGS.map((r) => sampleOf(r.params));

// ---------------------------------------------------------------------------
// An independent solver
// ---------------------------------------------------------------------------

type Shape = 'count' | 'kind' | 'next' | 'before' | 'missing' | 'on';

interface Solved {
  shape: Shape;
  answer: number;
  /** Numbers written on screen. */
  shown: number[];
  /** Every object in the picture, for the counting shapes. */
  objects: number;
  /** How many of the other kind, when there are two. */
  others: number;
  /** The biggest number the question is about — what decides its rung. */
  top: number;
}

const codePoints = (s: string) => Array.from(s);

function solve(q: Question): Solved {
  const count = q.prompt.match(/^How many (\S+) are there\?$/u);
  if (count) {
    const target = count[1];
    expect(codePoints(target), `${q.id}: one object per glyph`).toHaveLength(1);
    const glyphs = codePoints(q.promptEmoji!.replace(/ /g, ''));
    const kinds = new Set(glyphs);
    expect(kinds.size, `${q.id}: one or two kinds`).toBeLessThanOrEqual(2);
    expect(kinds.has(target), `${q.id}: the object asked about is in the picture`).toBe(true);
    const answer = glyphs.filter((g) => g === target).length;
    return {
      shape: kinds.size === 1 ? 'count' : 'kind',
      answer,
      shown: [],
      objects: glyphs.length,
      others: glyphs.length - answer,
      top: glyphs.length,
    };
  }

  const nums = (s: string) => s.split(', ').map((x) => (x === '?' ? NaN : Number(x)));
  let m: RegExpMatchArray | null;
  if (q.prompt === 'What number comes next?' && (m = q.promptEmoji!.match(/^(\d+), (\d+), (\d+), \?$/))) {
    const [a, b, c] = nums(m[0]).slice(0, 3);
    expect([b - a, c - b], `${q.id}: counts in ones`).toEqual([1, 1]);
    return { shape: 'next', answer: c + 1, shown: [a, b, c], objects: 0, others: 0, top: c + 1 };
  }
  if (q.prompt === 'What number comes before?' && (m = q.promptEmoji!.match(/^\?, (\d+), (\d+)$/))) {
    const [a, b] = [+m[1], +m[2]];
    expect(b - a, `${q.id}: counts in ones`).toBe(1);
    return { shape: 'before', answer: a - 1, shown: [a, b], objects: 0, others: 0, top: b };
  }
  if (q.prompt === 'What number is missing?' && (m = q.promptEmoji!.match(/^(\d+), \?, (\d+)$/))) {
    const [a, b] = [+m[1], +m[2]];
    expect(b - a, `${q.id}: one number missing`).toBe(2);
    return { shape: 'missing', answer: a + 1, shown: [a, b], objects: 0, others: 0, top: b };
  }
  if ((m = q.prompt.match(/^Start at (\d+) and count on (\d+)\.\nWhere do you land\?$/))) {
    const [start, steps] = [+m[1], +m[2]];
    expect(q.promptEmoji).toBeUndefined();
    return { shape: 'on', answer: start + steps, shown: [start, steps], objects: 0, others: 0, top: start + steps };
  }
  throw new Error(`${q.id}: unrecognised question "${q.prompt}" / "${q.promptEmoji}"`);
}

const swapped = (n: number) => {
  const t = Math.floor(n / 10), o = n % 10;
  return n >= 12 && n <= 99 && o !== 0 && o !== t ? o * 10 + t : null;
};

/** Does `tag` honestly describe answering `v`? Worked out from the question, not from the generator. */
function tagIsHonest(q: Question, s: Solved, v: number, tag: string): boolean {
  const a = s.answer;
  switch (tag) {
    case 'unknown':
      return true;
    case 'off-by-one':
      if (s.shape === 'next') return v === a + 1; // skipped one (repeating the last is a given number)
      if (s.shape === 'before') return v === a - 1; // counted back one too far
      return Math.abs(v - a) === 1 && s.shape !== 'missing';
    case 'answered-a-given-number':
      return s.shown.includes(v);
    case 'answered-the-whole':
      return s.shape === 'kind' && v === s.objects;
    case 'wrong-operation':
      return s.shape === 'on' && v === s.shown[0] - s.shown[1];
    case 'place-value': {
      if (v === swapped(a)) return true;
      if (s.shape === 'count' || s.shape === 'kind') return a >= 13 && a <= 19 && v === a - 10; // 7 for 17
      if (v === a - 10) return a >= 13;
      // A ten too many: past twenty, or counting back across a ten (19 for "?, 10, 11").
      if (v === a + 10) return a >= 21 || ((s.shape === 'before' || s.shape === 'missing') && a % 10 === 9);
      return false;
    }
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------

describe.each(RUNGS.map((r, i) => [r.label, r, SAMPLES[i]] as const))('%s', (_label, rung, qs) => {
  it('marks the answer that the picture or the numbers actually give', () => {
    for (const q of qs) {
      const s = solve(q);
      expect(q.correctAnswer, q.id).toBe(String(s.answer));
      // Exactly one option is right.
      expect(q.choices.filter((c) => Number(c) === s.answer), q.id).toHaveLength(1);
    }
  });

  it('offers 2–4 distinct whole-number options including the answer', () => {
    for (const q of qs) {
      expect(q.choices, q.id).toContain(q.correctAnswer);
      expect(new Set(q.choices).size, `${q.id}: ${q.choices}`).toBe(q.choices.length);
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.choices.length, q.id).toBeLessThanOrEqual(4);
      for (const c of q.choices) expect(c, q.id).toMatch(/^(0|[1-9]\d*)$/);
    }
  });

  it('stays inside its rung', () => {
    for (const q of qs) {
      const s = solve(q);
      expect(q.difficulty, q.id).toBe(rung.difficulty);
      expect(s.top, `${q.id} is above the rung`).toBeLessThanOrEqual(rung.hi);
      // ...and asks about numbers the rung below does not.
      expect(s.top, `${q.id} belongs on the rung below`).toBeGreaterThanOrEqual(rung.lo);
      for (const n of s.shown) expect(n, q.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives every wrong option a tag that describes it', () => {
    let meaningful = 0, total = 0;
    for (const q of qs) {
      const s = solve(q);
      expect(q.distractorMeaning, q.id).toBeDefined();
      expect(q.distractorMeaning![q.correctAnswer], `${q.id} tagged its own answer`).toBeUndefined();
      for (const c of q.choices.filter((c) => c !== q.correctAnswer)) {
        const tag = q.distractorMeaning![c];
        expect(tag, `${q.id}: no tag for ${c}`).toBeDefined();
        expect(tagIsHonest(q, s, Number(c), tag), `${q.id}: ${c} is not "${tag}"`).toBe(true);
        total++;
        if (tag !== 'unknown') meaningful++;
      }
      expect(Object.keys(q.distractorMeaning!).sort(), q.id)
        .toEqual(q.choices.filter((c) => c !== q.correctAnswer).sort());
    }
    expect(meaningful / total).toBeGreaterThan(0.6);
  });

  it('does not let the rank of the answer give it away, in the rung or in any one shape', () => {
    // Per shape too: a rung-wide tally can hide one shape whose answer is never the biggest.
    const groups = new Map<string, Question[]>();
    for (const q of qs) {
      for (const key of [`all/${q.choices.length}`, `${solve(q).shape}/${q.choices.length}`]) {
        groups.set(key, [...(groups.get(key) ?? []), q]);
      }
    }
    for (const [key, group] of groups) {
      if (group.length < 200) continue;
      const size = group[0].choices.length;
      const ranks = Array(size).fill(0);
      for (const q of group) {
        const sorted = q.choices.map(Number).sort((a, b) => a - b);
        ranks[sorted.indexOf(Number(q.correctAnswer))]++;
      }
      const shares = ranks.map((r) => r / group.length);
      expect(Math.max(...shares), `${key}: ${shares}`).toBeLessThan(0.45);
      expect(Math.min(...shares), `${key}: ${shares}`).toBeGreaterThan(size === 4 ? 0.08 : 0.2);
      // The rule above is the floor. Every split is chosen uniformly, so with
      // enough questions each rank should sit near 1 in 4 (or 1 in 3); a shape
      // whose answer is the biggest option only 9% of the time passes the
      // floor and is still a tell.
      if (group.length >= 500) {
        const even = 1 / size;
        for (const s of shares) expect(Math.abs(s - even), `${key}: ${shares}`).toBeLessThan(0.1);
      }
    }
  });

  it('rarely offers four numbers in a row, in any shape', () => {
    const byShape = new Map<Shape, { n: number; run: number }>();
    for (const q of qs.filter((q) => q.choices.length === 4)) {
      const shape = solve(q).shape;
      const st = byShape.get(shape) ?? { n: 0, run: 0 };
      const sorted = q.choices.map(Number).sort((a, b) => a - b);
      st.n++;
      if (sorted[3] - sorted[0] === 3) st.run++;
      byShape.set(shape, st);
    }
    const all = [...byShape.values()].reduce((a, b) => ({ n: a.n + b.n, run: a.run + b.run }), { n: 0, run: 0 });
    if (all.n) expect(all.run / all.n).toBeLessThan(0.2);
    for (const [shape, st] of byShape) {
      if (st.n >= 200) expect(st.run / st.n, shape).toBeLessThan(0.2);
    }
  });

  it('can be answered by ear, and the hint never says the answer', () => {
    const says = (text: string, n: number) => new RegExp(`(^|[^\\d])${n}([^\\d]|$)`).test(text);
    for (const q of qs) {
      const s = solve(q);
      expect(q.speakText, q.id).toBeTruthy();
      expect(q.hint, q.id).toBeTruthy();
      expect(says(q.hint!, s.answer), `${q.id} hint: ${q.hint}`).toBe(false);
      expect(says(q.speakText!, s.answer), `${q.id} speakText: ${q.speakText}`).toBe(false);
      if (s.shape === 'count' || s.shape === 'kind') {
        // Names the objects in words (she can't hear an emoji), and gives no number away.
        const m = q.speakText!.match(/^(?:Count only the ([a-z]+)\. )?How many ([a-z]+) are there\?$/);
        expect(m, `${q.id}: ${q.speakText}`).not.toBeNull();
        if (s.shape === 'kind') expect(m![1], q.id).toBe(m![2]);
        else expect(m![1], q.id).toBeUndefined();
        expect(q.hint, q.id).not.toMatch(/\d/);
      } else {
        // Every number she needs is spoken.
        const needed = s.shape === 'before' ? [s.shown[0]] : s.shown;
        for (const n of needed) expect(says(q.speakText!, n), `${q.id}: says ${n}`).toBe(true);
      }
    }
  });

  it('cannot be beaten by avoiding the numbers on screen or picking the one in the middle', () => {
    // Offer every number on screen and "pick the one that isn't up there" wins;
    // offer both neighbours on "5, ?, 7" and the answer is the one between them.
    const shortcuts = {
      offScreen: (q: Question, s: Solved) => {
        const left = q.choices.filter((c) => !s.shown.includes(Number(c)));
        return left.includes(q.correctAnswer) ? 1 / left.length : 0;
      },
      mostNeighbours: (q: Question) => {
        const vs = q.choices.map(Number);
        const score = (v: number) => vs.filter((w) => w !== v && Math.abs(w - v) <= 2).length;
        const best = Math.max(...vs.map(score));
        const tied = vs.filter((v) => score(v) === best);
        return tied.includes(Number(q.correctAnswer)) ? 1 / tied.length : 0;
      },
    };
    // A bigger sample than the rest: a shape can be a twentieth of a rung, and
    // a few hundred questions is too noisy to hold a strategy to a few percent.
    const big = [...qs, ...sampleOf(rung.params, 16000)];
    const byShape = new Map<string, { n: number; chance: number; wins: Record<string, number> }>();
    for (const q of big) {
      const s = solve(q);
      expect(q.choices.filter((c) => s.shown.includes(Number(c))).length, `${q.id}: ${q.choices}`)
        .toBeLessThanOrEqual(1);
      const key = `${s.shape}/${q.choices.length}`;
      const st = byShape.get(key) ?? { n: 0, chance: 1 / q.choices.length, wins: {} };
      st.n++;
      for (const [name, f] of Object.entries(shortcuts)) st.wins[name] = (st.wins[name] ?? 0) + f(q, s);
      byShape.set(key, st);
    }
    for (const [key, st] of byShape) {
      if (st.n < 800) continue;
      for (const [name, w] of Object.entries(st.wins)) {
        // Four options: the same bar as the answer's rank — no strategy wins
        // 45% of the time. Honest near misses (one too many AND one too few)
        // always cluster a little round the answer; the adding and doubling
        // generators score 32–42% on "most neighbours" against a 25% guess,
        // and these sit in that range. Three options: one on-screen distractor
        // lifts "avoid what's on screen" from 1 in 3 to 1 in 2, and no further.
        expect(w / st.n, `${key} ${name}`).toBeLessThan(st.chance === 1 / 3 ? 0.53 : 0.45);
      }
    }
  }, 30_000);

  it('never offers a ten short and a ten too many together', () => {
    // 41, 51, 61 on one screen: the answer is "the middle one of the three that end in 1".
    let runs = 0;
    for (const q of qs) {
      const vs = q.choices.map(Number);
      const a = Number(q.correctAnswer);
      expect(vs.includes(a - 10) && vs.includes(a + 10), `${q.id}: ${q.choices}`).toBe(false);
      // A run can still happen by coincidence ("count on 3 from 20": 3, 13, 23), just rarely.
      if (vs.some((v) => vs.includes(v - 10) && vs.includes(v + 10))) runs++;
    }
    expect(runs / qs.length).toBeLessThan(0.02);
  });

  it('is varied, so the top of the grade is not the same few questions', () => {
    const ids = new Set(qs.map((q) => q.id));
    expect(ids.size).toBeGreaterThan(150);
  });

  it('rebuilds every question from its id', () => {
    for (const q of qs) {
      expect(q.id, q.id).toMatch(COUNT_ID_PATTERN);
      const r = countFromId(q.id);
      expect(r, q.id).not.toBeNull();
      expect({ ...r!, choices: undefined, distractorMeaning: undefined })
        .toEqual({ ...q, choices: undefined, distractorMeaning: undefined });
      expect(r!.choices, q.id).toContain(r!.correctAnswer);
    }
  });
});

describe('the counting pictures', () => {
  it('are laid out in groups of five she can keep her place in', () => {
    for (const q of [...SAMPLES[0], ...SAMPLES[1]]) {
      if (!q.prompt.startsWith('How many')) continue;
      const groups = q.promptEmoji!.split(' ');
      for (const [i, g] of groups.entries()) {
        const n = codePoints(g).length;
        if (i < groups.length - 1) expect(n, `${q.id}: ${q.promptEmoji}`).toBe(5);
        else expect(n, q.id).toBeGreaterThanOrEqual(1);
      }
      expect(codePoints(q.promptEmoji!.replace(/ /g, '')).length, q.id).toBeLessThanOrEqual(20);
    }
  });

  it('asks about one kind among two often enough to catch counting everything', () => {
    for (const qs of SAMPLES.slice(0, 2)) {
      const kinds = qs.filter((q) => q.prompt.startsWith('How many')).map(solve);
      const mixed = kinds.filter((s) => s.shape === 'kind');
      expect(mixed.length / kinds.length).toBeGreaterThan(0.2);
      // Never equal, so counting the wrong kind cannot be right by luck.
      for (const s of mixed) {
        expect(s.others).not.toBe(s.answer);
        expect(s.others).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('use one glyph per object, and never one that shows several things', () => {
    const seen = new Set<string>();
    for (const q of [...SAMPLES[0], ...SAMPLES[1]]) {
      for (const g of codePoints(q.promptEmoji?.replace(/ /g, '') ?? '')) seen.add(g);
    }
    expect(seen.size).toBeGreaterThan(15);
    for (const bunch of ['🍇', '🍒', '🧦', '🫐', '👯', '🍃']) expect(seen.has(bunch), bunch).toBe(false);
  });
});

describe('what each rung asks', () => {
  const shapes = (qs: Question[]) => {
    const tally: Partial<Record<Shape, number>> = {};
    for (const q of qs) tally[solve(q).shape] = (tally[solve(q).shape] ?? 0) + 1;
    return tally;
  };

  it('counting to 10 is mostly "how many?", with some "what comes next"', () => {
    const t = shapes(SAMPLES[0]);
    expect(((t.count ?? 0) + (t.kind ?? 0)) / SAMPLE).toBeGreaterThan(0.6);
    expect((t.next ?? 0) / SAMPLE).toBeGreaterThan(0.15);
    expect(Object.keys(t).sort()).toEqual(['count', 'kind', 'next']);
  });

  it('counting to 20 counts teens and puts numbers to 20 in order', () => {
    const t = shapes(SAMPLES[1]);
    for (const s of ['count', 'kind', 'next', 'before', 'missing'] as const) expect(t[s], s).toBeGreaterThan(SAMPLE * 0.05);
    expect(t.on).toBeUndefined();
  });

  it('ordering to 100 is all number order, every shape, across the tens', () => {
    const qs = SAMPLES[2];
    expect(qs.every((q) => q.type === 'number_order')).toBe(true);
    const t = shapes(qs);
    for (const s of ['next', 'before', 'missing', 'on'] as const) expect(t[s], s).toBeGreaterThan(SAMPLE * 0.1);
    // The decade crossings — 39 to 40 — are where she slips, so they come up often.
    const crossing = qs.map(solve).filter((s) =>
      (s.shape === 'next' && s.answer % 10 === 0) || (s.shape === 'before' && s.answer % 10 === 9));
    expect(crossing.length / SAMPLE).toBeGreaterThan(0.1);
  });

  it('types answers so they reach the Counting ladder', () => {
    for (const qs of SAMPLES) {
      for (const q of qs) {
        expect(q.type, q.id).toBe(solve(q).shape === 'count' || solve(q).shape === 'kind' ? 'counting' : 'number_order');
        expect(q.skill, q.id).toBeUndefined();
      }
    }
  });

  it('does not offer a ten slip where there is no ten to lose', () => {
    // "6, 7, 8, ?" once offered 19 as a lost ten.
    for (const q of SAMPLES[0]) {
      for (const tag of Object.values(q.distractorMeaning!)) expect(tag, q.id).not.toBe('place-value');
    }
  });
});

describe('countFromId', () => {
  it('rebuilds every id any rung can emit, and each one solves', () => {
    const objects = new Set<string>();
    for (const q of [...SAMPLES[0], ...SAMPLES[1]]) {
      const m = q.id.match(/^gcount-([a-z]+)-\d+/);
      if (m) objects.add(m[1]);
    }
    const ids: string[] = [];
    for (const o of objects) for (let n = 3; n <= 20; n++) ids.push(`gcount-${o}-${n}`);
    for (let a = 4; a <= 100; a++) ids.push(`gorder-next-${a}`);
    for (let a = 9; a <= 98; a++) ids.push(`gorder-before-${a}`);
    for (let a = 10; a <= 99; a++) ids.push(`gorder-missing-${a}`);
    for (let s = 20; s <= 98; s++) for (const k of [2, 3, 4]) if (s + k <= 100) ids.push(`gorder-on-${s}-${k}`);
    for (const id of ids) {
      expect(id).toMatch(COUNT_ID_PATTERN);
      const q = countFromId(id);
      expect(q, id).not.toBeNull();
      expect(q!.id).toBe(id);
      expect(q!.correctAnswer, id).toBe(String(solve(q!).answer));
      expect(q!.choices, id).toContain(q!.correctAnswer);
      expect(new Set(q!.choices).size, id).toBe(q!.choices.length);
    }
  });

  it('refuses ids it cannot honestly rebuild', () => {
    for (const id of [
      '', 'gcount-', 'gcount-apple', 'gcount-apple-', 'gcount-apple-0', 'gcount-apple-2', 'gcount-apple-21',
      'gcount-apple-07', 'gcount-grapes-5', 'gcount-Apple-5', 'gcount-apple-5-',
      'gcount-apple-5-cat-3', // not a pair
      'gcount-apple-5-banana-5', // the same number of each
      'gcount-apple-2-banana-4', // too few to count
      'gcount-apple-6-banana-2', // too few of the other kind to matter
      'gcount-apple-16-banana-5', // past 20
      'gorder-next-3', 'gorder-next-101', 'gorder-next-0', 'gorder-next-012',
      'gorder-before-8', 'gorder-before-99', 'gorder-missing-9', 'gorder-missing-100',
      'gorder-sideways-5', 'gorder-on-50-1', 'gorder-on-50-5', 'gorder-on-98-4', 'gorder-on-19-3', 'gorder-on-50',
      'count-3a', 'ord-1', 'cnt-3+4', 'skip-2-0-3', 'gcmp-sign-3-4',
    ]) {
      expect(countFromId(id), id).toBeNull();
    }
  });

  it('has an id pattern that matches none of the other generators’ ids', () => {
    for (const id of ['count-3a', 'ord-1', 'cnt-3+4', 'cmp-5-gt-3', 'skip-5-10-3', 'add-3+4', 'gcmp-more-3-4']) {
      expect(COUNT_ID_PATTERN.test(id), id).toBe(false);
    }
  });
});

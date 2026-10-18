import { describe, it, expect } from 'vitest';
import {
  generatePlaceValueQuestion,
  placeValueFromId,
  PLACE_VALUE_ID_PATTERN,
  TEN_EMOJI,
  ONE_DOT,
} from '@/data/placeValueGen';
import { PLACE_VALUE_L1_QUESTIONS } from '@/data/placeValue';
import { ErrorTag, Question } from '@/types';

// The generated Tens & Ones ladder. Every check here works the question out
// again from what she is shown — the prompt, and the blocks in the picture —
// and never trusts `correctAnswer`. Failures are collected and asserted once,
// so a broken rule lists every question it broke on.

type Form =
  | 'tensdigit' | 'onesdigit' | 'howmanytens'
  | 'build' | 'buildrev' | 'expand' | 'expandrev'
  | 'greater' | 'less';

const DIGIT_FORMS: Form[] = ['howmanytens', 'onesdigit', 'tensdigit'];
const BUILD_FORMS: Form[] = ['build', 'buildrev', 'expand', 'expandrev'];
const COMPARE_FORMS: Form[] = ['greater', 'less'];

const RUNGS = [
  { label: 'digits', params: { operation: 'place_value', mode: 'digits' }, forms: DIGIT_FORMS },
  { label: 'build', params: { operation: 'place_value', mode: 'build' }, forms: [...BUILD_FORMS, ...DIGIT_FORMS] },
  { label: 'compare', params: { operation: 'place_value', mode: 'compare' }, forms: COMPARE_FORMS },
];

const SAMPLE = 20000;
const samples = new Map(RUNGS.map((r) => [r.label, Array.from({ length: SAMPLE }, () => generatePlaceValueQuestion({ ...r.params }))]));
const everything = [...samples.values()].flat();

// ---------------------------------------------------------------------------
// An independent reading of the question
// ---------------------------------------------------------------------------

interface Solved {
  form: Form;
  answer: number;
  /** Every number the prompt shows her. */
  given: number[];
  /** The two-digit number the question is about (the one to build, or the one to read). */
  tens?: number;
  ones?: number;
  /** For comparing. */
  pair?: [number, number];
}

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

function solve(q: Question): Solved {
  const p = q.prompt;
  let m = p.match(/^What is the (tens|ones) digit of (\d+)\?$/);
  if (m) {
    // Read the digit off the written numeral, the way she would.
    const written = m[2];
    if (written.length !== 2) throw new Error(`${q.id}: ${written} is not two digits`);
    const n = Number(written);
    return {
      form: m[1] === 'tens' ? 'tensdigit' : 'onesdigit',
      answer: Number(m[1] === 'tens' ? written[0] : written[1]),
      given: [n], tens: Number(written[0]), ones: Number(written[1]),
    };
  }
  m = p.match(/^How many tens are in (\d+)\?$/);
  if (m) {
    const n = Number(m[1]);
    return { form: 'howmanytens', answer: Math.floor(n / 10), given: [n], tens: Math.floor(n / 10), ones: n % 10 };
  }
  m = p.match(/^(\d) (tens?) and (\d) (ones?) = \?$/);
  if (m) {
    const t = Number(m[1]), o = Number(m[3]);
    if (m[2] !== plural(t, 'ten') || m[4] !== plural(o, 'one')) throw new Error(`${q.id}: grammar in "${p}"`);
    return { form: 'build', answer: 10 * t + o, given: [t, o], tens: t, ones: o };
  }
  m = p.match(/^(\d) (ones?) and (\d) (tens?) = \?$/);
  if (m) {
    const o = Number(m[1]), t = Number(m[3]);
    if (m[2] !== plural(o, 'one') || m[4] !== plural(t, 'ten')) throw new Error(`${q.id}: grammar in "${p}"`);
    return { form: 'buildrev', answer: 10 * t + o, given: [o, t], tens: t, ones: o };
  }
  m = p.match(/^(\d+) \+ (\d+) = \?$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    const tensFirst = a % 10 === 0 && a >= 10 && b >= 1 && b <= 9;
    const onesFirst = b % 10 === 0 && b >= 10 && a >= 1 && a <= 9;
    if (!tensFirst && !onesFirst) throw new Error(`${q.id}: "${p}" is not tens plus ones`);
    const tensPart = tensFirst ? a : b, onesPart = tensFirst ? b : a;
    return { form: tensFirst ? 'expand' : 'expandrev', answer: a + b, given: [a, b], tens: tensPart / 10, ones: onesPart };
  }
  m = p.match(/^Which is (greater|less): (\d+) or (\d+)\?$/);
  if (m) {
    const a = Number(m[2]), b = Number(m[3]);
    return {
      form: m[1] as Form,
      answer: m[1] === 'greater' ? Math.max(a, b) : Math.min(a, b),
      given: [a, b], pair: [a, b],
    };
  }
  throw new Error(`${q.id}: unrecognised prompt ${JSON.stringify(p)}`);
}

const swapOf = (n: number) => (n % 10) * 10 + Math.floor(n / 10);

/** The ones say one thing and the tens the other: 38 vs 52, 45 vs 54. */
function onesPointTheWrongWay(a: number, b: number): boolean {
  const dt = Math.floor(a / 10) - Math.floor(b / 10), dO = (a % 10) - (b % 10);
  return dt !== 0 && dO !== 0 && Math.sign(dt) !== Math.sign(dO);
}

function ranksOf(qs: Question[]): number[] {
  const ranks = [0, 0, 0, 0];
  for (const q of qs) {
    const sorted = q.choices.map(Number).sort((a, b) => a - b);
    ranks[sorted.indexOf(solve(q).answer)]++;
  }
  return ranks.map((r) => r / qs.length);
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

// ---------------------------------------------------------------------------

describe.each(RUNGS)('place value rung: $label', (rung) => {
  const qs = samples.get(rung.label)!;

  it('always marks the answer the prompt actually gives', () => {
    const bad = qs.filter((q) => Number(q.correctAnswer) !== solve(q).answer || q.correctAnswer !== String(solve(q).answer))
      .map((q) => `${q.id}: "${q.prompt}" marked ${q.correctAnswer}`);
    expect(bad).toEqual([]);
  });

  it('is a place value question, routed by its type alone', () => {
    const bad = qs.filter((q) => q.type !== 'place_value' || q.skill !== undefined).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it('offers 2 to 4 distinct whole numbers, exactly one of them right', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const { answer } = solve(q);
      if (q.choices.length < 2 || q.choices.length > 4) bad.push(`${q.id}: ${q.choices.length} options`);
      if (new Set(q.choices).size !== q.choices.length) bad.push(`${q.id}: repeats ${q.choices}`);
      // Written the ordinary way — no "07", no "-3" — so distinct text is a distinct number.
      if (q.choices.some((c) => !/^(0|[1-9]\d*)$/.test(c))) bad.push(`${q.id}: odd option in ${q.choices}`);
      if (q.choices.filter((c) => Number(c) === answer).length !== 1) bad.push(`${q.id}: ${answer} not offered once in ${q.choices}`);
    }
    expect(bad).toEqual([]);
  });

  it('asks every kind of question the rung has, and nothing from the rung above', () => {
    const seen = new Set(qs.map((q) => solve(q).form));
    expect([...seen].sort()).toEqual([...rung.forms].sort());
    // The id names the same kind of question the prompt asks.
    const bad = qs.filter((q) => q.id.split('-')[1] !== solve(q).form).map((q) => `${q.id}: asks ${solve(q).form}`);
    expect(bad).toEqual([]);
  });

  it('only ever uses two-digit numbers, 10 to 99', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const s = solve(q);
      const twoDigit = s.pair ?? [10 * s.tens! + s.ones!];
      if (twoDigit.some((n) => n < 10 || n > 99)) bad.push(`${q.id}: ${twoDigit}`);
      if (s.ones! < 0 || s.ones! > 9) bad.push(`${q.id}: ${s.ones} ones`);
      for (const c of q.choices) if (Number(c) > 99) bad.push(`${q.id}: offers ${c}`);
    }
    expect(bad).toEqual([]);
  });

  it('rates difficulty by rung: finding digits 1, building 2, comparing 3', () => {
    const want = (f: Form) => (DIGIT_FORMS.includes(f) ? 1 : BUILD_FORMS.includes(f) ? 2 : 3);
    const bad = qs.filter((q) => q.difficulty !== want(solve(q).form)).map((q) => `${q.id}: ${q.difficulty}`);
    expect(bad).toEqual([]);
  });

  it('can be answered by ear: every number she is shown is said, and "= ?" is put into words', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const s = solve(q);
      if (!q.speakText) { bad.push(`${q.id}: nothing to say`); continue; }
      const said = (q.speakText.match(/\d+/g) ?? []).map(Number);
      if (s.given.some((n) => !said.includes(n))) bad.push(`${q.id}: "${q.speakText}" leaves out a number`);
      if (/[=]/.test(q.speakText)) bad.push(`${q.id}: "${q.speakText}" reads out a symbol`);
      // The build questions must say tens and ones in the order the prompt does.
      if (s.form === 'build' && !/\d tens? and \d ones?/.test(q.speakText)) bad.push(`${q.id}: "${q.speakText}"`);
      if (s.form === 'buildrev' && !/\d ones? and \d tens?/.test(q.speakText)) bad.push(`${q.id}: "${q.speakText}"`);
      // Saying the answer out loud would answer it — except comparing, where both numbers are the question.
      if (!s.pair && new RegExp(`\\b${s.answer}\\b`).test(q.speakText) && !s.given.includes(s.answer)) {
        bad.push(`${q.id}: "${q.speakText}" says the answer`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('gives a hint that says how to look, never the answer', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const { answer } = solve(q);
      if (!q.hint) bad.push(`${q.id}: no hint`);
      else if (new RegExp(`\\b${answer}\\b`).test(q.hint)) bad.push(`${q.id}: hint "${q.hint}" says ${answer}`);
    }
    expect(bad).toEqual([]);
  });

  it('tags every wrong option, and never the answer', () => {
    const bad: string[] = [];
    for (const q of qs) {
      for (const c of q.choices) {
        const tag = q.distractorMeaning?.[c];
        if (c === q.correctAnswer && tag !== undefined) bad.push(`${q.id}: tagged its own answer`);
        if (c !== q.correctAnswer && tag === undefined) bad.push(`${q.id}: no tag for ${c}`);
      }
      for (const k of Object.keys(q.distractorMeaning ?? {})) if (!q.choices.includes(k)) bad.push(`${q.id}: tag for missing ${k}`);
    }
    expect(bad).toEqual([]);
  });

  it('only uses a tag where it describes that wrong answer', () => {
    // Parents read these as sentences: "losing track of a ten", "answering
    // with a number the question already showed her". Each one is checked
    // against what the wrong value actually is.
    const bad: string[] = [];
    for (const q of qs) {
      const s = solve(q);
      for (const [c, tag] of Object.entries(q.distractorMeaning ?? {})) {
        const v = Number(c);
        const honest = ((): boolean => {
          switch (tag as ErrorTag) {
            case 'answered-a-given-number':
              return s.given.includes(v);
            case 'off-by-one':
              return Math.abs(v - s.answer) === 1;
            case 'place-value': {
              if (s.pair) return onesPointTheWrongWay(...s.pair);
              const n = 10 * s.tens! + s.ones!;
              if (DIGIT_FORMS.includes(s.form)) {
                // The other digit: the ones when asked for the tens, and back.
                return v === (s.form === 'onesdigit' ? s.tens : s.ones);
              }
              return v === swapOf(n) // 74 for 47
                || v === s.tens! + s.ones! // the tens counted as ones: 11 for 47
                || ((s.form === 'build' || s.form === 'buildrev') && Math.abs(v - n) === 10); // a ten lost or gained
            }
            case 'unknown':
              return true;
            default:
              return false; // no other tag has a story on these questions
          }
        })();
        if (!honest) bad.push(`${q.id}: "${q.prompt}" tags ${c} as ${tag}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('files the mistake each shape exists to catch under place value, never as unknown', () => {
    const bad: string[] = [];
    for (const q of qs) {
      const s = solve(q);
      if (s.pair) {
        const wrong = String(s.pair[0] === s.answer ? s.pair[1] : s.pair[0]);
        const want = onesPointTheWrongWay(...s.pair) ? 'place-value' : 'unknown';
        if (q.distractorMeaning?.[wrong] !== want) bad.push(`${q.id}: ${wrong} is ${q.distractorMeaning?.[wrong]}`);
        continue;
      }
      const n = 10 * s.tens! + s.ones!;
      const headline = DIGIT_FORMS.includes(s.form) ? (s.form === 'onesdigit' ? s.tens! : s.ones!) : swapOf(n);
      const c = String(headline);
      if (headline !== s.answer && q.choices.includes(c) && q.distractorMeaning?.[c] !== 'place-value') {
        bad.push(`${q.id}: ${c} is ${q.distractorMeaning?.[c]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('can be rebuilt from its id: same prompt, answer, picture and words', () => {
    const bad: string[] = [];
    for (const q of qs) {
      if (!PLACE_VALUE_ID_PATTERN.test(q.id)) bad.push(`${q.id}: does not match the id pattern`);
      const r = placeValueFromId(q.id);
      if (!r) { bad.push(`${q.id}: not rebuilt`); continue; }
      for (const k of ['id', 'type', 'prompt', 'correctAnswer', 'promptEmoji', 'difficulty', 'hint', 'speakText'] as const) {
        if (r[k] !== q[k]) bad.push(`${q.id}: ${k} ${JSON.stringify(r[k])} vs ${JSON.stringify(q[k])}`);
      }
      if (r.visual !== q.visual) bad.push(`${q.id}: visual differs`);
      if (r.choices.length !== q.choices.length || !r.choices.includes(r.correctAnswer)) bad.push(`${q.id}: rebuilt options ${r.choices}`);
    }
    expect(bad).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Pictures
// ---------------------------------------------------------------------------

describe('pictures', () => {
  const count = (s: string, sym: string) => s.split(sym).length - 1;

  it('draws the number being read as keycaps, the way the hand-written bank does', () => {
    // pv1-ones-47 is drawn "4️⃣7️⃣"; a generated 47 must look the same.
    const banked = PLACE_VALUE_L1_QUESTIONS.find((q) => q.id === 'pv1-ones-47')!.promptEmoji;
    expect(placeValueFromId('gpv-onesdigit-47')!.promptEmoji).toBe(banked);
    const bad: string[] = [];
    for (const q of everything) {
      const s = solve(q);
      if (!DIGIT_FORMS.includes(s.form)) continue;
      const n = s.given[0];
      const want = [...String(n)].map((d) => `${d}️⃣`).join('');
      if (q.promptEmoji !== want) bad.push(`${q.id}: ${q.promptEmoji}`);
    }
    expect(bad).toEqual([]);
  });

  it('shows tens as 🔟 and ones as dots that add up to the answer, in the order the words say them', () => {
    const bad: string[] = [];
    let drawn = 0;
    for (const q of everything) {
      const s = solve(q);
      if (s.form !== 'build' && s.form !== 'buildrev') continue;
      if (s.tens! > 5) {
        // Too many to count at a glance; no picture rather than a wall of blocks.
        if (q.promptEmoji !== undefined) bad.push(`${q.id}: draws ${s.tens} tens`);
        continue;
      }
      drawn++;
      const pic = q.promptEmoji ?? '';
      const tens = count(pic, TEN_EMOJI), ones = count(pic, ONE_DOT);
      if (10 * tens + ones !== s.answer) bad.push(`${q.id}: picture "${pic}" is ${10 * tens + ones}`);
      // Nothing else in the picture to count by mistake.
      const rest = pic.split(TEN_EMOJI).join('').split(ONE_DOT).join('').replace(/[ ➕]/g, '');
      if (rest !== '') bad.push(`${q.id}: picture "${pic}" also has "${rest}"`);
      // Dots come in fives, so seven reads as five and two.
      for (const group of pic.split(/[ ➕]+/)) if (count(group, ONE_DOT) > 5) bad.push(`${q.id}: ${group}`);
      if (s.ones! > 0) {
        const firstTen = pic.indexOf(TEN_EMOJI), firstDot = pic.indexOf(ONE_DOT);
        if ((s.form === 'buildrev') !== (firstDot < firstTen)) bad.push(`${q.id}: "${pic}" drawn in the wrong order`);
      }
    }
    expect(drawn).toBeGreaterThan(1000);
    expect(bad).toEqual([]);
  });

  it('draws nothing for the written sums and a balance for comparing', () => {
    const bad = everything.filter((q) => {
      const { form } = solve(q);
      if (form === 'expand' || form === 'expandrev') return q.promptEmoji !== undefined;
      if (form === 'greater' || form === 'less') return q.promptEmoji !== '⚖️';
      return false;
    }).map((q) => `${q.id}: ${q.promptEmoji}`);
    expect(bad).toEqual([]);
  });

  it('never sets a drawn visual', () => {
    expect(everything.filter((q) => q.visual !== undefined).map((q) => q.id)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Nothing but the maths gives the answer away
// ---------------------------------------------------------------------------

describe('the options give nothing away', () => {
  const build = samples.get('build')!;

  it.each(BUILD_FORMS)('%s: the answer is not parked at one rank of four', (form) => {
    const qs = build.filter((q) => solve(q).form === form);
    expect(qs.length).toBeGreaterThan(2000);
    expect(qs.every((q) => q.choices.length === 4)).toBe(true);
    const shares = ranksOf(qs);
    expect(Math.max(...shares), `${form}: ranks ${shares.map(pct)}`).toBeLessThan(0.45);
    expect(Math.min(...shares), `${form}: ranks ${shares.map(pct)}`).toBeGreaterThan(0.08);
  });

  it.each(BUILD_FORMS)('%s: rarely offers four numbers in a row', (form) => {
    const qs = build.filter((q) => solve(q).form === form);
    const runs = qs.filter((q) => {
      const nums = q.choices.map(Number).sort((a, b) => a - b);
      return nums[3] - nums[0] === 3;
    }).length;
    expect(runs / qs.length).toBeLessThan(0.2);
  });

  it('digit questions offer the two digits and the number, with no tell between the digits', () => {
    // "4, 7 or 47?": the number itself is never right, and between the two
    // digits "pick the bigger one" is a coin toss for every way of asking.
    for (const form of DIGIT_FORMS) {
      const qs = everything.filter((q) => solve(q).form === form);
      let biggerWins = 0;
      const bad: string[] = [];
      for (const q of qs) {
        const s = solve(q);
        const n = s.given[0];
        const want = [s.tens!, s.ones!, n].map(String).sort();
        if (JSON.stringify([...q.choices].sort()) !== JSON.stringify(want)) bad.push(`${q.id}: ${q.choices}`);
        if (Math.max(s.tens!, s.ones!) === s.answer) biggerWins++;
      }
      expect(bad).toEqual([]);
      const share = biggerWins / qs.length;
      expect(share, `${form}: bigger digit right ${pct(share)}`).toBeGreaterThan(0.4);
      expect(share, `${form}: bigger digit right ${pct(share)}`).toBeLessThan(0.6);
    }
  });

  it('never asks the digits of a number like 44, where both answers are the same', () => {
    const bad = everything.filter((q) => DIGIT_FORMS.includes(solve(q).form) && solve(q).tens === solve(q).ones).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it('asks tens-first and ones-first equally, so writing the digits in the order heard is a coin toss', () => {
    // "4 tens and 7 ones" and "40 + 7" reward writing 4 then 7; "7 ones and
    // 4 tens" and "7 + 40" punish it. She has to read which is which.
    const qs = build.filter((q) => BUILD_FORMS.includes(solve(q).form));
    let inOrder = 0;
    for (const q of qs) {
      const [first, second] = q.prompt.match(/\d+/g)!;
      if (q.correctAnswer === `${first[0]}${second[0]}`) inOrder++;
    }
    const share = inOrder / qs.length;
    expect(share, `order heard right ${pct(share)}`).toBeGreaterThan(0.45);
    expect(share, `order heard right ${pct(share)}`).toBeLessThan(0.55);
  });

  it('offers the swapped digits on most build questions where they are a different number', () => {
    const qs = build.filter((q) => {
      const s = solve(q);
      return BUILD_FORMS.includes(s.form) && s.ones! > 0 && s.ones !== s.tens;
    });
    const withSwap = qs.filter((q) => q.choices.includes(String(swapOf(solve(q).answer)))).length;
    expect(withSwap / qs.length).toBeGreaterThan(0.6);
  });

  it('says something more useful than "unknown" about most wrong answers', () => {
    for (const label of ['digits', 'build']) {
      let meaningful = 0, total = 0;
      for (const q of samples.get(label)!) {
        for (const tag of Object.values(q.distractorMeaning ?? {})) {
          total++;
          if (tag !== 'unknown') meaningful++;
        }
      }
      expect(meaningful / total, label).toBeGreaterThan(0.8);
    }
  });
});

describe('comparing', () => {
  const qs = samples.get('compare')!;

  it('offers exactly the two numbers in the question', () => {
    const bad = qs.filter((q) => {
      const { pair } = solve(q);
      return q.choices.length !== 2 || JSON.stringify([...q.choices].sort()) !== JSON.stringify(pair!.map(String).sort());
    }).map((q) => `${q.id}: ${q.choices}`);
    expect(bad).toEqual([]);
  });

  it('never compares a number with itself', () => {
    expect(qs.filter((q) => solve(q).pair![0] === solve(q).pair![1]).map((q) => q.id)).toEqual([]);
  });

  it('asks greater and less, with the answer first or second in the question, about equally', () => {
    const greater = qs.filter((q) => solve(q).form === 'greater').length / qs.length;
    const first = qs.filter((q) => solve(q).pair![0] === solve(q).answer).length / qs.length;
    for (const share of [greater, first]) {
      expect(share).toBeGreaterThan(0.45);
      expect(share).toBeLessThan(0.55);
    }
  });

  it('makes "compare the ones" lose as often as it wins; only the tens decide', () => {
    // Half the pairs are traps where the ones point the wrong way (45 vs 54,
    // 38 vs 52); the rest share their tens or agree.
    let traps = 0, swapped = 0, sameTens = 0, onesWins = 0, onesDecided = 0;
    for (const q of qs) {
      const { pair, answer, form } = solve(q);
      const [a, b] = pair!;
      if (onesPointTheWrongWay(a, b)) traps++;
      if (swapOf(a) === b) swapped++;
      if (Math.floor(a / 10) === Math.floor(b / 10)) sameTens++;
      if (a % 10 !== b % 10) {
        onesDecided++;
        const byOnes = (form === 'greater') === (a % 10 > b % 10) ? a : b;
        if (byOnes === answer) onesWins++;
      }
    }
    expect(traps / qs.length).toBeGreaterThan(0.45);
    expect(traps / qs.length).toBeLessThan(0.55);
    // The swapped-digit pairs the brief asks for, and pairs where the ones really do decide.
    expect(swapped / qs.length).toBeGreaterThan(0.15);
    expect(sameTens / qs.length).toBeGreaterThan(0.15);
    expect(onesWins / onesDecided).toBeGreaterThan(0.4);
    expect(onesWins / onesDecided).toBeLessThan(0.6);
  });
});

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

describe('ids', () => {
  it('reach every number each kind of question can ask about', () => {
    const ids = new Set(everything.map((q) => q.id));
    const has = (form: string, ok: (n: number) => boolean) => {
      const missing: string[] = [];
      for (let n = 10; n <= 99; n++) if (ok(n) && !ids.has(`gpv-${form}-${n}`)) missing.push(`gpv-${form}-${n}`);
      return missing;
    };
    const differ = (n: number) => Math.floor(n / 10) !== n % 10;
    const hasOnes = (n: number) => n % 10 !== 0;
    expect([
      ...has('tensdigit', differ), ...has('onesdigit', differ), ...has('howmanytens', differ),
      ...has('build', () => true), ...has('expand', hasOnes),
      ...has('buildrev', (n) => differ(n) && hasOnes(n)), ...has('expandrev', (n) => differ(n) && hasOnes(n)),
    ]).toEqual([]);
  });

  it('the pattern accepts exactly the ids that can be rebuilt', () => {
    const forms = ['tensdigit', 'onesdigit', 'howmanytens', 'build', 'buildrev', 'expand', 'expandrev', 'greater', 'less', 'ones', 'tens'];
    const nums = [...Array.from({ length: 121 }, (_, i) => String(i)), '00', '01', '05', '010', '047', '470', '4.7', '+47', '-47', ' 47', '47 ', ''];
    const disagree: string[] = [];
    const check = (id: string) => {
      if (PLACE_VALUE_ID_PATTERN.test(id) !== (placeValueFromId(id) !== null)) disagree.push(id);
    };
    for (const f of forms) {
      for (const a of nums) {
        check(`gpv-${f}-${a}`);
        if (f === 'greater' || f === 'less') for (const b of nums) check(`gpv-${f}-${a}-${b}`);
        else check(`gpv-${f}-${a}-${a}`);
      }
    }
    expect(disagree).toEqual([]);
  });

  it('refuses an id it cannot honestly rebuild', () => {
    for (const id of [
      'gpv-tensdigit-44', // both digits the same: no right answer to tell apart
      'gpv-onesdigit-7', 'gpv-howmanytens-100', 'gpv-tensdigit-047',
      'gpv-build-9', 'gpv-build-100', 'gpv-build-05',
      'gpv-expand-40', // 40 + 0
      'gpv-buildrev-40', 'gpv-expandrev-40', 'gpv-buildrev-44', 'gpv-expandrev-55',
      'gpv-greater-45-45', 'gpv-less-9-45', 'gpv-greater-45-100', 'gpv-greater-45', 'gpv-less-045-54',
      'gpv-build-47-', 'gpv-build-', 'gpv-', 'gpv-value-47', 'gpv-BUILD-47', ' gpv-build-47', 'gpv-build-47 ',
      'pv1-ones-47', 'pv2-build-47', 'pv3-gt-45-54', 'money-like-dime-3', '',
    ]) {
      expect(placeValueFromId(id), id).toBeNull();
      expect(PLACE_VALUE_ID_PATTERN.test(id), id).toBe(false);
    }
  });

  it('accepts the edges of what it asks', () => {
    for (const id of ['gpv-tensdigit-10', 'gpv-onesdigit-98', 'gpv-howmanytens-90', 'gpv-build-10', 'gpv-build-99',
      'gpv-expand-11', 'gpv-expand-99', 'gpv-buildrev-12', 'gpv-expandrev-98', 'gpv-greater-10-99', 'gpv-less-99-98']) {
      expect(placeValueFromId(id)?.id, id).toBe(id);
      expect(PLACE_VALUE_ID_PATTERN.test(id), id).toBe(true);
    }
  });

  it('does not collide with any hand-written place value id', () => {
    expect(PLACE_VALUE_L1_QUESTIONS.filter((q) => PLACE_VALUE_ID_PATTERN.test(q.id))).toEqual([]);
  });

  it('falls back to the bottom rung for a mode it does not know', () => {
    for (let i = 0; i < 200; i++) {
      const q = generatePlaceValueQuestion({ operation: 'place_value', mode: 'nonsense' });
      expect(DIGIT_FORMS).toContain(solve(q).form);
    }
  });
});

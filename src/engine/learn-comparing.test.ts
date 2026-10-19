import { describe, it, expect } from 'vitest';
import type { Lesson, Scene, TryStep } from '@/data/learn';
import { COMPARING_LESSONS } from '@/data/learnTopics/comparing';
import { PLACE_VALUE_LESSONS } from '@/data/learnTopics/placeValue';
import { compareFromId } from '@/data/compareGen';
import { placeValueFromId } from '@/data/placeValueGen';
import { ErrorTag, Question } from '@/types';

// Comparing and Tens & Ones lessons ask the questions play asks, in play's own
// words ("Which is more: 6 or 8?", "15 ☐ 8", "60 + 9 = ?"). So each "try" can
// be rebuilt as the play question it imitates, and checked against it: the same
// answer, wrong choices play really offers, and a helpsWith that names only tags
// play gives one of those wrong choices. The generic tests can check a sum; they
// cannot tell that "52 > 38" is true or that 🔟🔟🔟🔟🔟🔟 is the 6 tens asked for.

const LESSONS: { lesson: Lesson; topic: 'comparing' | 'place-value' }[] = [
  ...COMPARING_LESSONS.map((lesson) => ({ lesson, topic: 'comparing' as const })),
  ...PLACE_VALUE_LESSONS.map((lesson) => ({ lesson, topic: 'place-value' as const })),
];

const tries = (l: Lesson) =>
  l.steps.flatMap((s, i) => (s.kind === 'try' ? [{ s, where: `${l.id} step ${i + 1}` }] : []));

/** The id of the play question a try imitates, from its caption. */
function playId(caption: string, topic: 'comparing' | 'place-value'): string | null {
  let m: RegExpMatchArray | null;
  if (topic === 'comparing') {
    if ((m = caption.match(/^(\d+) ☐ (\d+)$/))) return `gcmp-sign-${m[1]}-${m[2]}`;
    if ((m = caption.match(/^Which is (more|bigger|less|smaller): (\d+) or (\d+)\?$/))) {
      return `gcmp-${/more|bigger/.test(m[1]) ? 'more' : 'less'}-${m[2]}-${m[3]}`;
    }
    return null;
  }
  if ((m = caption.match(/^How many tens in (\d+)\?$/))) return `gpv-howmanytens-${m[1]}`;
  if ((m = caption.match(/^(Tens|Ones) digit of (\d+)\?$/))) return `gpv-${m[1].toLowerCase()}digit-${m[2]}`;
  if ((m = caption.match(/^(\d+) tens? and (\d+) ones? = \?$/))) return `gpv-build-${10 * +m[1] + +m[2]}`;
  if ((m = caption.match(/^(\d+) ones? and (\d+) tens? = \?$/))) return `gpv-buildrev-${10 * +m[2] + +m[1]}`;
  if ((m = caption.match(/^(\d+) \+ (\d+) = \?$/))) {
    return +m[1] % 10 === 0 ? `gpv-expand-${+m[1] + +m[2]}` : `gpv-expandrev-${+m[1] + +m[2]}`;
  }
  if ((m = caption.match(/^Which is (greater|less): (\d+) or (\d+)\?$/))) return `gpv-${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/**
 * Deal the play question many times: options and their tags are dealt at
 * random for building questions, so one deal does not show them all.
 */
function deal(id: string, topic: 'comparing' | 'place-value') {
  const offered = new Map<string, Set<ErrorTag>>();
  let q: Question | null = null;
  for (let i = 0; i < 400; i++) {
    q = topic === 'comparing' ? compareFromId(id) : placeValueFromId(id);
    if (!q) return null;
    for (const c of q.choices) if (c !== q.correctAnswer) offered.set(c, offered.get(c) ?? new Set());
    for (const [c, t] of Object.entries(q.distractorMeaning ?? {})) offered.get(c)?.add(t);
  }
  return { answer: q!.correctAnswer, offered };
}

/** Every bit of text a lesson shows or says about what is true (hints describe mistakes, so not those). */
function claims(l: Lesson): { text: string; where: string }[] {
  const big = (scene?: Scene) => (scene?.kind === 'big' ? [scene.text] : []);
  return l.steps.flatMap((s, i) => {
    const where = `${l.id} step ${i + 1}`;
    const texts = [s.say, s.caption, ...big(s.scene)];
    if (s.kind === 'try') texts.push(s.then.say, s.then.caption ?? '', ...big(s.then.scene));
    return texts.map((text) => ({ text, where }));
  });
}

describe('Comparing and Tens & Ones lessons', () => {
  it('ask the question play asks, with the answer play marks', () => {
    for (const { lesson, topic } of LESSONS) {
      for (const { s, where } of tries(lesson)) {
        const id = playId(s.caption, topic);
        expect(id, `${where}: "${s.caption}" is not a question play asks`).not.toBeNull();
        const play = deal(id!, topic);
        expect(play, `${where}: play cannot ask ${id}`).not.toBeNull();
        expect(s.answer, `${where}: ${id}`).toBe(play!.answer);
        for (const c of s.choices.filter((c) => c !== s.answer)) {
          expect(play!.offered.has(c), `${where}: play never offers ${c} for ${id}`).toBe(true);
        }
      }
    }
  });

  it('claim to help only with mistakes play tags on one of their wrong choices', () => {
    for (const { lesson, topic } of LESSONS) {
      const tagged = new Set<ErrorTag>();
      for (const { s } of tries(lesson)) {
        const play = deal(playId(s.caption, topic)!, topic)!;
        for (const c of Object.keys(s.hints ?? {})) for (const t of play.offered.get(c) ?? []) tagged.add(t);
      }
      for (const tag of lesson.helpsWith ?? []) expect([...tagged], `${lesson.id} claims ${tag}`).toContain(tag);
    }
  });

  it('only ever say true things about which number is bigger', () => {
    const bad: string[] = [];
    for (const { lesson } of LESSONS) {
      for (const { text, where } of claims(lesson)) {
        const check = (ok: boolean, what: string) => { if (!ok) bad.push(`${where}: ${what}`); };
        for (const line of text.split('\n')) {
          const m = line.trim().match(/^(\d+) ([<>=]) (\d+)$/);
          if (m) check(m[2] === '>' ? +m[1] > +m[3] : m[2] === '<' ? +m[1] < +m[3] : +m[1] === +m[3], line);
        }
        for (const m of text.matchAll(/(\d+) is (greater|more|bigger|less|smaller|fewer|equal) (?:than|to) (\d+)/g)) {
          const [a, b] = [+m[1], +m[3]];
          check(/greater|more|bigger/.test(m[2]) ? a > b : /less|smaller|fewer/.test(m[2]) ? a < b : a === b, m[0]);
        }
        for (const m of text.matchAll(/(\d+) (tens?|ones?) is (more|less) than (\d+) (tens?|ones?)/g)) {
          check(m[3] === 'more' ? +m[1] > +m[4] : +m[1] < +m[4], m[0]);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('put tens and ones together into the right number', () => {
    const bad: string[] = [];
    for (const { lesson } of LESSONS) {
      for (const { text, where } of claims(lesson)) {
        const check = (n: number, t: number, o: number, what: string) => { if (n !== 10 * t + o) bad.push(`${where}: ${what}`); };
        for (const m of text.matchAll(/(\d+) (?:=|is) (\d+) tens? and (\d+) ones?/g)) check(+m[1], +m[2], +m[3], m[0]);
        for (const m of text.matchAll(/(\d+) tens? and (\d+) ones? (?:=|is|make|makes) (\d+)/g)) check(+m[3], +m[1], +m[2], m[0]);
        for (const m of text.matchAll(/(\d+) tens? (?:=|is) (\d+)/g)) check(+m[2], +m[1], 0, m[0]);
        for (const m of text.matchAll(/(\d+) ones? = (\d+) tens?/g)) check(+m[1], +m[2], 0, m[0]);
        const m = text.match(/^(\d+)\n(\d+) tens?, (\d+) ones?$/);
        if (m) check(+m[1], +m[2], +m[3], text);
      }
    }
    expect(bad).toEqual([]);
  });

  it('draw the tens and ones a building question asks for', () => {
    // 🔟 is a ten and ● a one, as play draws them.
    for (const { lesson } of LESSONS) {
      for (const { s, where } of tries(lesson)) {
        const m = s.caption.match(/^(\d+) (tens?|ones?) and (\d+) (tens?|ones?) = \?$/);
        if (!m || s.scene?.kind !== 'big') continue;
        const [tens, ones] = m[2].startsWith('ten') ? [+m[1], +m[3]] : [+m[3], +m[1]];
        expect([...s.scene.text.matchAll(/🔟/g)].length, where).toBe(tens);
        expect([...s.scene.text.matchAll(/●/g)].length, where).toBe(ones);
      }
    }
  });

  it('never write the answer in the question picture unless the question already says it', () => {
    // Rods and cubes are drawn with their number underneath unless hidden, and compared rows
    // with their counts, so drawing the answer would hand it over.
    const drawn = (scene?: Scene): number[] =>
      scene?.kind === 'tensOnes' ? (scene.hide ? [] : scene.numbers) : scene?.kind === 'compare' ? scene.rows.map((r) => r.count) : [];
    for (const { lesson } of LESSONS) {
      for (const { s, where } of tries(lesson) as { s: TryStep; where: string }[]) {
        if (drawn(s.scene).includes(Number(s.answer))) {
          expect(s.caption.match(/\d+/g) ?? [], `${where}: the picture shows ${s.answer}`).toContain(s.answer);
        }
      }
    }
  });
});

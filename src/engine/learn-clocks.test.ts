import { describe, it, expect } from 'vitest';
import type { Scene, TryStep } from '@/data/learn';
import { CLOCK_LESSONS } from '@/data/learnTopics/clocks';
import { clockFromId } from '@/data/clockGen';
import { ErrorTag } from '@/types';

// What the generic lesson tests cannot see on a clock: that a caption writes
// the time that is drawn, that the guide says times the way a child says them,
// and that every wrong button in a "try" is a misreading play really offers on
// that face, so `helpsWith` names mistakes the lesson's own hints answer.

type Clock = Extract<Scene, { kind: 'clock' }>;
const isClock = (s?: Scene): s is Clock => s?.kind === 'clock';
const label = (c: Clock) => `${c.hour}:${String(c.minute).padStart(2, '0')}`;
const minutesOf = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h % 12) * 60 + m;
};

/** The ways the guide may say a time out loud. */
function spoken(t: string): string[] {
  const [h, m] = t.split(':').map(Number);
  if (m === 0) return [`${h} o'clock`];
  if (m === 30) return [`half past ${h}`, `${h} 30`];
  if (m === 15) return [`quarter past ${h}`, `${h} 15`];
  return [`quarter to ${(h % 12) + 1}`, `${h} 45`];
}

/** Which of play's three clock questions a try asks, from the face and the answer. */
function form(scene: Clock, answer: string): 'read' | 'hour' | 'half' | null {
  const d = (minutesOf(answer) - minutesOf(label(scene)) + 720) % 720;
  return d === 0 ? 'read' : d === 60 ? 'hour' : d === 30 ? 'half' : null;
}

/** Every wrong option play offers for that question on that face, with what it means. */
function playOptions(scene: Clock, answer: string): Map<string, ErrorTag> {
  const id = `gclock-${form(scene, answer)}-${scene.hour}-${String(scene.minute).padStart(2, '0')}`;
  const seen = new Map<string, ErrorTag>();
  for (let i = 0; i < 400; i++) {
    for (const [option, tag] of Object.entries(clockFromId(id)?.distractorMeaning ?? {})) seen.set(option, tag);
  }
  return seen;
}

const tries = CLOCK_LESSONS.flatMap((l) =>
  l.steps.flatMap((s, i) => (s.kind === 'try' ? [{ lesson: l, s: s as TryStep, where: `${l.id} step ${i + 1}` }] : [])));

describe('clock lessons', () => {
  it('write in a caption only the time the clock shows', () => {
    for (const l of CLOCK_LESSONS) {
      l.steps.forEach((s, i) => {
        const shown: [string, Scene | undefined][] = [[s.caption, s.scene]];
        if (s.kind === 'try') shown.push([s.then.caption ?? '', s.then.scene]);
        for (const [caption, scene] of shown) {
          for (const t of caption.match(/\d+:\d\d/g) ?? []) {
            expect(isClock(scene) ? label(scene) : 'no clock', `${l.id} step ${i + 1}: "${caption}"`).toBe(t);
          }
        }
      });
    }
  });

  it('say times the way a child does, and say the answer once she has it', () => {
    for (const l of CLOCK_LESSONS) {
      for (const s of l.steps) {
        const said = [s.say, ...(s.kind === 'try' ? [s.then.say, ...Object.values(s.hints ?? {})] : [])];
        for (const words of said) expect(words, `${l.id}: speech would read out "3:30"`).not.toMatch(/\d:\d\d/);
      }
    }
    for (const { s, where } of tries) {
      expect(spoken(s.answer).some((w) => s.then.say.includes(w)), `${where}: "${s.then.say}" never says ${s.answer}`).toBe(true);
    }
  });

  it("ask one of play's questions, with the misreadings play offers on that face", () => {
    for (const { s, where } of tries) {
      expect(isClock(s.scene), `${where} has no clock`).toBe(true);
      const scene = s.scene as Clock;
      expect(form(scene, s.answer), `${where}: ${s.answer} is not the time shown, an hour on, or half an hour on`).not.toBeNull();
      const options = playOptions(scene, s.answer);
      for (const c of s.choices.filter((c) => c !== s.answer)) {
        expect(options.has(c), `${where}: play never offers ${c} on ${label(scene)}`).toBe(true);
      }
    }
  });

  it('help only with mistakes that their own wrong buttons are', () => {
    for (const l of CLOCK_LESSONS) {
      const carried = new Set<ErrorTag>();
      for (const { s } of tries.filter((t) => t.lesson === l)) {
        const options = playOptions(s.scene as Clock, s.answer);
        for (const c of s.choices) if (c !== s.answer && options.has(c)) carried.add(options.get(c)!);
      }
      for (const tag of l.helpsWith ?? []) expect(carried.has(tag), `${l.id}: no wrong button means ${tag}`).toBe(true);
    }
  });
});

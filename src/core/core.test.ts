import { describe, it, expect } from 'vitest';
import { STAGES, TRACKS, TrackId, ceilingFor, topStage } from './stages';
import { SKILLS_BY_ID } from '@/data/skills';
import { ceilingFor as oldCeiling } from '@/data/grades';
import { newTrack, stepTrack, TrackState, FAST_LANE, WINDOW } from './track';
import { factState, quickMs, recordFact, BOX_DAYS } from './facts';
import { classifyTyped } from './mistakes';
import { Learner, applyAnswer, completeWalk, newLearner, standingOn, sunToday, passedStones } from './learner';
import { Walk, turnPlan, warmupStage } from './walk';
import { factIdFromLegacy, migrateLegacy } from './migrate';
import { parseLearner } from './validate';
import { buildInitialProgress } from '@/store/storage';
import { todayString, daysAgoString } from '@/engine/dates';

const OLD: Record<TrackId, string> = { plus: 'adding', minus: 'taking-away' };
const DAY = 24 * 60 * 60 * 1000;
const SUM = /^(\d+) ([+-]) (\d+) = \?$/;

describe('the path', () => {
  it('is the old ladder, stone for stone, so her place moves straight across', () => {
    for (const t of TRACKS) {
      expect(STAGES[t].map((s) => s.label)).toEqual(SKILLS_BY_ID.get(OLD[t])!.rungs.map((r) => r.label));
    }
  });

  it('stops where each grade always stopped', () => {
    for (const t of TRACKS) for (const g of ['K', '1', '2'] as const) expect(ceilingFor(t, g)).toBe(oldCeiling(OLD[t], g));
  });

  it('asks only plain sums, with the right answer, on every stone', () => {
    for (const t of TRACKS) {
      STAGES[t].forEach((stage, i) => {
        for (let k = 0; k < 60; k++) {
          const q = stage.make();
          const m = q.prompt.match(SUM);
          expect(m, `${t} ${i}: ${q.prompt}`).not.toBeNull();
          const [a, op, b] = [Number(m![1]), m![2], Number(m![3])];
          expect(op).toBe(t === 'plus' ? '+' : '-');
          const answer = op === '+' ? a + b : a - b;
          expect(Number(q.correctAnswer)).toBe(answer);
          expect(answer).toBeGreaterThanOrEqual(0);
          expect(q.id).toBe(op === '+' ? `add-${a}+${b}` : `sub-${a}-${b}`);
        }
      });
    }
  });

  it('gives every stone a short stone label and an example', () => {
    for (const t of TRACKS) for (const s of STAGES[t]) {
      expect(s.stone.length).toBeLessThanOrEqual(4);
      expect(s.example).toMatch(/\d/);
    }
  });
});

describe('moving along a track', () => {
  const step = (s: TrackState, correct: boolean, served = s.stage, ceiling = 9, top = 12) =>
    stepTrack(s, { correct, served, ceiling, top, day: '2026-11-05' });
  const feed = (s: TrackState, answers: boolean[], ceiling = 9) =>
    answers.reduce((st, c) => step(st, c, Math.min(st.stage, ceiling), ceiling).state, s);

  it('moves a new track up after its first four right, and remembers the day', () => {
    const r = feed(newTrack(), Array(FAST_LANE).fill(true));
    expect(r.stage).toBe(1);
    expect(r.passed[0]).toBe('2026-11-05');
  });

  it('needs 6 of 8 once a track has moved her back', () => {
    const placed: TrackState = { ...newTrack(), stage: 3, demotions: 1 };
    expect(feed(placed, Array(FAST_LANE).fill(true)).stage).toBe(3);
    expect(feed(placed, [true, true, false, true, true, false, true, true]).stage).toBe(4);
  });

  it('moves her back after 3 or fewer of 8, and closes the fast lane', () => {
    const r = feed({ ...newTrack(), stage: 3 }, [false, true, false, false, true, false, true, false]);
    expect(r.stage).toBe(2);
    expect(r.demotions).toBe(1);
  });

  it('ignores answers from any other stone', () => {
    const s: TrackState = { ...newTrack(), stage: 3 };
    const r = step(s, true, 2);
    expect(r.state).toBe(s);
    expect(step(s, true, null as unknown as number).state).toBe(s);
  });

  it('holds her at her grade, and counts it only when the grade is what stopped her', () => {
    const top: TrackState = { ...newTrack(), stage: 9, demotions: 1 };
    const blocked = feed(top, Array(WINDOW).fill(true), 9);
    expect(blocked.stage).toBe(9);
    expect(blocked.ceilingHits).toBe(1);
    const atEnd = Array(WINDOW).fill(true).reduce(
      (st: TrackState) => stepTrack(st, { correct: true, served: 12, ceiling: 12, top: 12, day: 'x' }).state,
      { ...newTrack(), stage: 12, demotions: 1 },
    );
    expect(atEnd.ceilingHits).toBe(0);
  });
});

describe('fact records', () => {
  const now = Date.parse('2026-11-05T17:00:00');
  it('moves a right answer up a box and further out, and a wrong one back to now', () => {
    const a = recordFact(undefined, { correct: true, ms: 2000, now, day: '2026-11-05' });
    expect(a.box).toBe(1);
    expect(a.due).toBe(now + BOX_DAYS[1] * DAY);
    const b = recordFact(a, { correct: false, typed: '12', tag: 'wrong-operation', now, day: '2026-11-05' });
    expect(b).toMatchObject({ box: 0, due: now, said: '12', tag: 'wrong-operation', seen: 2, right: 1 });
  });

  it('calls a fact known only when it is quick on more than one day', () => {
    let f = recordFact(undefined, { correct: true, ms: 1500, now, day: '2026-11-04' });
    f = recordFact(f, { correct: true, ms: 1500, now, day: '2026-11-04' });
    expect(factState(f, 3000)).toBe('slow');
    f = recordFact(f, { correct: true, ms: 1500, now, day: '2026-11-05' });
    expect(factState(f, 3000)).toBe('fast');
    expect(factState(recordFact(f, { correct: false, now, day: '2026-11-05' }), 3000)).toBe('learning');
    expect(factState(undefined, 3000)).toBe('new');
  });

  it('never counts a wandered-off answer as a time', () => {
    expect(recordFact(undefined, { correct: true, ms: 120_000, now, day: 'd' }).recent).toEqual([]);
  });

  it('measures quick against her own +1 facts', () => {
    expect(quickMs({})).toBe(4500);
    const slowTapper = Object.fromEntries(['add-3+1', 'add-5+1', 'sub-7-1'].map((id) => [id,
      { seen: 1, right: 1, box: 1, due: 0, recent: [{ day: 'd', ms: 4000 }] }]));
    expect(quickMs(slowTapper)).toBe(6000);
  });
});

describe('what a typed wrong answer means', () => {
  const q = (prompt: string) => {
    const [, a, op, b] = prompt.match(SUM)!;
    const answer = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
    return { prompt, correctAnswer: String(answer) } as Parameters<typeof classifyTyped>[0];
  };
  it('reads the mistakes a six-year-old makes', () => {
    expect(classifyTyped(q('9 - 3 = ?'), '12')).toBe('wrong-operation');
    expect(classifyTyped(q('9 + 3 = ?'), '6')).toBe('wrong-operation');
    expect(classifyTyped(q('9 + 3 = ?'), '11')).toBe('off-by-one');
    expect(classifyTyped(q('9 + 3 = ?'), '9')).toBe('answered-a-given-number');
    expect(classifyTyped(q('9 + 3 = ?'), '22')).toBe('place-value');
    expect(classifyTyped(q('9 + 3 = ?'), '40')).toBe('unknown');
  });
});

function learnerAt(plus: number, minus: number, extra: Partial<Learner> = {}): Learner {
  const l = newLearner();
  l.tracks.plus = { ...newTrack(), stage: plus, demotions: 1 };
  l.tracks.minus = { ...newTrack(), stage: minus, demotions: 1 };
  return { ...l, ...extra };
}

describe('applying an answer', () => {
  it('moves the window only for a sum from the stone she stands on', () => {
    const l = learnerAt(3, 3);
    const fresh = applyAnswer(l, { track: 'plus', stage: 3, factId: 'add-9+2', correct: true }).learner;
    expect(fresh.tracks.plus.recent).toEqual([true]);
    const warm = applyAnswer(l, { track: 'plus', stage: 1, factId: 'add-9+2', correct: true }).learner;
    expect(warm.tracks.plus.recent).toEqual([]);
    const review = applyAnswer(l, { track: 'plus', stage: null, factId: 'add-9+2', correct: false }).learner;
    expect(review.tracks.plus.recent).toEqual([]);
    // ...but every one of them is recorded against the fact and the day.
    expect(warm.facts['add-9+2'].seen).toBe(1);
    expect(review.days[todayString()].answered).toBe(1);
  });

  it('keeps a streak across days and restarts it after a gap', () => {
    let l = { ...newLearner(), streak: { current: 4, best: 4, last: daysAgoString(1) } };
    l = applyAnswer(l, { track: 'plus', stage: 0, factId: 'add-1+1', correct: true }).learner;
    expect(l.streak).toEqual({ current: 5, best: 5, last: todayString() });
    l = { ...l, streak: { current: 5, best: 5, last: daysAgoString(3) } };
    expect(applyAnswer(l, { track: 'plus', stage: 0, factId: 'add-1+1', correct: true }).learner.streak.current).toBe(1);
  });

  it('fills the sun across today\'s walks, and never past full', () => {
    let l = newLearner();
    expect(sunToday(l)).toBe(0);
    for (let i = 0; i < 5; i++) l = completeWalk(l);
    expect(sunToday(l)).toBe(1);
  });
});

describe('a walk', () => {
  it('takes turns two of each in every block of four', () => {
    for (let i = 0; i < 30; i++) {
      const plan = turnPlan(20);
      for (let b = 0; b < 20; b += 4) expect(plan.slice(b, b + 4).filter((t) => t === 'plus')).toHaveLength(2);
    }
  });

  it('is plain sums, mostly from where she stands, with a look back every fourth', () => {
    const w = new Walk(learnerAt(6, 6), 20);
    const items = Array.from({ length: 20 }, () => w.next()!);
    expect(w.next()).toBeNull();
    items.forEach((it, i) => {
      expect(it.question.prompt).toMatch(SUM);
      if (i % 4 === 3) expect(['warmup', 'review']).toContain(it.kind);
      else expect(it.kind).toBe('fresh');
      if (it.kind === 'warmup') expect(it.stage!).toBeLessThan(6);
      if (it.kind === 'fresh') expect(it.stage).toBe(6);
    });
  });

  it('brings a due fact back as a review on its own track', () => {
    // 15 − 9 is beyond "within 10", so only the review can ask it.
    const l = learnerAt(4, 4, { facts: { 'sub-15-9': { seen: 2, right: 1, box: 0, due: 0, recent: [] } } });
    const w = new Walk(l, 8);
    const items = Array.from({ length: 8 }, () => w.next()!);
    const reviews = items.filter((i) => i.kind === 'review');
    expect(reviews.map((r) => r.question.id)).toEqual(['sub-15-9']);
    expect(reviews[0].track).toBe('minus');
    expect(reviews[0].stage).toBeNull();
  });

  it('brings a miss back three sums later', () => {
    const w = new Walk(learnerAt(4, 4), 10);
    const first = w.next()!;
    w.missed(first);
    w.next(); w.next();
    const back = w.next()!;
    expect(back.question.id).toBe(first.question.id);
    expect(back.kind).toBe('retry');
  });

  it('gives a grown-up\'s pick every turn, look-backs aside', () => {
    const until = daysAgoString(-3);
    const w = new Walk(learnerAt(6, 6, { focus: { track: 'plus', stage: 1, until } }), 12);
    const items = Array.from({ length: 12 }, () => w.next()!);
    expect(items.every((i) => i.track === 'plus')).toBe(true);
    expect(items.filter((i) => i.kind === 'focus').every((i) => i.question.prompt.includes('+ 2'))).toBe(true);
    const expired = new Walk(learnerAt(6, 6, { focus: { track: 'plus', stage: 1, until: daysAgoString(1) } }), 12);
    expect(Array.from({ length: 12 }, () => expired.next()!).some((i) => i.track === 'minus')).toBe(true);
  });

  it('has no warm-up below the first stone', () => {
    expect(warmupStage(0)).toBeNull();
    for (let i = 0; i < 50; i++) expect(warmupStage(5)).toBeGreaterThanOrEqual(2);
  });
});

describe('a child the path has to find', () => {
  // She knows everything up to a stone and mostly not beyond it. Starting from
  // the first stone, the path should find her level fast and then stay there,
  // rather than racing past it or leaving her below it.
  function simulate(knowsUpTo: number, walks: number) {
    let l = newLearner();
    let firstReached = -1;
    let answered = 0;
    for (let w = 0; w < walks; w++) {
      const walk = new Walk(l, 10);
      for (let item = walk.next(); item; item = walk.next()) {
        const knows = item.stage === null || item.stage <= knowsUpTo;
        const correct = knows ? Math.random() < 0.95 : Math.random() < 0.25;
        l = applyAnswer(l, { track: item.track, stage: item.stage, factId: item.question.id, correct, ms: 2500 }).learner;
        walk.sync(l);
        if (!correct) walk.missed(item);
        answered++;
        if (firstReached < 0 && standingOn(l, 'plus') >= knowsUpTo) firstReached = answered;
      }
      l = completeWalk(l);
    }
    return { l, firstReached };
  }

  it('reaches her level within a few walks and settles there', () => {
    for (let run = 0; run < 10; run++) {
      const { l, firstReached } = simulate(5, 15);
      expect(firstReached, 'found her level').toBeGreaterThan(0);
      // About five answers a stone on each track at 95%: five stones in under
      // eight walks of ten, i.e. two or three days for a brand-new child.
      expect(firstReached).toBeLessThanOrEqual(80);
      expect(standingOn(l, 'plus')).toBeGreaterThanOrEqual(4);
      expect(standingOn(l, 'plus')).toBeLessThanOrEqual(6);
      expect(passedStones(l).plus.has(4)).toBe(true);
    }
  });
});

describe('bringing her over from the old app', () => {
  const old = () => {
    const p = buildInitialProgress();
    p.version = 7;
    p.characterId = 'cat';
    p.gradeLevel = '1';
    p.currentStreak = 3; p.longestStreak = 8; p.lastPlayedDate = '2026-11-04';
    p.playHistory = ['2026-11-03', '2026-11-04'];
    p.skills = {
      adding: { skillId: 'adding', rung: 4, recent: [true, false], attempts: 80, correct: 60, ceilingHits: 0, demotions: 2 },
      'taking-away': { skillId: 'taking-away', rung: 3, recent: [], attempts: 40, correct: 30, ceilingHits: 0 },
      clocks: { skillId: 'clocks', rung: 1, recent: [], attempts: 5, correct: 5, ceilingHits: 0 },
    };
    const card = (questionId: string, repetitions: number) => ({ questionId, easeFactor: 2.5, intervalDays: 1, nextDueDate: 123, repetitions, lastSeen: 0 });
    p.srsCards = { a: card('add-3+4', 2), b: card('dbl-6', 9), c: card('mk10-3', 1), d: card('sub-9-4', 0), e: card('cnt-12+3', 1), f: card('gclock-read-7-00', 2) };
    return p;
  };

  it('keeps her place on both tracks, by meaning', () => {
    const l = migrateLegacy(old());
    expect(STAGES.plus[l.tracks.plus.stage].label).toBe('Adding within 10');
    expect(STAGES.minus[l.tracks.minus.stage].label).toBe('Counting back 1, 2 or 3');
    expect(l.tracks.plus.recent).toEqual([true, false]);
    expect(l.tracks.plus.demotions).toBe(2);
    expect(l.tracks.minus.demotions, 'an old save that never counted stays uncounted').toBeUndefined();
    expect(l.tracks.plus.passed, 'no made-up dates for stones passed in the old app').toEqual({});
    expect([...passedStones(l).plus].sort()).toEqual([0, 1, 2, 3]);
  });

  it('carries the facts she has been practising, and nothing that is not a sum', () => {
    const l = migrateLegacy(old());
    expect(Object.keys(l.facts).sort()).toEqual(['add-12+3', 'add-3+4', 'add-6+6', 'sub-9-4']);
    expect(l.facts['add-6+6'].box).toBe(5);
    expect(l.facts['add-3+4'].due).toBe(123);
    expect(factIdFromLegacy('sub-3-9')).toBeNull();
  });

  it('carries her character, grade, streak and the days she played', () => {
    const l = migrateLegacy(old());
    expect(l.profile).toMatchObject({ characterId: 'cat', grade: '1', readAloud: true });
    expect(l.streak).toEqual({ current: 3, best: 8, last: '2026-11-04' });
    expect(Object.keys(l.days).sort()).toEqual(['2026-11-03', '2026-11-04']);
    expect(l.migratedFrom).toBe(7);
  });

  it('never changes the old save', () => {
    const o = old();
    const before = JSON.stringify(o);
    migrateLegacy(o);
    expect(JSON.stringify(o)).toBe(before);
  });

  it('starts a child with no old save at the beginning', () => {
    const l = migrateLegacy(null);
    expect(l.tracks.plus.stage).toBe(0);
    expect(l.tracks.plus.demotions).toBe(0);
  });
});

describe('reading a save back', () => {
  it('round-trips a learner exactly', () => {
    const l = migrateLegacy(null);
    l.profile.pin = '4821';
    l.focus = { track: 'minus', stage: 2, until: '2026-11-12' };
    const played = applyAnswer(l, { track: 'plus', stage: 0, factId: 'add-4+1', correct: false, typed: '4', tag: 'answered-a-given-number', ms: 3000 }).learner;
    expect(parseLearner(JSON.parse(JSON.stringify(played)))).toEqual(played);
  });

  it('repairs what it can and refuses what it cannot', () => {
    expect(parseLearner(null)).toBeNull();
    expect(parseLearner({ schema: 2 })).toBeNull();
    const repaired = parseLearner({
      schema: 1,
      tracks: { plus: { stage: 99, recent: [true, 'x', null] }, minus: 'junk' },
      facts: { 'add-1+1': { seen: 2, right: 9, box: 40 }, 'clock-3': { seen: 1 } },
      profile: { pin: '12', walkLength: 7, grade: 'Q' },
    })!;
    expect(repaired.tracks.plus.stage).toBe(topStage('plus'));
    expect(repaired.tracks.plus.recent).toEqual([true]);
    expect(repaired.tracks.minus.stage).toBe(0);
    expect(repaired.facts['add-1+1']).toMatchObject({ right: 2, box: 5 });
    expect(repaired.facts['clock-3']).toBeUndefined();
    expect(repaired.profile).toMatchObject({ pin: null, walkLength: 10, grade: '1' });
  });
});

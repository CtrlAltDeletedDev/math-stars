import { describe, it, expect } from 'vitest';
import { SKILLS, SKILLS_BY_ID, questionForRung, bankPoolFor, rankFor } from '@/data/skills';
import { recordSkillAnswer, newSkillState, LADDER, isMaxed } from './skillLadder';
import { PracticeQueue } from './practiceSession';
import { buildInitialProgress, normalizeProgress } from '@/store/storage';
import { passedLevel } from './scoring';
import { RUNG_FOR_LEVEL, SKILL_FOR_LEVEL, allCatalogueLevelIds } from '@/data/topics';
import { UserProgress, SkillState } from '@/types';

// ---------------------------------------------------------------------------
// The ladder definitions
// ---------------------------------------------------------------------------

describe('skill ladders', () => {
  it('all have unique ids and at least two rungs', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(ids.length).toBe(new Set(ids).size);
    const thin = SKILLS.filter((s) => s.rungs.length < 2).map((s) => s.id);
    expect(thin).toEqual([]);
  });

  it('produce a valid question at every rung', () => {
    const bad: string[] = [];
    for (const skill of SKILLS) {
      for (let rung = 0; rung < skill.rungs.length; rung++) {
        for (let i = 0; i < 60; i++) {
          const q = questionForRung(skill, rung);
          if (!q) { bad.push(`${skill.id}#${rung}: no question`); break; }
          if (!q.choices.includes(q.correctAnswer)) bad.push(`${skill.id}#${rung}/${q.id}: answer not in choices`);
          if (new Set(q.choices).size !== q.choices.length) bad.push(`${skill.id}#${rung}/${q.id}: duplicate choice ${JSON.stringify(q.choices)}`);
          if (q.choices.length < 2 || q.choices.length > 4) bad.push(`${skill.id}#${rung}/${q.id}: ${q.choices.length} choices`);
          if (!q.prompt.trim()) bad.push(`${skill.id}#${rung}: blank prompt`);
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('never leave a bank rung with an empty pool', () => {
    const empty: string[] = [];
    for (const skill of SKILLS) {
      skill.rungs.forEach((r, i) => {
        if (r.source.kind === 'bank' && bankPoolFor(r.source).length < 4) {
          empty.push(`${skill.id}#${i}: only ${bankPoolFor(r.source as never).length} questions`);
        }
      });
    }
    expect(empty).toEqual([]);
  });

  it('get harder as the rungs go up', () => {
    // Spot-check the arithmetic ladders: the biggest number seen at a high rung
    // should exceed the biggest at a low rung.
    for (const id of ['adding', 'taking-away']) {
      const skill = SKILLS_BY_ID.get(id)!;
      const maxAt = (rung: number) => {
        let m = 0;
        for (let i = 0; i < 200; i++) {
          const q = questionForRung(skill, rung)!;
          for (const n of q.prompt.match(/\d+/g) ?? []) m = Math.max(m, Number(n));
        }
        return m;
      };
      expect(maxAt(skill.rungs.length - 1), id).toBeGreaterThan(maxAt(0));
    }
  });

  it('give every rung a rank badge', () => {
    for (const skill of SKILLS) {
      for (let r = 0; r < skill.rungs.length; r++) {
        expect(rankFor(r), `${skill.id}#${r}`).toBeTruthy();
      }
    }
  });
});

describe('fractions', () => {
  const skill = SKILLS_BY_ID.get('fractions')!;

  it('only ever shows proper fractions', () => {
    const bad: string[] = [];
    for (let rung = 0; rung < skill.rungs.length; rung++) {
      for (let i = 0; i < 300; i++) {
        const q = questionForRung(skill, rung)!;
        for (const c of q.choices) {
          const m = c.match(/^(\d+)\/(\d+)$/);
          if (!m) continue; // "fraction of a set" answers are plain numbers
          const [n, d] = [Number(m[1]), Number(m[2])];
          if (n < 1 || d < 2 || n >= d) bad.push(`${q.id}: offered ${c}`);
        }
      }
    }
    expect([...new Set(bad)].slice(0, 8)).toEqual([]);
  });

  it('never has two options that are the same fraction', () => {
    // 2/4 and 1/2 are the same amount shaded, so both would be right.
    const value = (c: string) => {
      const m = c.match(/^(\d+)\/(\d+)$/);
      return m ? Number(m[1]) / Number(m[2]) : NaN;
    };
    const bad: string[] = [];
    for (let rung = 0; rung < skill.rungs.length; rung++) {
      for (let i = 0; i < 300; i++) {
        const q = questionForRung(skill, rung)!;
        const vals = q.choices.map(value).filter((v) => !Number.isNaN(v));
        if (new Set(vals).size !== vals.length) bad.push(`${q.id}: ${JSON.stringify(q.choices)}`);
      }
    }
    expect([...new Set(bad)].slice(0, 8)).toEqual([]);
  });

  it('does not reveal the answer in the picture when comparing', () => {
    const compareRung = skill.rungs.findIndex((r) => r.source.kind === 'fraction' && r.source.mode === 'compare');
    expect(compareRung).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 200; i++) {
      const q = questionForRung(skill, compareRung)!;
      // Every option must be drawn, not just the right one.
      expect(q.visual?.kind).toBe('fractionSet');
      const vis = q.visual;
      const drawn = vis && vis.kind === 'fractionSet' ? vis.fractions.map(([n, d]) => `${n}/${d}`) : [];
      expect([...drawn].sort()).toEqual([...q.choices].sort());
    }
  });

  it('always offers four options when reading a picture', () => {
    const thin: string[] = [];
    for (let rung = 0; rung < skill.rungs.length; rung++) {
      if (skill.rungs[rung].source.kind !== 'fraction') continue;
      const mode = (skill.rungs[rung].source as { mode: string }).mode;
      if (mode !== 'recognise') continue;
      for (let i = 0; i < 400; i++) {
        const q = questionForRung(skill, rung)!;
        if (q.choices.length !== 4) thin.push(`${q.id}: ${q.choices.length} options`);
      }
    }
    expect([...new Set(thin)].slice(0, 8)).toEqual([]);
  });

  it('gets to bigger denominators at higher rungs', () => {
    const maxDen = (rung: number) => {
      let m = 0;
      for (let i = 0; i < 300; i++) {
        const q = questionForRung(skill, rung)!;
        for (const c of q.choices) {
          const d = c.match(/^\d+\/(\d+)$/);
          if (d) m = Math.max(m, Number(d[1]));
        }
      }
      return m;
    };
    expect(maxDen(3)).toBeGreaterThan(maxDen(0));
  });
});

// ---------------------------------------------------------------------------
// Promotion and demotion
// ---------------------------------------------------------------------------

describe('the promote/demote rule', () => {
  const run = (results: boolean[], start = newSkillState('adding')) =>
    results.reduce((st, r) => recordSkillAnswer(st, r).state, start);

  it('does not move her before a full window', () => {
    const st = run(Array(LADDER.window - 1).fill(true));
    expect(st.rung).toBe(0);
  });

  it('promotes after 6 of 8 correct', () => {
    const st = run([true, true, true, true, true, true, false, false]);
    expect(st.rung).toBe(1);
    expect(st.recent).toEqual([]); // window cleared, so she gets a fresh look
  });

  it('does not promote on 5 of 8', () => {
    const st = run([true, true, true, true, true, false, false, false]);
    expect(st.rung).toBe(0);
  });

  it('demotes after 3 of 8 correct', () => {
    const start = { ...newSkillState('adding'), rung: 2 };
    const st = run([true, true, true, false, false, false, false, false], start);
    expect(st.rung).toBe(1);
  });

  it('never goes below the first rung', () => {
    const st = run(Array(40).fill(false));
    expect(st.rung).toBe(0);
  });

  it('never climbs past the top rung', () => {
    const skill = SKILLS_BY_ID.get('adding')!;
    const st = run(Array(400).fill(true));
    expect(st.rung).toBe(skill.rungs.length - 1);
    expect(isMaxed(st)).toBe(true);
  });

  it('does not oscillate on a mixed run', () => {
    // Alternating right/wrong is 50% — comfortably between the two thresholds,
    // so she should sit still rather than bounce.
    let st = { ...newSkillState('adding'), rung: 2 };
    const moves: string[] = [];
    for (let i = 0; i < 200; i++) {
      const r = recordSkillAnswer(st, i % 2 === 0);
      if (r.move) moves.push(r.move);
      st = r.state;
    }
    expect(moves).toEqual([]);
    expect(st.rung).toBe(2);
  });

  it('reports the move so the screen can celebrate it', () => {
    let st = newSkillState('adding');
    let promoted = false;
    for (let i = 0; i < LADDER.window; i++) {
      const r = recordSkillAnswer(st, true);
      st = r.state;
      if (r.move === 'promoted') { promoted = true; expect(r.fromRung).toBe(0); }
    }
    expect(promoted).toBe(true);
  });

  it('keeps counting attempts across moves', () => {
    const st = run(Array(50).fill(true));
    expect(st.attempts).toBe(50);
    expect(st.correct).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Which rung the evidence is about
// ---------------------------------------------------------------------------

describe('an answer only moves her when it came from her own rung', () => {
  const feed = (
    start: SkillState,
    results: boolean[],
    servedRung: number | null,
    ceiling?: number,
  ) => results.reduce(
    (st, r) => recordSkillAnswer(st, r, ceiling, servedRung).state,
    start,
  );

  it('does not promote her for acing an easier rung', () => {
    // The reported case: a child standing on rung 2 replays "Adding 1 more"
    // (rung 0) four times. Every level is one full window, so each replay used
    // to be one guaranteed promotion -- four replays walked her to rung 6,
    // "Adding within 100", on nothing harder than n + 1.
    let st: SkillState = { ...newSkillState('adding'), rung: 2 };
    for (let replay = 0; replay < 4; replay++) {
      st = feed(st, Array(LADDER.window).fill(true), 0);
    }
    expect(st.rung).toBe(2);
    expect(st.attempts).toBe(4 * LADDER.window); // but the effort still counted
    expect(st.correct).toBe(4 * LADDER.window);
  });

  it('does not demote her for failing a harder rung', () => {
    // The mirror image, and the reason the replay strip was unsafe in both
    // directions: a curious tap on a level well above her should not cost her
    // the ground she has.
    let st: SkillState = { ...newSkillState('adding'), rung: 3 };
    st = feed(st, Array(LADDER.window * 3).fill(false), 6);
    expect(st.rung).toBe(3);
    expect(st.attempts).toBe(LADDER.window * 3);
  });

  it('still promotes on evidence from the rung she is standing on', () => {
    const start: SkillState = { ...newSkillState('adding'), rung: 2 };
    const st = feed(start, Array(LADDER.window).fill(true), 2);
    expect(st.rung).toBe(3);
  });

  it('still demotes on evidence from the rung she is standing on', () => {
    const start: SkillState = { ...newSkillState('adding'), rung: 2 };
    const st = feed(start, Array(LADDER.window).fill(false), 2);
    expect(st.rung).toBe(1);
  });

  it('never folds an answer marked as belonging to no rung', () => {
    // What an SRS review passes, and what a mixed level passes for a question
    // routed to a second ladder: real effort, no claim about where she stands.
    const start: SkillState = { ...newSkillState('adding'), rung: 2 };
    const st = feed(start, Array(LADDER.window * 4).fill(true), null);
    expect(st.rung).toBe(2);
    expect(st.recent).toEqual([]);
    expect(st.attempts).toBe(LADDER.window * 4);
  });

  it('leaves the window untouched by off-rung answers', () => {
    // Off-rung answers must not even dilute the window, or a replay could still
    // push a genuine promotion over the line.
    let st: SkillState = { ...newSkillState('adding'), rung: 1 };
    st = feed(st, [true, true, true], 1);       // three real answers
    st = feed(st, Array(20).fill(false), 0);    // a long easy replay, all wrong
    expect(st.recent).toEqual([true, true, true]);
    st = feed(st, [true, true, true, true, true], 1);
    expect(st.rung).toBe(2); // the 8 on-rung answers still promote her
  });

  it('treats the ceiling as her rung when her saved rung sits above it', () => {
    // A child moved *down* a grade keeps her saved rung but is served at the
    // ceiling. Those answers are evidence about the ceiling rung, which is the
    // only ground she is actually standing on.
    const start: SkillState = { ...newSkillState('adding'), rung: 6 };
    const st = feed(start, Array(LADDER.window).fill(false), 4, 4);
    expect(st.rung).toBe(3); // demoted from the ceiling, not frozen
  });

  it('keeps its old meaning when the caller says nothing', () => {
    // Every pre-existing caller and test omits the argument, and must still get
    // the original behaviour.
    const start: SkillState = { ...newSkillState('adding'), rung: 2 };
    const st = Array(LADDER.window).fill(true)
      .reduce((s: SkillState, r: boolean) => recordSkillAnswer(s, r).state, start);
    expect(st.rung).toBe(3);
  });
});

describe('a practice pick says which rung it came from', () => {
  const dueCard = (questionId: string) => ({
    questionId, easeFactor: 2.5, intervalDays: 1,
    nextDueDate: Date.now() - 1000, repetitions: 0, lastSeen: 0,
  });

  it('reports the rung it served for a fresh question', () => {
    const p = buildInitialProgress();
    p.gradeLevel = '2';
    p.practiceFocus = ['adding'];
    p.skills = { adding: { skillId: 'adding', rung: 3, recent: [], attempts: 0, correct: 0 } };
    const q = new PracticeQueue(p);
    let sawFresh = false;
    for (let i = 0; i < 40; i++) {
      const pick = q.next();
      if (pick?.skillId === 'adding' && pick.rung !== null) { sawFresh = true; expect(pick.rung).toBe(3); }
    }
    expect(sawFresh).toBe(true);
  });

  it('reports the ceiling, not the saved rung, when her grade clamps her', () => {
    // Her ladder says rung 7 but first grade tops out at 4, so that is the rung
    // she is actually served -- and therefore the one her answers are about.
    const p = buildInitialProgress();
    p.gradeLevel = '1';
    p.practiceFocus = ['adding'];
    p.skills = { adding: { skillId: 'adding', rung: 7, recent: [], attempts: 0, correct: 0 } };
    const q = new PracticeQueue(p);
    let sawFresh = false;
    for (let i = 0; i < 40; i++) {
      const pick = q.next();
      if (pick?.skillId === 'adding' && pick.rung !== null) { sawFresh = true; expect(pick.rung).toBe(4); }
    }
    expect(sawFresh).toBe(true);
  });

  it('routes an SRS review to a ladder but gives it no rung', () => {
    // Focus is deliberately on a different topic, so a pick routed to `adding`
    // can only be the review -- not a fresh question that happens to look alike.
    const p = buildInitialProgress();
    p.gradeLevel = '2';
    p.practiceFocus = ['clocks'];
    p.srsCards = { 'add-3+4': dueCard('add-3+4') };
    const q = new PracticeQueue(p);

    let review = null;
    for (let i = 1; i <= 5; i++) review = q.next(); // every fifth slot is a review
    expect(review).not.toBeNull();
    expect(review!.question.id).toBe('add-3+4');
    expect(review!.skillId, 'a review used to be invisible to the ladder').toBe('adding');
    expect(review!.rung, 'a review says nothing about where she is standing').toBeNull();
  });

  it('a requeued miss keeps the rung it was first served from', () => {
    const p = buildInitialProgress();
    p.gradeLevel = '2';
    p.practiceFocus = ['adding'];
    p.skills = { adding: { skillId: 'adding', rung: 2, recent: [], attempts: 0, correct: 0 } };
    const q = new PracticeQueue(p);
    const first = q.next()!;
    q.missed(first.question, first.skillId, first.rung);
    for (let i = 0; i < 10; i++) {
      const pick = q.next();
      if (pick?.question.id === first.question.id) {
        expect(pick.rung).toBe(first.rung);
        return;
      }
    }
    throw new Error('the requeued question never came back');
  });
});

describe('every catalogue level names the rung it teaches', () => {
  it('has a rung for every level, so level play is never off-rung by accident', () => {
    // recordLevelComplete passes `RUNG_FOR_LEVEL.get(levelId) ?? null`, and null
    // means "do not move her". A level missing from the table would therefore
    // stop feeding the ladder silently rather than loudly.
    const missing = allCatalogueLevelIds().filter((id) => !RUNG_FOR_LEVEL.has(id));
    expect(missing).toEqual([]);
  });

  it('never claims a rung the skill does not have', () => {
    for (const [levelId, rung] of RUNG_FOR_LEVEL) {
      const skillId = SKILL_FOR_LEVEL.get(levelId)!;
      const skill = SKILLS_BY_ID.get(skillId)!;
      expect(rung, `${levelId} -> ${skillId}`).toBeLessThan(skill.rungs.length);
      expect(rung, `${levelId} -> ${skillId}`).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// The endless session
// ---------------------------------------------------------------------------

describe('practice queue', () => {
  it('never runs dry', () => {
    const q = new PracticeQueue(buildInitialProgress());
    for (let i = 0; i < 500; i++) {
      const pick = q.next();
      expect(pick, `ran out at question ${i}`).not.toBeNull();
      expect(pick!.question.choices).toContain(pick!.question.correctAnswer);
    }
  });

  // The tiered "waves" this used to assert are gone; the grade band decides what
  // she meets. A five-year-old must never be handed fractions or the times
  // tables, and that is now a statement about her grade, not about her rung.
  it('keeps second-grade topics away from a kindergartener', () => {
    const p = buildInitialProgress();
    p.gradeLevel = 'K';
    const q = new PracticeQueue(p);
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const pick = q.next();
      if (pick?.skillId) seen.add(pick.skillId);
    }
    for (const outOfScope of ['fractions', 'money', 'clocks', 'place-value', 'even-odd', 'counting-up']) {
      expect(seen.has(outOfScope), `K should not be served ${outOfScope}`).toBe(false);
    }
    expect(seen.has('adding')).toBe(true);
  });

  it('opens the whole ladder to a second grader', () => {
    const p = buildInitialProgress();
    p.gradeLevel = '2';
    const q = new PracticeQueue(p);
    const seen = new Set<string>();
    for (let i = 0; i < 900; i++) {
      const pick = q.next();
      if (pick?.skillId) seen.add(pick.skillId);
    }
    expect(seen.size).toBeGreaterThanOrEqual(Math.floor(SKILLS.length * 0.7));
    expect(seen.has('fractions')).toBe(true);
  });

  it('never serves a question above her grade ceiling', () => {
    // Her ladder says "adding within 200" but she is set to first grade, whose
    // ceiling is "within 20". The seeded rung must not leak harder questions.
    const p = buildInitialProgress();
    p.gradeLevel = '1';
    p.skills = { adding: { skillId: 'adding', rung: 7, recent: [], attempts: 0, correct: 0 } };
    p.practiceFocus = ['adding'];
    const q = new PracticeQueue(p);
    let maxSeen = 0;
    for (let i = 0; i < 400; i++) {
      const pick = q.next();
      if (pick?.skillId !== 'adding') continue;
      for (const n of pick.question.prompt.match(/\d+/g) ?? []) maxSeen = Math.max(maxSeen, Number(n));
    }
    expect(maxSeen, 'first grade tops out at sums within 20').toBeLessThanOrEqual(20);
  });

  it('keeps a topic she has started even after the grade moves on', () => {
    const p = buildInitialProgress();
    p.gradeLevel = 'K';
    p.skills = { clocks: { skillId: 'clocks', rung: 0, recent: [], attempts: 3, correct: 2 } };
    const q = new PracticeQueue(p);
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const pick = q.next();
      if (pick?.skillId) seen.add(pick.skillId);
    }
    expect(seen.has('clocks'), 'a topic must not vanish from under her').toBe(true);
  });

  it('sticks to the parent\'s picks when Focus Mode is on', () => {
    const p = buildInitialProgress();
    p.practiceFocus = ['adding', 'taking-away'];
    const q = new PracticeQueue(p);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const pick = q.next();
      if (pick?.skillId) seen.add(pick.skillId);
    }
    expect([...seen].sort()).toEqual(['adding', 'taking-away']);
  });

  it('ignores a focus list naming skills that no longer exist', () => {
    const p = buildInitialProgress();
    p.practiceFocus = ['no-such-skill'];
    const q = new PracticeQueue(p);
    // Falls back to the unlocked set rather than running dry.
    expect(q.next()?.skillId).toBeTruthy();
  });

  it('brings a missed question back later in the same session', () => {
    const q = new PracticeQueue(buildInitialProgress());
    const first = q.next()!;
    q.missed(first.question, first.skillId);
    let cameBack = false;
    for (let i = 0; i < 10; i++) {
      if (q.next()?.question.id === first.question.id) { cameBack = true; break; }
    }
    expect(cameBack).toBe(true);
  });

  it('asks questions at the rung she is actually on', () => {
    const p = buildInitialProgress();
    p.skills = { adding: { skillId: 'adding', rung: 6, recent: [], attempts: 0, correct: 0 } };
    const q = new PracticeQueue(p);
    let maxSeen = 0;
    for (let i = 0; i < 600; i++) {
      const pick = q.next();
      if (pick?.skillId !== 'adding') continue;
      for (const n of pick.question.prompt.match(/\d+/g) ?? []) maxSeen = Math.max(maxSeen, Number(n));
    }
    // Rung 6 of adding is "within 100"; the bottom rungs could never produce
    // numbers this big.
    expect(maxSeen).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------
// The v2 -> v3 migration
// ---------------------------------------------------------------------------

describe('the grade ceiling', () => {
  it('stops the rung at the ceiling and counts the blocked promotion', () => {
    // First grade tops adding out at rung 4. Acing a full window there must not
    // promote her into second-grade work.
    let state = { skillId: 'adding', rung: 4, recent: [], attempts: 0, correct: 0 } as SkillState;
    for (let i = 0; i < LADDER.window; i++) {
      state = recordSkillAnswer(state, true, 4).state;
    }
    expect(state.rung, 'must not climb past the grade ceiling').toBe(4);
    expect(state.ceilingHits, 'a blocked promotion is recorded for the parent').toBe(1);
    expect(state.recent, 'window is cleared so she is not stuck facing a demotion').toEqual([]);
  });

  it('still promotes below the ceiling', () => {
    let state = { skillId: 'adding', rung: 2, recent: [], attempts: 0, correct: 0 } as SkillState;
    for (let i = 0; i < LADDER.window; i++) {
      state = recordSkillAnswer(state, true, 4).state;
    }
    expect(state.rung).toBe(3);
    expect(state.ceilingHits ?? 0).toBe(0);
  });

  it('does not count topping out the real ladder as outgrowing the grade', () => {
    // At the very top of the ladder there is nowhere to be promoted to, which is
    // not the same thing as the grade holding her back.
    const top = SKILLS_BY_ID.get('comparing')!.rungs.length - 1;
    let state = { skillId: 'comparing', rung: top, recent: [], attempts: 0, correct: 0 } as SkillState;
    for (let i = 0; i < LADDER.window; i++) {
      state = recordSkillAnswer(state, true, top).state;
    }
    expect(state.ceilingHits ?? 0).toBe(0);
  });
});

describe('progress migration', () => {
  it('keeps a v2 save instead of wiping it', () => {
    const v2 = { ...buildInitialProgress(), version: 2, totalStars: 87, spendableStars: 40 } as UserProgress;
    delete (v2 as Partial<UserProgress>).skills;
    delete (v2 as Partial<UserProgress>).practiceQuestionsAnswered;

    const migrated = normalizeProgress(v2);
    expect(migrated).not.toBeNull();
    expect(migrated!.totalStars).toBe(87);
    expect(migrated!.spendableStars).toBe(40);
    expect(migrated!.version).toBe(6);
    expect(migrated!.skills).toEqual({});
    expect(migrated!.practiceQuestionsAnswered).toBe(0);
    expect(migrated!.errorPatterns, 'v6 is additive: she starts accumulating from here').toEqual({});
    expect(migrated!.gradeLevel, 'grade is unset until a parent picks one').toBeNull();
    // Records are sparse now: nothing is stored for levels she never attempted.
    expect(migrated!.categories).toEqual({});
  });

  // The riskiest part of the v4 change: two rungs were inserted at the BOTTOM of
  // the adding and taking-away ladders, so a saved rung number now means
  // something different. Without the shift a child on "adding within 20" would
  // quietly land back on "adding within 5".
  it('keeps her ladder position when v4 inserts rungs below her', () => {
    const v3 = { ...buildInitialProgress(), version: 3 } as UserProgress;
    v3.skills = {
      adding: { skillId: 'adding', rung: 2, recent: [true], attempts: 9, correct: 7 },
      'taking-away': { skillId: 'taking-away', rung: 1, recent: [], attempts: 4, correct: 3 },
      clocks: { skillId: 'clocks', rung: 1, recent: [], attempts: 2, correct: 2 },
    };

    const m = normalizeProgress(v3)!;
    // "Adding within 20" was rung 2, and is rung 4 now.
    expect(SKILLS_BY_ID.get('adding')!.rungs[m.skills.adding.rung].label).toBe('Adding within 20');
    expect(SKILLS_BY_ID.get('taking-away')!.rungs[m.skills['taking-away'].rung].label)
      .toBe('Subtracting within 10');
    // Ladders that did not change must not move.
    expect(m.skills.clocks.rung).toBe(1);
    // Everything else about the state survives.
    expect(m.skills.adding.attempts).toBe(9);
  });

  it('does not shift a save that is already v4', () => {
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.skills = { adding: { skillId: 'adding', rung: 3, recent: [], attempts: 0, correct: 0 } };
    expect(normalizeProgress(v4)!.skills.adding.rung).toBe(3);
  });

  // The headline bug this redesign exists to fix: level play and practice were
  // two separate worlds, so a child could three-star every level in a category
  // and still be handed rung 0 the moment she opened Practice.
  it('seeds the ladder from levels she has already passed', () => {
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.skills = {};
    v4.categories = {
      addition: {
        categoryId: 'addition',
        totalStarsEarned: 9,
        levels: {
          // "Adding to 20" is rung 4 of the adding ladder.
          'addition-3': { levelId: 'addition-3', bestScore: 1, starsEarned: 3, totalAttempts: 2, lastPlayed: 1 },
        },
      },
    } as UserProgress['categories'];

    const m = normalizeProgress(v4)!;
    expect(m.skills.adding, 'level play must seed the ladder').toBeDefined();
    expect(m.skills.adding.rung).toBeGreaterThanOrEqual(4);
    // A fresh window, so the ordinary 3-of-8 rule can walk back an over-seed.
    expect(m.skills.adding.recent).toEqual([]);
  });

  it('never demotes a ladder that is already above the seed', () => {
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.skills = { adding: { skillId: 'adding', rung: 6, recent: [true], attempts: 40, correct: 33 } };
    v4.categories = {
      addition: {
        categoryId: 'addition', totalStarsEarned: 3,
        levels: { 'addition-1': { levelId: 'addition-1', bestScore: 1, starsEarned: 3, totalAttempts: 1, lastPlayed: 1 } },
      },
    } as UserProgress['categories'];

    const m = normalizeProgress(v4)!;
    expect(m.skills.adding.rung).toBe(6);
    expect(m.skills.adding.attempts, 'history survives seeding').toBe(40);
  });

  it('does not seed from a level she attempted but failed', () => {
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.skills = {};
    v4.categories = {
      addition: {
        categoryId: 'addition', totalStarsEarned: 0,
        levels: { 'addition-3': { levelId: 'addition-3', bestScore: 0.4, starsEarned: 0, totalAttempts: 3, lastPlayed: 1 } },
      },
    } as UserProgress['categories'];
    expect(normalizeProgress(v4)!.skills.adding).toBeUndefined();
  });

  it('keeps "completed" alive when it converts status into a score', () => {
    // v4 stored status separately; a level marked completed with a stale
    // bestScore must still read as passed once status is gone.
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.categories = {
      counting: {
        categoryId: 'counting', totalStarsEarned: 1,
        levels: {
          'count-1': { levelId: 'count-1', status: 'completed', bestScore: 0, starsEarned: 1, totalAttempts: 1, lastPlayed: 1 },
        },
      },
    } as unknown as UserProgress['categories'];

    const m = normalizeProgress(v4)!;
    expect(passedLevel(m.categories.counting.levels['count-1'])).toBe(true);
    expect('status' in m.categories.counting.levels['count-1']).toBe(false);
  });

  it('drops the empty level rows that used to mean "locked"', () => {
    const v4 = { ...buildInitialProgress(), version: 4 } as UserProgress;
    v4.categories = {
      shapes: {
        categoryId: 'shapes', totalStarsEarned: 0,
        levels: {
          'shapes-1': { levelId: 'shapes-1', status: 'unlocked', bestScore: 0, starsEarned: 0, totalAttempts: 0, lastPlayed: 0 },
          'shapes-2': { levelId: 'shapes-2', status: 'locked', bestScore: 0, starsEarned: 0, totalAttempts: 0, lastPlayed: 0 },
        },
      },
    } as unknown as UserProgress['categories'];

    const m = normalizeProgress(v4)!;
    // Nothing derives availability from saved state any more, so an all-zero row
    // carries no information — and its absence can no longer mean "locked".
    expect(m.categories.shapes).toBeUndefined();
  });

  it('refuses a save whose shape would crash a render', () => {
    const bad = { ...buildInitialProgress(), version: 4, categories: [] } as unknown as UserProgress;
    expect(normalizeProgress(bad), 'categories as an array must be rejected').toBeNull();
    const bad2 = { ...buildInitialProgress(), version: 4, earnedBadges: {} } as unknown as UserProgress;
    expect(normalizeProgress(bad2)).toBeNull();
  });

  it('rejects a save from the future', () => {
    expect(normalizeProgress({ ...buildInitialProgress(), version: 99 })).toBeNull();
  });

  it('rejects junk', () => {
    expect(normalizeProgress(null as unknown as UserProgress)).toBeNull();
    expect(normalizeProgress({ nope: true } as unknown as UserProgress)).toBeNull();
  });
});

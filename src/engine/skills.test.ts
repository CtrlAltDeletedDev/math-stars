import { describe, it, expect } from 'vitest';
import { SKILLS, SKILLS_BY_ID, questionForRung, bankPoolFor, rankFor } from '@/data/skills';
import { recordSkillAnswer, newSkillState, LADDER, isMaxed } from './skillLadder';
import { PracticeQueue } from './practiceSession';
import { buildInitialProgress, normalizeProgress } from '@/store/storage';
import { UserProgress } from '@/types';

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

  it('covers a spread of skills rather than drilling one', () => {
    const q = new PracticeQueue(buildInitialProgress());
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const pick = q.next();
      if (pick?.skillId) seen.add(pick.skillId);
    }
    expect(seen.size).toBeGreaterThanOrEqual(Math.floor(SKILLS.length * 0.7));
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
    p.skills = { adding: { skillId: 'adding', rung: 4, recent: [], attempts: 0, correct: 0 } };
    const q = new PracticeQueue(p);
    let maxSeen = 0;
    for (let i = 0; i < 600; i++) {
      const pick = q.next();
      if (pick?.skillId !== 'adding') continue;
      for (const n of pick.question.prompt.match(/\d+/g) ?? []) maxSeen = Math.max(maxSeen, Number(n));
    }
    // Rung 5 of adding is "within 100"; rung 1 could never produce numbers this big.
    expect(maxSeen).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------
// The v2 -> v3 migration
// ---------------------------------------------------------------------------

describe('progress migration', () => {
  it('keeps a v2 save instead of wiping it', () => {
    const v2 = { ...buildInitialProgress(), version: 2, totalStars: 87, spendableStars: 40 } as UserProgress;
    delete (v2 as Partial<UserProgress>).skills;
    delete (v2 as Partial<UserProgress>).practiceQuestionsAnswered;

    const migrated = normalizeProgress(v2);
    expect(migrated).not.toBeNull();
    expect(migrated!.totalStars).toBe(87);
    expect(migrated!.spendableStars).toBe(40);
    expect(migrated!.version).toBe(3);
    expect(migrated!.skills).toEqual({});
    expect(migrated!.practiceQuestionsAnswered).toBe(0);
  });

  it('rejects a save from the future', () => {
    expect(normalizeProgress({ ...buildInitialProgress(), version: 99 })).toBeNull();
  });

  it('rejects junk', () => {
    expect(normalizeProgress(null as unknown as UserProgress)).toBeNull();
    expect(normalizeProgress({ nope: true } as unknown as UserProgress)).toBeNull();
  });
});

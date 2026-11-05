import { describe, it, expect } from 'vitest';
import { Learner, newLearner } from '@/core/learner';
import { FactRecord } from '@/core/facts';
import { daysAgoString, todayString } from '@/engine/dates';
import { Lesson, Unit } from '@/learn/types';
import { GradeCourse } from '@/learn/units';
import { COURSE } from '@/learn/course';
import {
  courseReport, lessonRow, lessonsPassedThisWeek, lessonsSentence, suggestNextGrade, unitInCourse,
  addCellId, addDays, backupFileName, factDetail, factText, lastDays, parseFact, subCellId,
  todayLine, trackReport, trickyFacts, weekStats, weekSummary, whenSaid, worksheet,
} from './report';

const TODAY = '2026-11-05'; // a Thursday
const ago = (n: number) => daysAgoString(n, new Date(`${TODAY}T12:00:00`));

const fact = (seen: number, right: number, extra: Partial<FactRecord> = {}): FactRecord => ({
  seen, right, box: right === seen ? 2 : 0, due: 0, recent: [], ...extra,
});

function learner(edit: (l: Learner) => void = () => {}): Learner {
  const l = newLearner();
  edit(l);
  return l;
}

describe('the week', () => {
  it('is the last seven local days, oldest first, across a month end', () => {
    expect(lastDays('2026-12-02')).toEqual([
      '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02',
    ]);
    expect(addDays('2026-12-30', 7)).toBe('2027-01-06');
  });

  it('counts local days, so an evening game stays on its own day', () => {
    // 8:30 pm local is the next day in UTC for anyone west of Greenwich.
    const evening = new Date(2026, 10, 5, 20, 30);
    expect(todayString(evening)).toBe('2026-11-05');
    const l = learner((x) => { x.days[todayString(evening)] = { answered: 10, right: 8, walks: 1 }; });
    const w = weekStats(l, todayString(evening));
    expect(w.days[6]).toMatchObject({ day: '2026-11-05', letter: 'T', answered: 10 });
  });

  it('adds up days played, sums and first-try accuracy over exactly seven days', () => {
    const l = learner((x) => {
      x.days[ago(0)] = { answered: 20, right: 17, walks: 2 };
      x.days[ago(2)] = { answered: 10, right: 8, walks: 1 };
      x.days[ago(6)] = { answered: 10, right: 9, walks: 1 };
      x.days[ago(7)] = { answered: 50, right: 0, walks: 5 }; // eight days ago: out
    });
    const w = weekStats(l, TODAY);
    expect(w.daysPlayed).toBe(3);
    expect(w.answered).toBe(40);
    expect(w.pctRight).toBe(85);
    expect(w.most).toBe(20);
    expect(todayLine(l, TODAY)).toBe('Today: 2 walks, 20 sums');
  });

  it('shows no percentage with nothing answered', () => {
    expect(weekStats(newLearner(), TODAY).pctRight).toBeNull();
    expect(todayLine(newLearner(), TODAY)).toBe('Today: not played yet');
  });

  it('says days the way people do', () => {
    expect(whenSaid(TODAY, TODAY)).toBe('today');
    expect(whenSaid(ago(1), TODAY)).toBe('yesterday');
    expect(whenSaid(ago(2), TODAY)).toBe('on Tuesday');
    expect(whenSaid(ago(10), TODAY)).toBe('on 26 Oct');
  });
});

describe('weekSummary', () => {
  it('names the move up, the day, the sums and the accuracy', () => {
    const l = learner((x) => {
      x.tracks.plus = { ...x.tracks.plus, stage: 5, passed: { 0: ago(30), 1: ago(30), 2: ago(20), 3: ago(12), 4: ago(2) } };
      x.days[ago(2)] = { answered: 100, right: 84, walks: 5 };
      x.days[ago(0)] = { answered: 12, right: 10, walks: 1 };
    });
    expect(weekSummary(l, TODAY)).toBe('Moved up to ten and some more on Tuesday. 112 sums, 84% right first try.');
  });

  it('counts several steps and both tracks', () => {
    const l = learner((x) => {
      x.tracks.plus = { ...x.tracks.plus, stage: 3, passed: { 0: ago(3), 1: ago(3), 2: ago(1) } };
      x.tracks.minus = { ...x.tracks.minus, stage: 1, passed: { 0: ago(0) } };
      x.days[ago(0)] = { answered: 10, right: 5, walks: 1 };
    });
    expect(weekSummary(l, TODAY)).toBe(
      'Moved up 3 steps to counting on 1, 2 or 3, the last yesterday, and to taking away 2 today. 10 sums, 50% right first try.',
    );
  });

  it('leaves out moves older than the week', () => {
    const l = learner((x) => {
      x.tracks.plus = { ...x.tracks.plus, stage: 1, passed: { 0: ago(7) } };
      x.days[ago(1)] = { answered: 1, right: 1, walks: 0 };
    });
    expect(weekSummary(l, TODAY)).toBe('1 sum, 100% right first try.');
  });

  it('is kind about an empty week', () => {
    expect(weekSummary(newLearner(), TODAY)).toBe('No sums yet in the last 7 days.');
  });
});

describe('where they are', () => {
  it('counts steps within their grade, recent accuracy and typical speed', () => {
    const l = learner((x) => {
      x.tracks.plus = { stage: 4, recent: [true, true, false, true, true, true, false, true, true, true], ceilingHits: 0, passed: {} };
      x.facts['add-6+3'] = fact(3, 3, { recent: [{ day: ago(1), ms: 3000 }, { day: ago(0), ms: 2000 }] });
      x.facts['add-5+4'] = fact(3, 3, { recent: [{ day: ago(1), ms: 4000 }, { day: ago(2), ms: 5000 }] });
      x.facts['add-2+2'] = fact(1, 1, { recent: [{ day: ago(30), ms: 100 }] }); // too old to count
      x.facts['sub-9-3'] = fact(1, 1, { recent: [{ day: ago(0), ms: 100 }] }); // other track
    });
    const r = trackReport(l, 'plus', TODAY);
    expect(r.label).toBe('Adding within 10');
    expect([r.step, r.of]).toEqual([5, 10]);
    expect([...r.passed].sort()).toEqual([0, 1, 2, 3]);
    expect([r.recentRight, r.recentCount]).toEqual([6, 8]);
    expect(r.typicalMs).toBeNull(); // four times is too few
    l.facts['add-4+4'] = fact(1, 1, { recent: [{ day: ago(0), ms: 2500 }] });
    expect(trackReport(l, 'plus', TODAY).typicalMs).toBe(3000);
    expect(r.next).toEqual({ label: 'Ten and some more', example: '10 + 4' });
  });

  it('says they may be ready for the next grade only at the top, twice', () => {
    const l = learner((x) => { x.tracks.minus = { stage: 9, recent: [], ceilingHits: 2, passed: {} }; });
    expect(trackReport(l, 'minus', TODAY).ready).toBe(true);
    l.tracks.minus.ceilingHits = 1;
    expect(trackReport(l, 'minus', TODAY).ready).toBe(false);
    l.tracks.minus.ceilingHits = 5;
    l.profile.grade = '2';
    expect(trackReport(l, 'minus', TODAY).ready).toBe(false); // nothing above 2nd
  });
});

describe('the fact grids', () => {
  it('maps addition cells to a + b', () => {
    expect(addCellId(6, 7)).toBe('add-6+7');
    expect(addCellId(0, 10)).toBe('add-0+10');
  });

  it('maps a subtraction cell (take away b, leaves c) to the sum b + c − b', () => {
    expect(subCellId(3, 6)).toBe('sub-9-3');
    expect(subCellId(0, 0)).toBe('sub-0-0');
    expect(subCellId(10, 10)).toBe('sub-20-10');
    for (let b = 0; b <= 10; b++) for (let c = 0; c <= 10; c++) {
      const p = parseFact(subCellId(b, c))!;
      expect(p.b).toBe(b);
      expect(p.answer).toBe(c);
    }
  });

  it('fills a 121-cell grid with distinct facts', () => {
    const ids = new Set<string>();
    for (let b = 0; b <= 10; b++) for (let c = 0; c <= 10; c++) ids.add(subCellId(b, c));
    expect(ids.size).toBe(121);
  });

  it('describes a cell for the popover, and hides an old wrong answer once they know it', () => {
    const facts = {
      'sub-9-3': fact(4, 2, { said: '12', tag: 'wrong-operation' as const, recent: [{ day: TODAY, ms: 4000 }, { day: TODAY, ms: 6000 }] }),
      'add-2+2': { ...fact(5, 4, { said: '5' }), box: 3 },
    };
    expect(factText('sub-9-3')).toBe('9 − 3');
    expect(factDetail(facts, 'sub-9-3')).toMatchObject({ text: '9 − 3', answer: 6, seen: 4, pctRight: 50, typicalMs: 5000, said: '12', state: 'learning' });
    expect(factDetail(facts, 'add-2+2').said).toBeNull();
    expect(factDetail(facts, 'add-5+5')).toMatchObject({ state: 'new', seen: 0, pctRight: null });
  });
});

describe('trickyFacts', () => {
  const l = learner((x) => {
    x.facts['sub-9-3'] = fact(5, 1, { said: '12', tag: 'wrong-operation' });
    x.facts['sub-7-3'] = fact(3, 1, { said: '5', tag: 'off-by-one' });
    x.facts['add-8+3'] = fact(4, 2, { said: '10', tag: 'off-by-one' });
    x.facts['add-14+5'] = fact(4, 2, { said: '29', tag: 'place-value' });
    x.facts['add-2+2'] = fact(10, 10); // knows it
    x.facts['add-6+6'] = { ...fact(10, 8), box: 0, said: '11', tag: 'off-by-one' }; // 80% but just missed
    x.facts['add-5+5'] = fact(10, 7); // 70%, box 0 → learning
    x.facts['add-1+1'] = { ...fact(10, 7), box: 2 }; // exactly 70% and settled: not tricky
  });

  it('keeps facts under 70% or still learning, most-missed first, then lowest hit rate', () => {
    const ids = trickyFacts(l, 10).map((t) => t.id);
    expect(ids).toEqual(['sub-9-3', 'add-5+5', 'sub-7-3', 'add-14+5', 'add-8+3', 'add-6+6']);
    expect(ids).not.toContain('add-2+2');
    expect(ids).not.toContain('add-1+1');
  });

  it('stops at n', () => {
    expect(trickyFacts(l, 3)).toHaveLength(3);
    expect(trickyFacts(newLearner(), 6)).toEqual([]);
  });

  it('says what they said and an idea from the kind of mistake', () => {
    const [first, , third, fourth, fifth] = trickyFacts(l, 6);
    expect(first).toMatchObject({ text: '9 − 3', said: '12', idea: 'Point at the sign together first' });
    expect(third.idea).toBe('Count back from 7 on fingers: 6, 5, 4');
    expect(fourth.idea).toBe('Build it with tens and ones');
    expect(fifth.idea).toBe('Count on from 8 on fingers: 9, 10, 11');
  });
});

describe('the worksheet', () => {
  it('has 20 different sums, their tricky ones among them, each with the right answer', () => {
    const l = learner((x) => {
      x.tracks.plus.stage = 4;
      x.tracks.minus.stage = 3;
      x.facts['sub-9-3'] = fact(5, 1, { said: '12' });
      x.facts['add-8+3'] = fact(4, 2);
    });
    const sheet = worksheet(l, TODAY);
    expect(sheet).toHaveLength(20);
    expect(new Set(sheet.map((s) => s.id)).size).toBe(20);
    expect(sheet.filter((s) => s.tricky).map((s) => s.id).sort()).toEqual(['add-8+3', 'sub-9-3']);
    expect(sheet.some((s) => s.op === '+' && !s.tricky)).toBe(true);
    expect(sheet.some((s) => s.op === '-' && !s.tricky)).toBe(true);
    for (const s of sheet) expect(s.answer).toBe(s.op === '+' ? s.a + s.b : s.a - s.b);
  });

  it('names the backup by local date', () => {
    expect(backupFileName(TODAY)).toBe('math-stars-backup-2026-11-05.json');
  });
});

// A course of our own, so these hold while the real units are still being written.
const lesson = (id: string, title: string, over: Partial<Lesson> = {}): Lesson => ({
  id, title, goal: `Can ${title.toLowerCase()}.`, emoji: '🧪', teach: [],
  practice: () => ({ id: 'add-2+3', say: 's', prompt: '2 + 3 = ?', answer: '5', input: 'number' }),
  ...over,
});
const unit = (id: string, lessons: Lesson[]): Unit => ({ id, title: id, emoji: '🧪', about: `All about ${id}.`, colour: '#123456', lessons });
const FIXTURE: GradeCourse[] = [
  {
    grade: '1', title: '1st grade', units: [
      unit('u-add', [
        lesson('fx-plus-one', 'Adding one', { placedBy: { track: 'plus', stage: 0 } }),
        lesson('fx-both', 'Both ways', { placedBy: [{ track: 'plus', stage: 1 }, { track: 'minus', stage: 1 }] }),
        lesson('fx-make-ten', 'Make a ten'),
        lesson('fx-count-back', 'Counting back'),
      ]),
      unit('u-empty', []),
      unit('u-clock', [lesson('fx-clock', 'Telling time')]),
    ],
  },
  { grade: '2', title: '2nd grade', units: [unit('u-later', [])] },
];
const rec = (done: string | null, best = 1, tries = 1) => ({ tries, best, done, last: done ?? TODAY });

describe('their course', () => {
  it('marks each lesson passed, already known from their path, started or not yet', () => {
    const l = learner((x) => {
      x.tracks.plus.stage = 3;
      x.lessons['fx-make-ten'] = rec(ago(2), 0.75, 2);
      x.lessons['fx-count-back'] = rec(null, 0.5, 1);
    });
    const [plusOne, both, makeTen, countBack] = FIXTURE[0].units[0].lessons.map((x) => lessonRow(l, x));
    expect(plusOne.status).toEqual({ kind: 'placed', how: 'path' });
    expect(both.status).toEqual({ kind: 'new' }); // past plus 1, not past minus 1
    expect(makeTen).toMatchObject({ status: { kind: 'passed', on: ago(2) }, best: 75, tries: 2 });
    expect(countBack).toMatchObject({ status: { kind: 'started' }, best: 50, tries: 1 });
    l.tracks.minus.stage = 2;
    expect(lessonRow(l, both.lesson).status).toEqual({ kind: 'placed', how: 'path' });
  });

  it('tells a lesson found known by "Find their level" from one passed by its check', () => {
    const l = learner((x) => { x.lessons['fx-make-ten'] = { ...rec(ago(1), 1, 0), placed: true }; });
    const makeTen = FIXTURE[0].units[0].lessons.map((x) => lessonRow(l, x))[2];
    expect(makeTen.status).toEqual({ kind: 'placed', how: 'placement', on: ago(1) });
  });

  it('calls a passed lesson passed even when their path would also cover it', () => {
    const l = learner((x) => { x.tracks.plus.stage = 5; x.lessons['fx-plus-one'] = rec(ago(1)); });
    expect(lessonRow(l, FIXTURE[0].units[0].lessons[0]).status).toEqual({ kind: 'passed', on: ago(1) });
  });

  it('shows no best score before their first check', () => {
    const l = learner((x) => { x.lessons['fx-clock'] = { tries: 0, best: 0, done: null, last: TODAY }; });
    expect(lessonRow(l, FIXTURE[0].units[2].lessons[0])).toMatchObject({ status: { kind: 'started' }, best: null, tries: 0 });
  });

  it('counts done per unit and grade, leaves out units with no lessons, and knows their grade', () => {
    const l = learner((x) => { x.tracks.plus.stage = 1; x.lessons['fx-make-ten'] = rec(ago(0)); });
    const [first, second] = courseReport(l, FIXTURE);
    expect(first.units.map((u) => [u.unit.id, u.done, u.total])).toEqual([['u-add', 2, 4], ['u-clock', 0, 1]]);
    expect([first.done, first.total, first.place]).toEqual([2, 5, 'current']);
    expect([second.units.length, second.total, second.place]).toEqual([0, 0, 'ahead']);
    l.profile.grade = '2';
    expect(courseReport(l, FIXTURE).map((g) => g.place)).toEqual(['earlier', 'current']);
  });

  it('suggests the next grade once four in five of their grade are done', () => {
    const l = learner((x) => {
      x.tracks.plus.stage = 2;
      x.tracks.minus.stage = 2;
      x.lessons['fx-make-ten'] = rec(ago(3));
    });
    expect(suggestNextGrade(l, FIXTURE)).toBeNull(); // 3 of 5
    l.lessons['fx-count-back'] = rec(ago(1));
    expect(suggestNextGrade(l, FIXTURE)).toBe('2'); // 4 of 5
    l.profile.grade = '2';
    expect(suggestNextGrade(l, FIXTURE)).toBeNull(); // nothing above 2nd, and no 2nd grade lessons yet
  });

  it('finds the unit and grade of a lesson', () => {
    expect(unitInCourse('fx-clock', FIXTURE)?.unit.id).toBe('u-clock');
    expect(unitInCourse('fx-clock', FIXTURE)?.grade.grade).toBe('1');
    expect(unitInCourse('nope', FIXTURE)).toBeNull();
  });

  it('lists lessons passed in the last seven local days, oldest first', () => {
    const l = learner((x) => {
      x.lessons['fx-count-back'] = rec(ago(0));
      x.lessons['fx-make-ten'] = rec(ago(3));
      x.lessons['fx-clock'] = rec(ago(7)); // eight days counting today: out
      x.lessons['fx-plus-one'] = rec(null, 0.5);
      x.lessons['gone-from-course'] = rec(ago(1));
    });
    expect(lessonsPassedThisWeek(l, TODAY, FIXTURE).map((x) => x.id)).toEqual(['fx-make-ten', 'fx-count-back']);
    expect(lessonsSentence(l, TODAY, FIXTURE)).toBe('Passed 2 lessons this week: Make a ten, Counting back.');
    expect(lessonsSentence(newLearner(), TODAY, FIXTURE)).toBeNull();
    const commas: GradeCourse[] = [{ grade: '1', title: '1st grade', units: [unit('u', [lesson('a', 'More, fewer, the same'), lesson('b', 'Teen numbers')])] }];
    const both = learner((x) => { x.lessons.a = rec(ago(1)); x.lessons.b = rec(ago(1)); });
    expect(lessonsSentence(both, TODAY, commas)).toBe('Passed 2 lessons this week: More, fewer, the same; Teen numbers.');
  });

  it('puts the lessons first in the week summary, in course order, and names only three', () => {
    const l = learner((x) => {
      for (const id of ['fx-plus-one', 'fx-both', 'fx-make-ten', 'fx-count-back', 'fx-clock']) x.lessons[id] = rec(ago(1));
      x.days[ago(1)] = { answered: 20, right: 15, walks: 2 };
    });
    expect(weekSummary(l, TODAY, FIXTURE)).toBe(
      'Passed 5 lessons this week: Adding one, Both ways, Make a ten and 2 more. 20 sums, 75% right first try.',
    );
  });

  it('reads the real course without trouble while its units are being written', () => {
    const report = courseReport(newLearner(), COURSE);
    expect(report.length).toBe(COURSE.length);
    for (const g of report) for (const u of g.units) expect(u.total).toBeGreaterThan(0);
  });
});

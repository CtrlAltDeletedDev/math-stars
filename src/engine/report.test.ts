import { describe, it, expect } from 'vitest';
import { UserProgress } from '@/types';
import { buildInitialProgress } from '@/store/storage';
import {
  mistakesForSkill, topMistakes, hardestFacts, workingOn, daysPlayedIn, PATTERN_MIN_COUNT,
} from './report';

const save = (over: Partial<UserProgress> = {}): UserProgress =>
  ({ ...buildInitialProgress(), ...over }) as UserProgress;

const card = (questionId: string, easeFactor: number, lastSeen = 0) =>
  ({ questionId, easeFactor, intervalDays: 1, nextDueDate: 0, repetitions: 0, lastSeen });

describe('what she keeps getting wrong', () => {
  it('names the commonest pattern first', () => {
    const p = save({ errorPatterns: { 'taking-away': { 'off-by-one': 4, 'wrong-operation': 11 } } });
    const [first, second] = mistakesForSkill(p, 'taking-away');
    expect(first.tag).toBe('wrong-operation');
    expect(first.count).toBe(11);
    expect(second.tag).toBe('off-by-one');
  });

  it('stays quiet about one or two slips', () => {
    // A child having a bad morning is not a pattern, and a parent who is told
    // it is one stops believing the screen.
    const p = save({ errorPatterns: { adding: { 'off-by-one': PATTERN_MIN_COUNT - 1 } } });
    expect(mistakesForSkill(p, 'adding')).toEqual([]);
  });

  it('never reports "unknown" as something to work on', () => {
    // A near miss with no story behind it. Ranking it would be inventing one.
    const p = save({ errorPatterns: { adding: { unknown: 40, 'place-value': 3 } } });
    const found = mistakesForSkill(p, 'adding');
    expect(found.map((f) => f.tag)).toEqual(['place-value']);
  });

  it('measures share against the mistakes that meant something', () => {
    const p = save({ errorPatterns: { adding: { 'wrong-operation': 6, 'off-by-one': 6, unknown: 100 } } });
    expect(mistakesForSkill(p, 'adding')[0].share).toBeCloseTo(0.5);
  });

  it('gives a parent something to do, not just a diagnosis', () => {
    const p = save({ errorPatterns: { adding: { 'wrong-operation': 8 } } });
    const [pattern] = mistakesForSkill(p, 'adding');
    expect(pattern.label.length).toBeGreaterThan(10);
    expect(pattern.suggestion.length).toBeGreaterThan(10);
  });

  it('ranks across skills by how often it happens, not by share', () => {
    // 20 of 40 beats 3 of 3: a pattern seen twenty times matters more than one
    // that is 100% of almost nothing.
    const p = save({
      errorPatterns: {
        adding: { 'off-by-one': 20, unknown: 20 },
        clocks: { 'wrong-multiple': 3 },
      },
    });
    const top = topMistakes(p);
    expect(top[0].skillId).toBe('adding');
    expect(top[0].skillTitle).toBeTruthy();
  });

  it('says nothing at all on a fresh profile', () => {
    expect(topMistakes(buildInitialProgress())).toEqual([]);
    expect(mistakesForSkill(buildInitialProgress(), 'adding')).toEqual([]);
  });
});

describe('the facts she keeps missing', () => {
  it('turns a card id back into a real question', () => {
    const p = save({ srsCards: { 'add-8+7': card('add-8+7', 1.9) } });
    const [fact] = hardestFacts(p);
    expect(fact.prompt).toContain('8');
    expect(fact.answer).toBe('15');
  });

  it('puts the shakiest first', () => {
    const p = save({
      srsCards: {
        'add-2+2': card('add-2+2', 2.3),
        'add-8+7': card('add-8+7', 1.4),
        'add-9+6': card('add-9+6', 1.8),
      },
    });
    expect(hardestFacts(p).map((f) => f.questionId)).toEqual(['add-8+7', 'add-9+6', 'add-2+2']);
  });

  it('leaves out facts she has never got wrong', () => {
    // Ease only falls on a miss, so a card at or above the starting value has
    // never been missed — it is unseen, not shaky.
    const p = save({ srsCards: { 'add-1+1': card('add-1+1', 2.5), 'add-9+9': card('add-9+9', 2.8) } });
    expect(hardestFacts(p)).toEqual([]);
  });

  it('leaves out a card it cannot turn back into a question', () => {
    const p = save({ srsCards: { 'who-knows-what': card('who-knows-what', 1.3) } });
    expect(hardestFacts(p)).toEqual([]);
  });

  it('respects the limit it is given', () => {
    const srsCards: UserProgress['srsCards'] = {};
    for (let i = 1; i <= 12; i++) srsCards[`add-${i}+${i}`] = card(`add-${i}+${i}`, 1.5 + i * 0.01);
    expect(hardestFacts(save({ srsCards }), 3)).toHaveLength(3);
  });
});

describe('the one topic to name at the top', () => {
  it('picks her weakest skill, by lifetime accuracy', () => {
    const p = save({
      skills: {
        adding: { skillId: 'adding', rung: 2, recent: [], attempts: 100, correct: 90 },
        'taking-away': { skillId: 'taking-away', rung: 1, recent: [], attempts: 100, correct: 55 },
      },
    });
    expect(workingOn(p)!.skillId).toBe('taking-away');
  });

  it('ignores the sliding window, which is cleared on every move', () => {
    // `recent` reads 0% of 1 immediately after any promotion or demotion, so a
    // screen built on it tells a parent something alarming and meaningless.
    const p = save({
      skills: {
        adding: { skillId: 'adding', rung: 3, recent: [false], attempts: 200, correct: 190 },
        clocks: { skillId: 'clocks', rung: 0, recent: [true, true], attempts: 40, correct: 20 },
      },
    });
    expect(workingOn(p)!.skillId).toBe('clocks');
  });

  it('waits for enough evidence before naming anything', () => {
    const p = save({
      skills: { adding: { skillId: 'adding', rung: 0, recent: [], attempts: 3, correct: 0 } },
    });
    expect(workingOn(p)).toBeNull();
  });

  it('reports the rung in the words a parent can read', () => {
    const p = save({
      skills: { adding: { skillId: 'adding', rung: 2, recent: [], attempts: 50, correct: 30 } },
    });
    const w = workingOn(p)!;
    expect(w.rungLabel).toBe('Adding within 5');
    expect(w.accuracy).toBeCloseTo(0.6);
  });

  it('says nothing on a fresh profile', () => {
    expect(workingOn(buildInitialProgress())).toBeNull();
  });
});

describe('days played', () => {
  it('counts only days inside the window', () => {
    const from = new Date(2026, 8, 13);
    const p = save({ playHistory: ['2026-09-13', '2026-09-11', '2026-09-08', '2026-08-01'] });
    expect(daysPlayedIn(p, 7, from)).toBe(3);
    expect(daysPlayedIn(p, 1, from)).toBe(1);
  });

  it('handles a profile that has never been played', () => {
    expect(daysPlayedIn(buildInitialProgress(), 7)).toBe(0);
  });
});

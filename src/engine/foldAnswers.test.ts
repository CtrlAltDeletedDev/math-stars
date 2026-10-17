import { describe, it, expect } from 'vitest';
import { Question, SkillState, UserProgress } from '@/types';
import { CATEGORIES, ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { SKILLS, questionForRung } from '@/data/skills';
import { RUNG_FOR_LEVEL, SKILL_FOR_LEVEL, skillForQuestion } from '@/data/topics';
import { buildInitialProgress } from '@/store/storage';
import { generateFromParams, questionFromId } from './questionGenerator';
import { LADDER } from './skillLadder';
import { createNewSRSCard } from './srs';
import { PracticeQueue } from './practiceSession';
import { buildMasterSession } from './sessionBuilder';
import { SessionAnswer, foldLevelAnswers, foldMixedAnswers } from './foldAnswers';

// Which ladder hears an answer. Getting this wrong is silent: the answer is
// still counted somewhere, so nothing crashes and no total looks odd — the
// topic it belonged to just never moves. That is how every Number Tricks
// level went unheard: doubles and counting on are written as addition, and
// making ten as a missing number, so they were all credited to Adding and
// Mystery Number and never once to Number Tricks.

/** The levels that ask two operations on purpose, and the ladders they feed. */
const MIXED_LEVELS: Record<string, string[]> = {
  'steps-mix-1': ['adding', 'taking-away'],
  'steps-mix-2': ['adding', 'taking-away'],
  'mixed-1': ['adding', 'taking-away'],
};

function questionsOf(levelId: string): Question[] {
  const level = CATEGORIES.flatMap((c) => c.levels).find((l) => l.id === levelId)!;
  if (level.questionBankIds) return level.questionBankIds.map((id) => ALL_QUESTIONS_BY_ID.get(id)!);
  return Array.from({ length: 200 }, () => generateFromParams(level.generatorParams!));
}

function standingOn(rungs: Record<string, number>): Record<string, SkillState> {
  return Object.fromEntries(Object.entries(rungs).map(([skillId, rung]) =>
    [skillId, { skillId, rung, recent: [], attempts: 0, correct: 0, ceilingHits: 0 }]));
}

const right = (question: Question): SessionAnswer => ({ question, correct: true, chosen: question.correctAnswer });

describe('which ladder an answer is credited to', () => {
  it('credits every level to its own topic, unless it mixes two on purpose', () => {
    const bad: string[] = [];
    for (const levelId of CATEGORIES.flatMap((c) => c.levels.map((l) => l.id))) {
      const credited = new Set(questionsOf(levelId).map((q) => skillForQuestion(q, levelId)));
      const expected = MIXED_LEVELS[levelId] ?? [SKILL_FOR_LEVEL.get(levelId)];
      const got = [...credited].sort();
      if (JSON.stringify(got) !== JSON.stringify([...expected].sort())) {
        bad.push(`${levelId}: credits ${got.join(', ')}, should be ${expected.join(', ')}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('sends every rung\'s questions back to the ladder that served them', () => {
    // A review, the daily challenge and Master Mode know only the question, not
    // the rung it came from, so the question itself has to say.
    const bad: string[] = [];
    for (const skill of SKILLS) {
      skill.rungs.forEach((_, rung) => {
        for (let i = 0; i < 60; i++) {
          const q = questionForRung(skill, rung)!;
          const to = skillForQuestion(q, '');
          if (to !== skill.id) { bad.push(`${skill.id}#${rung} (${q.id}) -> ${to}`); break; }
        }
      });
    }
    expect(bad).toEqual([]);
  });

  it('keeps a Number Tricks question on its ladder when it is rebuilt from a saved id', () => {
    for (const id of ['dbl-6', 'mk10-3', 'mk20-14', 'cnt-8+3']) {
      expect(skillForQuestion(questionFromId(id)!, ''), id).toBe('strategies');
    }
  });

  it('leaves Number Tricks questions looking like the sums they are', () => {
    // The dot and hop aids key off `type`, so routing must not change it.
    expect(questionFromId('dbl-6')!.type).toBe('addition');
    expect(questionFromId('cnt-8+3')!.type).toBe('addition');
    expect(questionFromId('mk10-3')!.type).toBe('missing_number');
  });
});

describe('level play', () => {
  it('moves Number Tricks when she plays a Number Tricks level at her rung', () => {
    for (const levelId of ['strategy-doubles', 'strategy-make-ten', 'strategy-count-on']) {
      const rung = RUNG_FOR_LEVEL.get(levelId)!;
      const answers = questionsOf(levelId).slice(0, LADDER.window).map(right);
      const { skills, levelUps } = foldLevelAnswers(
        standingOn({ strategies: rung, adding: 4, 'mystery-number': 1 }), {}, answers, levelId, '1',
      );
      expect(skills.strategies.rung, levelId).toBe(rung + 1);
      expect(levelUps, levelId).toEqual([{ skillId: 'strategies', rung: rung + 1 }]);
      expect(skills.adding.attempts, `${levelId} must not be credited to Adding`).toBe(0);
      expect(skills['mystery-number'].attempts, `${levelId} must not be credited to Mystery Number`).toBe(0);
    }
  });

  it('files a Number Tricks mistake under Number Tricks', () => {
    const q = questionFromId('dbl-6')!;
    const [chosen, tag] = Object.entries(q.distractorMeaning ?? {})[0];
    const { errorPatterns } = foldLevelAnswers(
      standingOn({ strategies: 1 }), {}, [{ question: q, correct: false, chosen }], 'strategy-doubles', '1',
    );
    expect(errorPatterns).toEqual({ strategies: { [tag]: 1 } });
  });

  it('still splits a mixed level between its two ladders, and only moves the level\'s own', () => {
    const answers = questionsOf('steps-mix-1').slice(0, 30).map(right);
    const { skills } = foldLevelAnswers(
      standingOn({ adding: 1, 'taking-away': 1 }), {}, answers, 'steps-mix-1', '1',
    );
    expect(skills.adding.attempts + skills['taking-away'].attempts).toBe(30);
    expect(skills['taking-away'].attempts).toBeGreaterThan(0);
    expect(skills['taking-away'].rung, 'a second ladder is counted, never moved').toBe(1);
    expect(skills['taking-away'].recent).toEqual([]);
  });
});

describe('modes that only know the question', () => {
  const due = (id: string) => ({ ...createNewSRSCard(id), nextDueDate: Date.now() - 1000 });

  it('credits a Number Tricks answer in a mixed session to Number Tricks', () => {
    const { skills } = foldMixedAnswers({}, {}, [right(questionFromId('dbl-7')!)], 'daily', '1');
    expect(Object.keys(skills)).toEqual(['strategies']);
    expect(skills.strategies.attempts).toBe(1);
  });

  it('files a Number Tricks mistake from a mixed session under Number Tricks', () => {
    const q = questionFromId('dbl-6')!;
    const [chosen, tag] = Object.entries(q.distractorMeaning ?? {})[0];
    for (const source of ['daily', 'review', 'adding']) {
      const { errorPatterns } = foldMixedAnswers({}, {}, [{ question: q, correct: false, chosen }], source, '1');
      expect(errorPatterns, source).toEqual({ strategies: { [tag]: 1 } });
    }
  });

  it('never moves a ladder from a mixed session, even on a full window of right answers', () => {
    // These sessions draw across rungs, so no answer in one says where she stands.
    const answers = Array.from({ length: LADDER.window * 2 }, () => right(questionFromId('dbl-3')!));
    const { skills } = foldMixedAnswers(standingOn({ strategies: 0 }), {}, answers, 'strategies', '1');
    expect(skills.strategies.attempts).toBe(LADDER.window * 2);
    expect(skills.strategies.rung).toBe(0);
    expect(skills.strategies.recent).toEqual([]);
  });

  it('routes a Number Tricks review in Practice to Number Tricks', () => {
    const p: UserProgress = { ...buildInitialProgress(), gradeLevel: '1', practiceFocus: ['clocks'], srsCards: { 'dbl-6': due('dbl-6') } };
    const q = new PracticeQueue(p);
    let review = null;
    for (let i = 1; i <= 5; i++) review = q.next(); // every fifth slot is a review
    expect(review!.question.id).toBe('dbl-6');
    expect(review!.skillId).toBe('strategies');
  });

  it('puts Number Tricks reviews in Number Tricks\' Master Mode, not Adding\'s', () => {
    const p: UserProgress = {
      ...buildInitialProgress(), gradeLevel: '1',
      skills: standingOn({ strategies: 2, adding: 2 }),
      srsCards: { 'dbl-6': due('dbl-6'), 'mk10-3': due('mk10-3') },
    };
    expect(buildMasterSession(p, 'strategies').map((q) => q.id)).toEqual(expect.arrayContaining(['dbl-6', 'mk10-3']));
    expect(buildMasterSession(p, 'adding').map((q) => q.id)).not.toContain('dbl-6');
    expect(buildMasterSession(p, 'mystery-number').map((q) => q.id)).not.toContain('mk10-3');
  });
});

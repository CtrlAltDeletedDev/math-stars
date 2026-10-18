import { describe, it, expect } from 'vitest';
import { UserProgress } from '@/types';
import { buildInitialProgress } from '@/store/storage';
import { forgetLessonVisit, leaveForLesson, lessonToOffer, REPEATS_TO_OFFER, returnFromLesson } from './lessonOffer';
import { daysAgoString, todayString } from './dates';

// When Play stops to offer a lesson. A demotion used to happen in silence, and
// the lesson for the mistake she kept making sat two taps away on a screen a
// child mid-round never opens.

const grade1 = (lessonsDone: Record<string, string> = {}): UserProgress => ({
  ...buildInitialProgress(), gradeLevel: '1', lessonsDone,
});
const none = new Set<string>();

describe('offering a lesson in Play', () => {
  it('offers one when a topic moves her down', () => {
    const lesson = lessonToOffer(grade1(), { skillId: 'stories', move: 'demoted', rung: 4, tagCountThisRound: 0 }, none);
    expect(lesson?.id).toBe('some-and-the-rest');
  });

  it('picks the lesson for the mistake she kept making, if there is one', () => {
    const lesson = lessonToOffer(grade1(), {
      skillId: 'taking-away', move: 'demoted', rung: 3, tagCountThisRound: 0, topTagThisRound: 'off-by-one',
    }, none);
    expect(lesson?.id).toBe('hop-back');
  });

  it('offers the lesson for a mistake made twice in a round, but not once', () => {
    const once = { skillId: 'strategies', move: null, rung: 2, tag: 'answered-the-whole' as const, tagCountThisRound: 1 };
    expect(lessonToOffer(grade1(), once, none)).toBeNull();
    const twice = { ...once, tagCountThisRound: REPEATS_TO_OFFER };
    expect(lessonToOffer(grade1(), twice, none)?.id).toBe('make-ten');
  });

  it('ignores a mistake that means nothing, however often', () => {
    expect(lessonToOffer(grade1(), { skillId: 'adding', move: null, rung: 4, tag: 'unknown', tagCountThisRound: 5 }, none)).toBeNull();
    expect(lessonToOffer(grade1(), { skillId: 'adding', move: null, rung: 4, tagCountThisRound: 5 }, none)).toBeNull();
  });

  it('does not interrupt a repeated mistake with a lesson about something else', () => {
    // Shapes has no lesson for miscounting, so there is nothing worth stopping for.
    expect(lessonToOffer(grade1(), { skillId: 'shapes', move: null, rung: 1, tag: 'off-by-one', tagCountThisRound: 3 }, none)).toBeNull();
  });

  it('asks only once per topic in a sitting', () => {
    const struggle = { skillId: 'stories', move: 'demoted' as const, rung: 4, tagCountThisRound: 0 };
    expect(lessonToOffer(grade1(), struggle, new Set(['stories']))).toBeNull();
    expect(lessonToOffer(grade1(), struggle, new Set(['adding']))).not.toBeNull();
  });

  it('never offers a lesson above her grade', () => {
    // Kindergarten's taking-away tops out at rung 3; "hop back" teaches rung 4.
    const k = { ...grade1(), gradeLevel: 'K' as const };
    const lesson = lessonToOffer(k, { skillId: 'taking-away', move: 'demoted', rung: 3, tagCountThisRound: 0, topTagThisRound: 'off-by-one' }, none);
    expect(lesson?.id).not.toBe('hop-back');
  });

  it('does not stop her for a promotion', () => {
    expect(lessonToOffer(grade1(), { skillId: 'stories', move: 'promoted', rung: 5, tagCountThisRound: 0 }, none)).toBeNull();
  });

  it('does not offer a lesson she has already watched today', () => {
    const struggle = { skillId: 'taking-away', move: 'demoted' as const, rung: 3, tagCountThisRound: 0, topTagThisRound: 'off-by-one' as const };
    expect(lessonToOffer(grade1({ 'hop-back': todayString() }), struggle, none)?.id).not.toBe('hop-back');
    expect(lessonToOffer(grade1({ 'hop-back': daysAgoString(3) }), struggle, none)?.id).toBe('hop-back');
    const repeat = { skillId: 'strategies', move: null, rung: 2, tag: 'answered-the-whole' as const, tagCountThisRound: 2 };
    expect(lessonToOffer(grade1({ 'make-ten': todayString() }), repeat, none)).toBeNull();
  });
});

describe('coming back from an offered lesson', () => {
  it('remembers what was offered and which topic to lead with', () => {
    forgetLessonVisit();
    expect(returnFromLesson()).toEqual({ offered: new Set(), lead: null });
    leaveForLesson(new Set(['adding']), 'stories');
    const back = returnFromLesson();
    expect([...back.offered].sort()).toEqual(['adding', 'stories']);
    expect(back.lead).toBe('stories');
    expect(returnFromLesson(), 'reading twice gives the same answer').toEqual(back);
    forgetLessonVisit();
    expect(returnFromLesson().lead).toBeNull();
  });
});

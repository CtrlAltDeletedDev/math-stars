import { describe, it, expect } from 'vitest';
import { aidModeFor, AID_SETTLE } from './scaffold';
import { buildInitialProgress } from '@/store/storage';
import { newSkillState } from './skillLadder';
import { UserProgress } from '@/types';

// The counting picture steps back once she is steady at a rung, and only then.

const at = (rung: number, recent: boolean[]): UserProgress => ({
  ...buildInitialProgress(),
  gradeLevel: '1',
  skills: { adding: { ...newSkillState('adding'), rung, recent, demotions: 1 } },
});

describe('the fading picture', () => {
  it('is drawn on a rung she is new to', () => {
    expect(aidModeFor(at(3, []), 'adding', 3)).toBe('show');
    expect(aidModeFor(at(3, Array(AID_SETTLE - 1).fill(true)), 'adding', 3)).toBe('show');
  });

  it('waits behind a tap once her answers there are mostly right', () => {
    expect(aidModeFor(at(3, [true, true, true, true]), 'adding', 3)).toBe('tap');
    expect(aidModeFor(at(3, [true, false, true, true]), 'adding', 3)).toBe('tap');
  });

  it('comes back when she starts getting it wrong', () => {
    expect(aidModeFor(at(3, [true, true, true, true, false, false]), 'adding', 3)).toBe('show');
  });

  it('is drawn for a review, or a question from above her rung', () => {
    const steady = at(3, Array(8).fill(true));
    expect(aidModeFor(steady, null, null)).toBe('show');
    expect(aidModeFor(steady, 'adding', null)).toBe('show');
    expect(aidModeFor(steady, 'adding', 4)).toBe('show');
  });

  it('waits behind a tap for a warm-up from a step she has passed', () => {
    // Even while she is still new to the rung she stands on.
    expect(aidModeFor(at(3, []), 'adding', 2)).toBe('tap');
    expect(aidModeFor(at(3, [false, false, false, false]), 'adding', 0)).toBe('tap');
  });

  it('reads the rung she is served at, when her grade clamps her', () => {
    // Saved rung 12, but first grade serves rung 9.
    expect(aidModeFor(at(12, Array(8).fill(true)), 'adding', 9)).toBe('tap');
  });

  it('is drawn for a topic she has never played', () => {
    expect(aidModeFor(buildInitialProgress(), 'adding', 0)).toBe('show');
  });
});

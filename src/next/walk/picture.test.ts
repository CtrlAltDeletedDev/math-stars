import { describe, it, expect } from 'vitest';
import { pictureMode } from './picture';
import { newLearner, Learner } from '@/core/learner';
import { newTrack } from '@/core/track';
import { WalkItem } from '@/core/walk';
import { STAGES } from '@/core/stages';

const at = (stage: number, recent: boolean[], pictures: Learner['profile']['pictures'] = 'auto'): Learner => {
  const l = newLearner();
  l.profile.pictures = pictures;
  l.tracks.plus = { ...newTrack(), stage, recent, demotions: 1 };
  return l;
};
const item = (stage: number | null, kind: WalkItem['kind'] = 'fresh'): WalkItem =>
  ({ question: STAGES.plus[stage ?? 0].make(), track: 'plus', stage, kind });

describe('the picture', () => {
  it('is drawn on a stone she is new to, or getting wrong', () => {
    expect(pictureMode(at(4, []), item(4))).toBe('show');
    expect(pictureMode(at(4, [true, false, false, true]), item(4))).toBe('show');
  });
  it('waits behind Show me once she is steady there', () => {
    expect(pictureMode(at(4, [true, true, true, false]), item(4))).toBe('tap');
  });
  it('waits behind Show me for a look back, and is drawn for new ground', () => {
    expect(pictureMode(at(4, []), item(2, 'warmup'))).toBe('tap');
    expect(pictureMode(at(4, []), item(null, 'review'))).toBe('tap');
    expect(pictureMode(at(4, []), item(6, 'focus'))).toBe('show');
  });
  it('does what a grown-up set', () => {
    expect(pictureMode(at(4, Array(8).fill(true), 'always'), item(4))).toBe('show');
    expect(pictureMode(at(4, [], 'off'), item(4))).toBe('none');
  });
});

import { describe, expect, it } from 'vitest';
import { Learner, newLearner } from '@/core/learner';
import { friendFor } from '../ui/friends';
import { AHEAD_SHOWN, pathView } from './path';
import { PATH_W, layoutPath, pebblePillWidth, pebbleSide } from './layout';

const DAY = '2026-11-01';
const passed = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, DAY]));

function learner(plus: number, minus: number, opts: { grade?: Learner['profile']['grade']; recentPlus?: boolean[]; recentMinus?: boolean[] } = {}): Learner {
  const l = newLearner();
  l.profile.characterId = 'cat';
  if (opts.grade) l.profile.grade = opts.grade;
  l.tracks.plus = { ...l.tracks.plus, stage: plus, passed: passed(plus), recent: opts.recentPlus ?? [] };
  l.tracks.minus = { ...l.tracks.minus, stage: minus, passed: passed(minus), recent: opts.recentMinus ?? [] };
  return l;
}

describe('pathView', () => {
  it('stands her on the lower track and shows two stones beyond', () => {
    const v = pathView(learner(4, 3));
    expect(v.hers).toBe(3);
    expect(v.stones.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(v.stones.filter((s) => s.hers).map((s) => s.index)).toEqual([3]);
    expect(v.stones.length).toBe(3 + AHEAD_SHOWN + 1);
  });

  it('never draws past the last stone of her grade', () => {
    const v = pathView(learner(9, 9, { grade: '1' }));
    expect(v.last).toBe(9);
    expect(v.stones[v.stones.length - 1].index).toBe(9);
    const k = pathView(learner(4, 4, { grade: 'K' }));
    expect(k.stones[k.stones.length - 1].index).toBe(4);
  });

  it('colours each half by its own track', () => {
    const v = pathView(learner(4, 3, { recentMinus: [true, true, false, true] }));
    const s3 = v.stones[3];
    expect(s3.plus.state).toBe('passed');
    expect(s3.minus.state).toBe('here');
    expect(s3.minus.fill).toBeCloseTo(3 / 6);
    expect(v.stones[4].plus.state).toBe('here');
    expect(v.stones[4].minus.state).toBe('ahead');
    expect(v.stones[5].plus.state).toBe('ahead');
  });

  it('marks a stone a track does not have in her grade', () => {
    // 2nd grade: plus goes to 12, minus to 11.
    const v = pathView(learner(12, 11, { grade: '2' }));
    expect(v.stones[v.stones.length - 1].index).toBe(12);
    expect(v.stones[12].minus.state).toBe('none');
  });

  it('seats a fixed friend only where both halves are passed', () => {
    const v = pathView(learner(4, 3));
    expect(v.stones.filter((s) => s.friend).map((s) => s.index)).toEqual([0, 1, 2]);
    expect(v.stones[1].friend).toBe(friendFor(1));
    expect(v.stones[3].friend).toBeNull();
  });

  it('keeps a friend on a stone she was moved back onto', () => {
    const l = learner(3, 3);
    l.tracks.plus.passed = passed(5); // she had got to 5, then went back
    l.tracks.minus.passed = passed(4);
    const v = pathView(l);
    expect(v.stones[3].friend).toBe(friendFor(3));
    expect(v.stones[3].hers).toBe(true);
    expect(v.stones[4].plus.state).toBe('passed');
    expect(v.stones[4].minus.state).toBe('ahead');
    expect(v.stones[4].friend).toBeNull();
  });

  it('shows pebbles for the lower track, capped at six', () => {
    const v = pathView(learner(4, 3, { recentMinus: [true, true, true, true, true, true, true, false] }));
    expect(v.pebbles).toEqual([{ track: 'minus', filled: 6, slots: 6 }]);
    const level = pathView(learner(2, 2, { recentPlus: [true], recentMinus: [false, true] }));
    expect(level.pebbles.map((p) => [p.track, p.filled])).toEqual([['plus', 1], ['minus', 1]]);
  });
});

describe('layoutPath', () => {
  it('stacks stone 0 at the bottom and every stone above the last', () => {
    for (let hers = 0; hers < 10; hers++) {
      const count = Math.min(10, hers + 3);
      const { spots, height } = layoutPath(count, hers);
      for (let i = 1; i < count; i++) expect(spots[i].y).toBeLessThan(spots[i - 1].y);
      expect(spots[0].y).toBeLessThan(height);
      expect(spots[count - 1].y).toBeGreaterThan(0);
    }
  });

  it('leaves her pebbles room on the side they go', () => {
    for (let hers = 0; hers < 13; hers++) {
      const s = layoutPath(hers + 1, hers).spots[hers];
      const w = pebblePillWidth(6);
      if (pebbleSide(s) === 'right') expect(s.x + s.r + 12 + w).toBeLessThanOrEqual(PATH_W + 12);
      else expect(s.x - s.r - 12 - w).toBeGreaterThanOrEqual(-12);
    }
  });
});

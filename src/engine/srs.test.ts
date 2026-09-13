import { describe, it, expect } from 'vitest';
import { SRSCard } from '@/types';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { createNewSRSCard, updateSRSCard, nextCardInSession, isDue } from './srs';

const mature = (over: Partial<SRSCard> = {}): SRSCard => ({
  questionId: 'add-8+7',
  easeFactor: 2.5,
  intervalDays: 6,
  nextDueDate: Date.now(),
  repetitions: 5,
  lastSeen: Date.now(),
  ...over,
});

// ---------------------------------------------------------------------------
// One question, answered twice in one session
// ---------------------------------------------------------------------------

describe('a question answered wrong then right in the same session', () => {
  // The retry requeues a missed question a few slots later, so this is the
  // normal path for every mistake she corrects -- not an edge case.
  const saved = { 'add-8+7': mature() };

  it('comes back tomorrow, not next week', () => {
    const inFlight: Record<string, SRSCard> = {};

    const afterWrong = nextCardInSession('add-8+7', false, saved, inFlight);
    inFlight['add-8+7'] = afterWrong;
    const afterRight = nextCardInSession('add-8+7', true, saved, inFlight);

    expect(afterWrong.intervalDays).toBe(1);
    expect(afterRight.intervalDays, 'the miss must still be scheduled').toBe(1);
  });

  it('keeps the ease penalty the miss earned', () => {
    const inFlight: Record<string, SRSCard> = {};
    const afterWrong = nextCardInSession('add-8+7', false, saved, inFlight);
    inFlight['add-8+7'] = afterWrong;
    const afterRight = nextCardInSession('add-8+7', true, saved, inFlight);

    // 2.5 - 0.2 for the miss, then + 0.1 for the correction: still below where
    // she started, because she did not know it.
    expect(afterRight.easeFactor).toBeLessThan(saved['add-8+7'].easeFactor);
  });

  it('survives the store merging updates last-write-wins', () => {
    // The store does `for (const card of srsUpdates) map[card.questionId] = card`,
    // so the *second* answer is the one that lands. This is what made the bug
    // invisible: the first card was correct and then thrown away.
    const inFlight: Record<string, SRSCard> = {};
    const updates: SRSCard[] = [];
    for (const correct of [false, true]) {
      const card = nextCardInSession('add-8+7', correct, saved, inFlight);
      inFlight['add-8+7'] = card;
      updates.push(card);
    }
    const merged: Record<string, SRSCard> = {};
    for (const card of updates) merged[card.questionId] = card;

    expect(merged['add-8+7'].intervalDays).toBe(1);
  });

  it('is what deriving both answers from the pre-session card got wrong', () => {
    // The old behaviour, reproduced: with nothing carried between answers, the
    // correction is computed against a card with 5 repetitions behind it and
    // pushes the fact a week out. Same inputs, opposite outcome.
    const bothFromBase = [false, true].map(
      (correct) => nextCardInSession('add-8+7', correct, saved, {}),
    );
    expect(bothFromBase[1].intervalDays).toBe(7);
    expect(bothFromBase[1].easeFactor).toBeGreaterThan(saved['add-8+7'].easeFactor);
  });

  it('starts a never-seen question from a fresh card', () => {
    const card = nextCardInSession('add-2+2', true, {}, {});
    expect(card.questionId).toBe('add-2+2');
    expect(card.repetitions).toBe(1);
  });

  it('leaves other questions in the session alone', () => {
    const inFlight: Record<string, SRSCard> = {};
    const a = nextCardInSession('add-8+7', false, saved, inFlight);
    inFlight['add-8+7'] = a;
    const b = nextCardInSession('sub-9-4', true, saved, inFlight);
    expect(b.questionId).toBe('sub-9-4');
    expect(b.repetitions).toBe(1); // a fresh card, not a-with-another-answer
  });
});

// ---------------------------------------------------------------------------
// The scheduler itself, which had no tests at all
// ---------------------------------------------------------------------------

describe('the spaced-repetition schedule', () => {
  it('sends a missed question back to tomorrow and forgets its run', () => {
    const card = updateSRSCard(mature(), false);
    expect(card.intervalDays).toBe(1);
    expect(card.repetitions).toBe(0);
  });

  it('never lets ease fall below the floor', () => {
    let card = createNewSRSCard('add-1+1');
    for (let i = 0; i < 50; i++) card = updateSRSCard(card, false);
    expect(card.easeFactor).toBe(GAME_CONFIG.srsMinEase);
  });

  it('never schedules further out than the cap', () => {
    let card = createNewSRSCard('add-1+1');
    for (let i = 0; i < 50; i++) card = updateSRSCard(card, true);
    expect(card.intervalDays).toBeLessThanOrEqual(GAME_CONFIG.srsMaxIntervalDays);
    expect(card.easeFactor).toBeLessThanOrEqual(3.0);
  });

  it('grows the gap only once she has got it right more than once', () => {
    let card = createNewSRSCard('add-1+1');
    card = updateSRSCard(card, true);
    expect(card.intervalDays).toBe(1);
    card = updateSRSCard(card, true);
    expect(card.intervalDays).toBe(3);
  });

  it('counts a card due the moment its date has passed', () => {
    expect(isDue(mature({ nextDueDate: Date.now() - 1000 }))).toBe(true);
    expect(isDue(mature({ nextDueDate: Date.now() + 60_000 }))).toBe(false);
  });
});

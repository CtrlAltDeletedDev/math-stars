import { SRSCard } from '@/types';
import { GAME_CONFIG } from '@/constants/gameConfig';

export function createNewSRSCard(questionId: string): SRSCard {
  return {
    questionId,
    easeFactor: GAME_CONFIG.srsInitialEase,
    intervalDays: 1,
    nextDueDate: Date.now(),
    repetitions: 0,
    lastSeen: 0,
  };
}

export function updateSRSCard(card: SRSCard, correct: boolean): SRSCard {
  const now = Date.now();

  if (!correct) {
    return {
      ...card,
      easeFactor: Math.max(GAME_CONFIG.srsMinEase, card.easeFactor - 0.2),
      intervalDays: 1,
      repetitions: 0,
      nextDueDate: now + msFromDays(1),
      lastSeen: now,
    };
  }

  const newRepetitions = card.repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 3;
  } else {
    newInterval = Math.min(
      GAME_CONFIG.srsMaxIntervalDays,
      Math.round(card.intervalDays * card.easeFactor),
    );
  }

  const newEase = Math.min(3.0, card.easeFactor + 0.1);

  return {
    ...card,
    easeFactor: newEase,
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextDueDate: now + msFromDays(newInterval),
    lastSeen: now,
  };
}

/**
 * The next state of one card *within a session already in progress*.
 *
 * A missed question is requeued a few slots later so the correction gets
 * tested while it is fresh, which means one question can be answered twice in
 * a single session. The session used to derive both answers from the same
 * pre-session card and then merge them last-write-wins, so the second
 * (correct) card overwrote the first: `intervalDays: 1` and the ease penalty
 * both vanished, and a fact she got wrong was scheduled as if she had simply
 * got it right. Exactly backwards -- that is the fact most worth seeing again
 * tomorrow.
 *
 * `inFlight` holds what this session has already decided, so a second answer
 * builds on the first instead of replacing it.
 */
export function nextCardInSession(
  questionId: string,
  correct: boolean,
  saved: Record<string, SRSCard>,
  inFlight: Record<string, SRSCard>,
): SRSCard {
  const base = inFlight[questionId] ?? saved[questionId] ?? createNewSRSCard(questionId);
  return updateSRSCard(base, correct);
}

export function isDue(card: SRSCard): boolean {
  return card.nextDueDate <= Date.now();
}

function msFromDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Keep the card store from growing without bound.
 *
 * Generated questions mint a new card per distinct question, forever, and
 * nothing ever removed them — a year of daily play would push thousands of
 * entries into localStorage, which has a hard quota. Cards she has clearly
 * mastered (several correct repetitions, not due for a long time) carry almost
 * no information, so they are the ones to drop.
 */
export function pruneSRSCards(
  cards: Record<string, SRSCard>,
  limit = GAME_CONFIG.maxSRSCards,
  /**
   * Whether a card can still be turned back into a question. Cards that cannot
   * are dropped outright: they are permanently due, so the scoring below treats
   * them as the MOST valuable thing to keep, and they would evict real ones.
   */
  isServable?: (questionId: string) => boolean,
): Record<string, SRSCard> {
  let entries = Object.entries(cards);
  if (isServable) {
    const servable = entries.filter(([, c]) => isServable(c.questionId));
    if (servable.length !== entries.length) {
      entries = servable;
      cards = Object.fromEntries(entries);
    }
  }
  if (entries.length <= limit) return cards;

  // Most valuable first: due or struggling cards, then the least mastered.
  const now = Date.now();
  const score = ([, c]: [string, SRSCard]) => {
    if (c.nextDueDate <= now) return 0; // due — always keep
    return c.repetitions * 1000 + (c.nextDueDate - now) / 86_400_000;
  };
  const kept = entries.sort((a, b) => score(a) - score(b)).slice(0, limit);
  return Object.fromEntries(kept);
}

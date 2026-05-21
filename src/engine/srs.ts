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

export function isDue(card: SRSCard): boolean {
  return card.nextDueDate <= Date.now();
}

function msFromDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

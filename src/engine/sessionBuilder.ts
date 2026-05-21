import { Question, SRSCard, Level } from '@/types';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { generateFromParams } from './questionGenerator';
import { isDue } from './srs';
import { GAME_CONFIG } from '@/constants/gameConfig';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSession(
  level: Level,
  srsCards: Record<string, SRSCard>,
  characterName = 'You',
): Question[] {
  const total = level.questionsPerSession;
  const session: Question[] = [];

  if (level.questionBankIds && level.questionBankIds.length > 0) {
    const bankIds = level.questionBankIds;
    const dueIds = bankIds.filter((id) => {
      const card = srsCards[id];
      return card ? isDue(card) : true;
    });

    const maxSRS = Math.min(GAME_CONFIG.maxSRSPerSession, Math.floor(total / 2));
    const srsSlot = Math.min(dueIds.length, maxSRS);
    const srsQuestions = shuffle(dueIds)
      .slice(0, srsSlot)
      .map((id) => ALL_QUESTIONS_BY_ID.get(id))
      .filter(Boolean) as Question[];

    session.push(...srsQuestions);

    const remaining = total - session.length;
    const notDueIds = bankIds.filter((id) => !srsQuestions.some((q) => q.id === id));
    const fillQuestions = shuffle(notDueIds)
      .slice(0, remaining)
      .map((id) => ALL_QUESTIONS_BY_ID.get(id))
      .filter(Boolean) as Question[];

    session.push(...fillQuestions);

    return shuffle(session).slice(0, total);
  }

  if (level.generatorParams) {
    for (let i = 0; i < total; i++) {
      session.push(generateFromParams(level.generatorParams, characterName));
    }
  }

  return session;
}

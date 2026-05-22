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
  const maxDue = Math.min(GAME_CONFIG.maxSRSPerSession, Math.floor(total / 2));

  // --- Bank-based levels (counting, shapes, time) ---
  if (level.questionBankIds && level.questionBankIds.length > 0) {
    const bankIds = level.questionBankIds;

    const dueIds = bankIds.filter((id) => {
      const card = srsCards[id];
      return card ? isDue(card) : false; // only truly due, not brand-new
    });
    const unseenIds = bankIds.filter((id) => !srsCards[id]);
    const reviewedNotDueIds = bankIds.filter((id) => {
      const card = srsCards[id];
      return card && !isDue(card);
    });

    const srsQuestions = shuffle(dueIds)
      .slice(0, maxDue)
      .map((id) => ALL_QUESTIONS_BY_ID.get(id))
      .filter(Boolean) as Question[];

    // Fill remaining: prefer unseen, then reviewed-not-due
    const fillPool = shuffle([...unseenIds, ...reviewedNotDueIds]);
    const usedIds = new Set(srsQuestions.map((q) => q.id));
    const fillQuestions = fillPool
      .filter((id) => !usedIds.has(id))
      .slice(0, total - srsQuestions.length)
      .map((id) => ALL_QUESTIONS_BY_ID.get(id))
      .filter(Boolean) as Question[];

    return shuffle([...srsQuestions, ...fillQuestions]).slice(0, total);
  }

  // --- Generated levels (arithmetic, skip count, multiplication) ---
  if (level.generatorParams) {
    // Build a large pool of unique questions (deterministic IDs enable dedup)
    const pool = new Map<string, Question>();
    const targetPoolSize = Math.min(total * 8, 200);
    let attempts = 0;
    while (pool.size < targetPoolSize && attempts < 400) {
      const q = generateFromParams(level.generatorParams, characterName);
      if (!pool.has(q.id)) pool.set(q.id, q);
      attempts++;
    }

    const allQuestions = Array.from(pool.values());

    // Split into: due (wrong recently), unseen, reviewed-not-due
    const dueQuestions = allQuestions.filter((q) => {
      const card = srsCards[q.id];
      return card && isDue(card);
    });
    const unseenQuestions = allQuestions.filter((q) => !srsCards[q.id]);
    const notDueQuestions = allQuestions.filter((q) => {
      const card = srsCards[q.id];
      return card && !isDue(card);
    });

    const dueSlot = shuffle(dueQuestions).slice(0, maxDue);
    const usedIds = new Set(dueSlot.map((q) => q.id));
    const fillPool = shuffle([...unseenQuestions, ...notDueQuestions])
      .filter((q) => !usedIds.has(q.id))
      .slice(0, total - dueSlot.length);

    return shuffle([...dueSlot, ...fillPool]).slice(0, total);
  }

  return [];
}

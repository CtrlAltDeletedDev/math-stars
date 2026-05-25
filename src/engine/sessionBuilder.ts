import { Question, SRSCard, Level, UserProgress } from '@/types';
import { Category } from '@/types';
import { CATEGORIES, ALL_QUESTIONS_BY_ID } from '@/data/categories';
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
    let consecutiveMisses = 0;
    while (pool.size < targetPoolSize && consecutiveMisses < 20) {
      const q = generateFromParams(level.generatorParams, characterName);
      if (!pool.has(q.id)) { pool.set(q.id, q); consecutiveMisses = 0; }
      else { consecutiveMisses++; }
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

function buildLevelQuestions(level: Level, srsCards: Record<string, SRSCard>, characterName: string): Question[] {
  if (level.questionBankIds && level.questionBankIds.length > 0) {
    return level.questionBankIds.map((id) => ALL_QUESTIONS_BY_ID.get(id)).filter(Boolean) as Question[];
  }
  if (level.generatorParams) {
    const pool = new Map<string, Question>();
    let consecutiveMisses = 0;
    while (pool.size < 30 && consecutiveMisses < 20) {
      const q = generateFromParams(level.generatorParams, characterName);
      if (!pool.has(q.id)) { pool.set(q.id, q); consecutiveMisses = 0; }
      else { consecutiveMisses++; }
    }
    return Array.from(pool.values());
  }
  return [];
}

function srsSort(questions: Question[], srsCards: Record<string, SRSCard>, n: number): Question[] {
  const due = questions.filter((q) => { const c = srsCards[q.id]; return c && isDue(c); });
  const unseen = questions.filter((q) => !srsCards[q.id]);
  const notDue = questions.filter((q) => { const c = srsCards[q.id]; return c && !isDue(c); });
  const maxDue = Math.min(GAME_CONFIG.maxSRSPerSession, Math.floor(n / 2));
  const dueSlot = shuffle(due).slice(0, maxDue);
  const usedIds = new Set(dueSlot.map((q) => q.id));
  const fill = shuffle([...unseen, ...notDue]).filter((q) => !usedIds.has(q.id)).slice(0, n - dueSlot.length);
  return shuffle([...dueSlot, ...fill]).slice(0, n);
}

export function buildDailyChallengeSession(progress: UserProgress, characterName = 'You'): Question[] {
  const { srsCards } = progress;
  const total = 10;

  const activeCats = CATEGORIES.filter((cat) => {
    const catProg = progress.categories[cat.id];
    if (!catProg) return false;
    return Object.values(catProg.levels).some((l) => l.status === 'unlocked' || l.status === 'completed');
  });

  if (activeCats.length === 0) return [];

  const perCat = Math.max(1, Math.ceil(total / activeCats.length));
  const poolPerCat: Question[][] = activeCats.map((cat) => {
    const catProg = progress.categories[cat.id];
    const activeLevels = cat.levels.filter((l) => {
      const ls = catProg?.levels[l.id];
      return ls && (ls.status === 'unlocked' || ls.status === 'completed');
    });
    const allQ: Question[] = [];
    for (const level of activeLevels) {
      allQ.push(...buildLevelQuestions(level, srsCards, characterName));
    }
    const deduped = [...new Map(allQ.map((q) => [q.id, q])).values()];
    return srsSort(deduped, srsCards, perCat);
  });

  return shuffle(poolPerCat.flat()).slice(0, total);
}

export function buildMasterSession(
  category: Category,
  srsCards: Record<string, SRSCard>,
  characterName = 'You',
  n = 10,
): Question[] {
  const allQ: Question[] = [];
  for (const level of category.levels) {
    allQ.push(...buildLevelQuestions(level, srsCards, characterName));
  }
  const deduped = [...new Map(allQ.map((q) => [q.id, q])).values()];
  return srsSort(deduped, srsCards, n);
}

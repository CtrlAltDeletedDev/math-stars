import { Question, SRSCard, Level, UserProgress } from '@/types';
import { Category } from '@/types';
import { CATEGORIES, ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { generateFromParams, questionFromId } from './questionGenerator';
import { isDue } from './srs';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { shuffle, shuffleChoices } from './choices';

// Every question handed to a game screen passes through here. Bank files are
// free to list `choices` in any order — often with the answer written first,
// which is how it ends up under the same button every time — so the order is
// randomised at the last moment, on a copy, for every session.
function withShuffledChoices(q: Question): Question {
  return { ...q, choices: shuffleChoices(q.choices) };
}

function presentAll(questions: Question[]): Question[] {
  return questions.map(withShuffledChoices);
}

// Interleave questions by first operand so the same number doesn't appear back-to-back.
function spreadByFirstOperand(questions: Question[]): Question[] {
  const groups = new Map<string, Question[]>();
  for (const q of questions) {
    const m = q.id.match(/^(?:add|sub|miss-add|miss-sub)-(\d+)/);
    const key = m ? m[1] : '_';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  }
  if (groups.size <= 1) return questions;
  const buckets = [...groups.values()];
  const result: Question[] = [];
  let i = 0;
  while (result.length < questions.length) {
    const bucket = buckets[i % buckets.length];
    if (bucket.length > 0) result.push(bucket.shift()!);
    i++;
  }
  return result;
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

    return presentAll(shuffle([...srsQuestions, ...fillQuestions]).slice(0, total));
  }

  // --- Generated levels (arithmetic, skip count, multiplication) ---
  if (level.generatorParams) {
    // Build a large pool of unique questions (deterministic IDs enable dedup)
    const pool = new Map<string, Question>();
    const targetPoolSize = Math.min(total * 8, 200);
    let consecutiveMisses = 0;
    while (pool.size < targetPoolSize && consecutiveMisses < 80) {
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

    return presentAll(spreadByFirstOperand(shuffle([...dueSlot, ...fillPool])).slice(0, total));
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
    while (pool.size < 30 && consecutiveMisses < 80) {
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

  // Only topics she has actually played.
  //
  // Level 1 of every category is unlocked from the start, so "unlocked" meant
  // all eleven categories on day one — a brand-new player's first ten questions
  // were place value, telling time and comparing symbols before she had
  // answered a single sum. A category counts as active once she has attempted
  // something in it.
  const hasStarted = (cat: Category) => {
    const catProg = progress.categories[cat.id];
    if (!catProg) return false;
    return Object.values(catProg.levels).some((l) => l.status === 'completed' || l.totalAttempts > 0);
  };

  let activeCats = CATEGORIES.filter(hasStarted);

  // Nothing played yet: fall back to the first category only, so the daily
  // challenge is a gentle introduction rather than a tour of the whole app.
  if (activeCats.length === 0) activeCats = CATEGORIES.slice(0, 1);

  const perCat = Math.max(1, Math.ceil(total / activeCats.length));
  const poolPerCat: Question[][] = activeCats.map((cat) => {
    const catProg = progress.categories[cat.id];
    const activeLevels = cat.levels.filter((l) => {
      const ls = catProg?.levels[l.id];
      if (!ls) return false;
      return ls.status === 'completed' || ls.totalAttempts > 0;
    });
    // A category she has only just unlocked still needs something to ask.
    if (activeLevels.length === 0 && cat.levels.length > 0) activeLevels.push(cat.levels[0]);
    const allQ: Question[] = [];
    for (const level of activeLevels) {
      allQ.push(...buildLevelQuestions(level, srsCards, characterName));
    }
    const deduped = [...new Map(allQ.map((q) => [q.id, q])).values()];
    return srsSort(deduped, srsCards, perCat);
  });

  return presentAll(shuffle(poolPerCat.flat()).slice(0, total));
}

// Build a session purely from due SRS cards — the questions the child has
// gotten wrong recently, most overdue first. Bank questions are looked up
// directly; generated questions are rebuilt from their deterministic IDs.
export function buildReviewSession(progress: UserProgress, n = 10, characterName = 'You'): Question[] {
  const dueCards = Object.values(progress.srsCards)
    .filter(isDue)
    .sort((a, b) => a.nextDueDate - b.nextDueDate);

  const questions: Question[] = [];
  for (const card of dueCards) {
    const q = ALL_QUESTIONS_BY_ID.get(card.questionId) ?? questionFromId(card.questionId, characterName);
    if (q) questions.push(q);
    if (questions.length >= n) break;
  }
  return presentAll(shuffle(questions));
}

export function countDueReviews(progress: UserProgress): number {
  return Object.values(progress.srsCards).filter(isDue).length;
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
  return presentAll(srsSort(deduped, srsCards, n));
}

import { Question, SRSCard, Level, UserProgress } from '@/types';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { SKILLS_BY_ID, questionForRung, unlockedSkillIds } from '@/data/skills';
import { ceilingFor } from '@/data/grades';
import { skillForQuestion } from '@/data/topics';
import { generateFromParams, questionFromId, canRebuildFromId } from './questionGenerator';
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

// ---------------------------------------------------------------------------
// Sessions drawn from the ladders
// ---------------------------------------------------------------------------

/**
 * A mixed session keeps most of its room for fresh questions. Reviews are
 * there so old mistakes resurface, not to turn the day's challenge into a
 * second Practice Mistakes button.
 */
const MIXED_SESSION_REVIEWS = 3;

const DAILY_SESSION_SIZE = 10;

/**
 * The rung she is actually served on a skill: her saved rung, held at her
 * grade's ceiling. The same clamp Practice applies, so every mode agrees on
 * where she stands.
 */
function servingRung(progress: UserProgress, skillId: string): number {
  return Math.min(progress.skills?.[skillId]?.rung ?? 0, ceilingFor(skillId, progress.gradeLevel));
}

/** Up to `n` different questions from one rung — fewer if its pool is small. */
function questionsAtRung(skillId: string, rung: number, n: number, avoid: Set<string>): Question[] {
  const skill = SKILLS_BY_ID.get(skillId);
  if (!skill) return [];
  const out: Question[] = [];
  let misses = 0;
  while (out.length < n && misses < 40) {
    const q = questionForRung(skill, rung);
    if (!q || avoid.has(q.id)) { misses++; continue; }
    avoid.add(q.id);
    out.push(q);
  }
  return out;
}

/**
 * One question from each source in turn, so a session drawn from several
 * skills or rungs is actually mixed rather than ten of whichever came first.
 * Stops early only once every source has run dry.
 */
function dealRoundRobin(sources: { skillId: string; rung: number }[], n: number, avoid: Set<string>): Question[] {
  const out: Question[] = [];
  let dry = 0;
  for (let i = 0; out.length < n && sources.length > 0 && dry < sources.length; i++) {
    const { skillId, rung } = sources[i % sources.length];
    const [q] = questionsAtRung(skillId, rung, 1, avoid);
    if (q) { out.push(q); dry = 0; } else dry++;
  }
  return out;
}

/**
 * Due cards turned back into questions, most overdue first. Bank questions are
 * looked up directly; generated ones are rebuilt from their deterministic ids.
 */
function dueQuestions(
  progress: UserProgress,
  n: number,
  characterName: string,
  keep: (q: Question) => boolean = () => true,
): Question[] {
  const dueCards = Object.values(progress.srsCards ?? {})
    .filter(isDue)
    .sort((a, b) => a.nextDueDate - b.nextDueDate);

  const questions: Question[] = [];
  for (const card of dueCards) {
    if (questions.length >= n) break;
    const q = ALL_QUESTIONS_BY_ID.get(card.questionId) ?? questionFromId(card.questionId, characterName);
    if (q && keep(q)) questions.push(q);
  }
  return questions;
}

/**
 * Today's ten mixed questions, drawn from where she actually stands.
 *
 * This used to be built from the categories she had played *levels* in. Play —
 * the big button on Home, and the way the app now steers her — writes no level
 * history, so a child who only ever pressed Play fell through to "the first
 * level of the first category" and was asked ten `n + 1` questions every day,
 * whatever she could really do.
 *
 * Now: a few reviews that are due, then fresh questions at her current rung on
 * every topic she has started, dealt one topic at a time. Level play, Practice
 * and every other mode feed the same ladders, so "started" means the same thing
 * whichever button she uses.
 */
export function buildDailyChallengeSession(progress: UserProgress, characterName = 'You'): Question[] {
  const reviews = dueQuestions(progress, MIXED_SESSION_REVIEWS, characterName);
  const avoid = new Set(reviews.map((q) => q.id));

  const available = unlockedSkillIds(progress.skills, progress.gradeLevel);
  const started = available.filter((id) => (progress.skills?.[id]?.attempts ?? 0) > 0);
  // Nothing played yet: the first topic of her grade only, so the first daily
  // challenge is a gentle start rather than a tour of the whole app.
  const pool = started.length > 0 ? shuffle(started) : available.slice(0, 1);

  const fresh = dealRoundRobin(
    pool.map((skillId) => ({ skillId, rung: servingRung(progress, skillId) })),
    DAILY_SESSION_SIZE - reviews.length,
    avoid,
  );
  return presentAll(shuffle([...reviews, ...fresh]));
}

// Build a session purely from due SRS cards — the questions the child has
// gotten wrong recently, most overdue first.
export function buildReviewSession(progress: UserProgress, n = 10, characterName = 'You'): Question[] {
  return presentAll(shuffle(dueQuestions(progress, n, characterName)));
}

/**
 * A card is only worth counting if the review session can actually build its
 * question. Fraction and money ids can't be rebuilt, and a wrong answer parks
 * them due forever — so they inflated this badge permanently and every tap on
 * it dead-ended.
 */
export function isServableCard(questionId: string): boolean {
  return ALL_QUESTIONS_BY_ID.has(questionId) || canRebuildFromId(questionId);
}

export function countDueReviews(progress: UserProgress): number {
  return Object.values(progress.srsCards).filter(
    (c) => isDue(c) && isServableCard(c.questionId),
  ).length;
}

/**
 * Master Mode for one topic: everything she has climbed through, mixed.
 *
 * It used to take a whole *category*, found through the topic's first level.
 * Categories and topics do not line up, so Taking Away's Master Mode was the
 * same "One Step at a Time" category as Adding's, Number Tricks' was the whole
 * eleven-level Addition & Subtraction category, and Skip Counting's served the
 * times tables to a first grader whose grade stops before them.
 *
 * Now it deals from every rung of this topic from the one she stands on down to
 * the first, her own rung first — so it reaches no higher than she has climbed
 * and no further than her grade — plus a few of this topic's due reviews.
 */
export function buildMasterSession(
  progress: UserProgress,
  skillId: string,
  characterName = 'You',
  n = 10,
): Question[] {
  if (!SKILLS_BY_ID.has(skillId)) return [];
  const top = servingRung(progress, skillId);
  const rungs = Array.from({ length: top + 1 }, (_, i) => top - i);

  const reviews = dueQuestions(
    progress, MIXED_SESSION_REVIEWS, characterName,
    (q) => skillForQuestion(q, '') === skillId,
  );
  const avoid = new Set(reviews.map((q) => q.id));
  const fresh = dealRoundRobin(rungs.map((rung) => ({ skillId, rung })), n - reviews.length, avoid);
  return presentAll(shuffle([...reviews, ...fresh]));
}

/**
 * Quick Review for one topic: a short run at the rung she is standing on.
 *
 * It used to replay the topic's first level, so Quick Review on Adding was
 * "+1" for ever, however far up the ladder she had climbed.
 */
export function buildRungSession(progress: UserProgress, skillId: string, n = 10): Question[] {
  return presentAll(questionsAtRung(skillId, servingRung(progress, skillId), n, new Set()));
}

import { UserProgress, CategoryProgress, LevelState, SkillState, SRSCard } from '@/types';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { TOPICS } from '@/data/topics';
import { SKILLS_BY_ID } from '@/data/skills';
import { ErrorTag } from '@/types';

/** The tags a save is allowed to contain. Anything else came from somewhere else. */
const ERROR_TAGS = new Set<ErrorTag>([
  'off-by-one', 'wrong-operation', 'answered-a-given-number', 'answered-the-whole',
  'place-value', 'wrong-multiple', 'counted-the-wrong-thing', 'reversed', 'unknown',
]);

const STORAGE_KEY = 'mathstars_progress_v2';
/** Where an unreadable save is parked instead of being thrown away. */
export const CORRUPT_BACKUP_KEY = 'mathstars_progress_unreadable';
/** Rungs added below the existing ones on the adding/taking-away ladders in v4. */
const LADDER_RUNGS_INSERTED_IN_V4 = 2;
const CURRENT_VERSION = 6;
const OLDEST_MIGRATABLE = 2;

// Patch missing fields on a saved/imported progress object so the rest of
// the app can rely on every field existing. Returns null if it's not a
// compatible save at all.
//
// Anything from OLDEST_MIGRATABLE upward is *migrated*, not rejected. This used
// to hard-reject any version !== 2, which meant the first schema change would
// have silently wiped every star she had earned.

/** A save has to be shaped roughly right before we trust any of it. */
function looksLikeProgress(p: UserProgress): boolean {
  const isPlainObject = (v: unknown) =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  // Only fields whose *wrong* shape would crash a render are checked. Missing is
  // fine — that is what the patching below is for. Present-but-wrong is not:
  // `categories: []` sails through a falsiness check and then throws on the
  // first Object.values(cat.levels) of the next render, which used to leave the
  // app in a permanent crash loop behind "Your stars are all safe!".
  if (p.categories !== undefined && !isPlainObject(p.categories)) return false;
  if (p.skills !== undefined && !isPlainObject(p.skills)) return false;
  if (p.srsCards !== undefined && !isPlainObject(p.srsCards)) return false;
  if (p.earnedBadges !== undefined && !Array.isArray(p.earnedBadges)) return false;
  if (p.purchasedItems !== undefined && !Array.isArray(p.purchasedItems)) return false;
  if (p.playHistory !== undefined && !Array.isArray(p.playHistory)) return false;
  if (p.earnedStickers !== undefined && !Array.isArray(p.earnedStickers)) return false;
  if (p.practiceFocus !== undefined && !Array.isArray(p.practiceFocus)) return false;
  if (p.totalStars !== undefined && typeof p.totalStars !== 'number') return false;
  return true;
}

/**
 * Make the contents of `skills` safe to use, not just its shape.
 *
 * `looksLikeProgress` checks that `skills` is an object and stops there, so a
 * save with `recent: null` sailed through and then threw on the first answer
 * (`[...prev.recent, wasCorrect]`) and on the Parent screen (`recent.length`).
 * The import path takes an arbitrary parent-chosen file, so that was reachable
 * without any disk corruption -- and it crashed *behind* the screen that says
 * her stars are safe.
 *
 * Repair what can be repaired, because her rung is the valuable part and a
 * damaged window is not worth losing it over. Drop a skill the catalogue does
 * not have: a renamed or removed id could never promote (its ladder top reads
 * as 0) and never recorded a ceiling hit, so it sat frozen and silent forever.
 * The catalogue says what exists; saved state only says what happened.
 */
function sanitizeSkills(skills: Record<string, SkillState>): Record<string, SkillState> {
  const clean: Record<string, SkillState> = {};

  for (const [id, state] of Object.entries(skills)) {
    const skill = SKILLS_BY_ID.get(id);
    if (!skill) continue; // not in the catalogue, so it means nothing
    if (!state || typeof state !== 'object' || Array.isArray(state)) continue;

    const rung = Number.isInteger(state.rung) && state.rung >= 0
      ? Math.min(state.rung, skill.rungs.length - 1)
      : 0;
    const recent = Array.isArray(state.recent)
      ? state.recent.filter((r) => typeof r === 'boolean')
      : [];
    const attempts = typeof state.attempts === 'number' && state.attempts >= 0 ? state.attempts : 0;
    const correct = typeof state.correct === 'number' && state.correct >= 0 ? state.correct : 0;

    clean[id] = {
      skillId: id,
      rung,
      recent,
      attempts,
      correct: Math.min(correct, attempts),
      ceilingHits: typeof state.ceilingHits === 'number' && state.ceilingHits >= 0
        ? state.ceilingHits
        : 0,
    };
  }

  return clean;
}

/**
 * Counts only, for skills that exist, for tags that exist.
 *
 * An imported file could otherwise put anything in here, and this feeds a
 * sentence a parent is meant to act on -- "8 of her last 10 subtraction
 * mistakes were adding instead". A wrong number there is worse than no
 * sentence at all.
 */
function sanitizeErrorPatterns(
  patterns: Record<string, Partial<Record<ErrorTag, number>>>,
): Record<string, Partial<Record<ErrorTag, number>>> {
  const clean: Record<string, Partial<Record<ErrorTag, number>>> = {};
  for (const [skillId, tags] of Object.entries(patterns)) {
    if (!SKILLS_BY_ID.has(skillId)) continue;
    if (!tags || typeof tags !== 'object' || Array.isArray(tags)) continue;
    const kept: Partial<Record<ErrorTag, number>> = {};
    for (const [tag, count] of Object.entries(tags)) {
      if (!ERROR_TAGS.has(tag as ErrorTag)) continue;
      if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) continue;
      kept[tag as ErrorTag] = Math.floor(count);
    }
    if (Object.keys(kept).length > 0) clean[skillId] = kept;
  }
  return clean;
}

/** Same reasoning for cards: a malformed one is never usable, only dangerous. */
function sanitizeSRSCards(cards: Record<string, SRSCard>): Record<string, SRSCard> {
  const clean: Record<string, SRSCard> = {};
  for (const [id, card] of Object.entries(cards)) {
    if (!card || typeof card !== 'object' || Array.isArray(card)) continue;
    if (typeof card.nextDueDate !== 'number' || !Number.isFinite(card.nextDueDate)) continue;
    if (typeof card.easeFactor !== 'number' || !Number.isFinite(card.easeFactor)) continue;
    clean[id] = { ...card, questionId: card.questionId ?? id };
  }
  return clean;
}

export function normalizeProgress(parsed: UserProgress): UserProgress | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (typeof parsed.version !== 'number') return null;
  if (parsed.version < OLDEST_MIGRATABLE || parsed.version > CURRENT_VERSION) return null;
  if (!looksLikeProgress(parsed)) return null;

  const fromVersion = parsed.version;

  // Patch fields added after initial release
  if (!parsed.categories) parsed.categories = {};
  if (!parsed.srsCards) parsed.srsCards = {};
  if (!parsed.earnedBadges) parsed.earnedBadges = [];
  if (!parsed.purchasedItems) parsed.purchasedItems = [];
  if (!parsed.playHistory) parsed.playHistory = [];
  if (!parsed.earnedStickers) parsed.earnedStickers = [];
  if (parsed.musicEnabled === undefined) parsed.musicEnabled = false;
  if (parsed.challengeMode === undefined) parsed.challengeMode = false;
  if (parsed.slowMode === undefined) parsed.slowMode = false;
  if (parsed.autoReadEnabled === undefined) parsed.autoReadEnabled = true;
  if (parsed.dailyChallengeStreak === undefined) parsed.dailyChallengeStreak = 0;
  if (!parsed.lastDailyChallengeDate) parsed.lastDailyChallengeDate = '';
  if (!parsed.dailyChallengeHistory) parsed.dailyChallengeHistory = [];
  if (!parsed.dailyQuestionsDate) parsed.dailyQuestionsDate = '';
  if (parsed.dailyQuestionsCount === undefined) parsed.dailyQuestionsCount = 0;

  // v2 → v3: adaptive practice. Nothing to convert; she simply starts at the
  // bottom of each ladder and climbs, which happens quickly for anything she
  // already knows.
  if (!parsed.skills) parsed.skills = {};
  if (parsed.practiceQuestionsAnswered === undefined) parsed.practiceQuestionsAnswered = 0;

  // v3 → v4: two targeted rungs ("+1", "+2" / "-1", "-2") were inserted at the
  // BOTTOM of the adding and taking-away ladders, so every rung above them
  // shifted up by two. Without this a child sitting on "adding within 20" would
  // silently be demoted to "adding within 5" and have to climb it again.
  if (fromVersion < 4) {
    for (const id of ['adding', 'taking-away']) {
      const state = parsed.skills[id];
      if (state && typeof state.rung === 'number') {
        state.rung = state.rung + LADDER_RUNGS_INSERTED_IN_V4;
      }
    }
  }
  if (!parsed.practiceFocus) parsed.practiceFocus = [];

  // v4 → v5: levels stop being a lock chain, and the ladder learns from them.
  if (fromVersion < 5) {
    migrateToV5(parsed);
  }
  if (parsed.gradeLevel === undefined) parsed.gradeLevel = null;

  // v5 → v6: what her wrong answers meant. Purely additive -- there is nothing
  // to convert, she simply starts accumulating from here.
  if (!parsed.errorPatterns || typeof parsed.errorPatterns !== 'object') {
    parsed.errorPatterns = {};
  }

  // Last, so it also cleans up anything the migrations above produced.
  parsed.skills = sanitizeSkills(parsed.skills);
  parsed.srsCards = sanitizeSRSCards(parsed.srsCards);
  parsed.errorPatterns = sanitizeErrorPatterns(parsed.errorPatterns);

  parsed.version = CURRENT_VERSION;
  return parsed;
}

/**
 * The v5 conversion, in three parts.
 *
 * 1. `status` and `unlockedAt` go away. `status` was a second copy of what
 *    `bestScore` already said, and its *absence* meant "locked" — which is why
 *    any level added to an existing category showed a padlock forever. What
 *    exists is now read from the catalogue; saved state only records what
 *    happened.
 * 2. The record goes sparse: entries for levels she never attempted carried no
 *    information beyond that vestigial status, so they are dropped.
 * 3. The ladder is seeded from her level history. This is the one-time repair
 *    of the split that let a child three-star every level in a category and
 *    still be handed rung 0 the moment she opened Practice.
 */
function migrateToV5(parsed: UserProgress): void {
  const legacy = parsed as UserProgress & {
    categories: Record<string, { levels: Record<string, LevelState & { status?: string; unlockedAt?: number }> }>;
  };

  for (const cat of Object.values(legacy.categories)) {
    if (!cat?.levels || typeof cat.levels !== 'object') continue;
    for (const [levelId, state] of Object.entries(cat.levels)) {
      if (!state || typeof state !== 'object') { delete cat.levels[levelId]; continue; }

      // Keep "she passed this" alive now that it is derived from the score.
      if (state.status === 'completed' && (state.bestScore ?? 0) < GAME_CONFIG.passThreshold) {
        state.bestScore = GAME_CONFIG.passThreshold;
      }
      delete state.status;
      delete state.unlockedAt;

      if (!state.totalAttempts) delete cat.levels[levelId];
    }
  }

  // Drop categories left holding nothing.
  for (const [catId, cat] of Object.entries(legacy.categories)) {
    if (!cat?.levels || Object.keys(cat.levels).length === 0) delete legacy.categories[catId];
  }

  seedLaddersFromLevels(parsed);
}

/**
 * Give each ladder the credit her level play already earned.
 *
 * Takes the highest rung she has demonstrably passed in each topic and lifts the
 * skill to it. Never demotes: a ladder that is already higher stays where it is.
 *
 * A lucky three-star can over-promote her. That is deliberate and safe — the
 * window is cleared, so the very next eight answers can walk her back down under
 * the ordinary 3-of-8 demotion rule. Seeding high and letting evidence correct it
 * is much kinder than making her re-climb ground she has already covered.
 */
function seedLaddersFromLevels(parsed: UserProgress): void {
  const passed = (levelId: string): boolean => {
    for (const cat of Object.values(parsed.categories)) {
      const state = cat?.levels?.[levelId];
      if (state) return state.bestScore >= GAME_CONFIG.passThreshold;
    }
    return false;
  };

  for (const topic of TOPICS) {
    let seeded = -1;
    for (const ref of topic.levels) {
      if (passed(ref.levelId)) seeded = Math.max(seeded, ref.rung);
    }
    if (seeded < 0) continue;

    const existing = parsed.skills[topic.id];
    const next: SkillState = existing
      ? { ...existing, rung: Math.max(existing.rung, seeded), recent: [] }
      : { skillId: topic.id, rung: seeded, recent: [], attempts: 0, correct: 0, ceilingHits: 0 };
    parsed.skills[topic.id] = next;
  }
}

/**
 * Read the saved profile.
 *
 * Returns the progress, or a reason it could not be read. An unreadable save is
 * NEVER silently dropped: it is copied to a backup key first, because the caller
 * will otherwise start from a blank profile and overwrite the original on her
 * very next answer — turning a recoverable glitch into every star gone.
 */
export type LoadResult =
  | { ok: true; progress: UserProgress }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'unreadable'; backedUp: boolean };

export function loadProgressResult(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, reason: 'unreadable', backedUp: false };
  }
  if (!raw) return { ok: false, reason: 'empty' };

  let normalized: UserProgress | null = null;
  try {
    normalized = normalizeProgress(JSON.parse(raw) as UserProgress);
  } catch {
    normalized = null;
  }
  if (normalized) return { ok: true, progress: normalized };

  let backedUp = false;
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    backedUp = true;
  } catch {
    // Nothing more we can do; at least don't pretend it was saved.
  }
  return { ok: false, reason: 'unreadable', backedUp };
}

export function loadProgress(): UserProgress | null {
  const result = loadProgressResult();
  return result.ok ? result.progress : null;
}

/** Whether the last write actually landed. Silence here used to mean lost stars. */
export function saveProgress(progress: UserProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    // Quota exceeded, or Safari private browsing, where every write throws.
    return false;
  }
}

/**
 * Can we persist at all? Called once at startup so the Parent screen can say
 * "progress isn't being saved" instead of the app quietly behaving like a
 * goldfish for an hour of play.
 */
export function storageWorks(): boolean {
  try {
    const probe = '__mathstars_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function buildInitialProgress(): UserProgress {
  return {
    version: CURRENT_VERSION,
    totalStars: 0,
    spendableStars: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    // Empty on purpose. A CategoryProgress is created on first play; nothing
    // reads this map to decide what she is allowed to open.
    categories: {} as Record<string, CategoryProgress>,
    srsCards: {},
    characterId: null,
    earnedBadges: [],
    purchasedItems: [],
    activeTheme: 'sky',
    consecutiveCorrect: 0,
    playHistory: [],
    earnedStickers: [],
    musicEnabled: false,
    challengeMode: false,
    slowMode: false,
    autoReadEnabled: true,
    dailyChallengeStreak: 0,
    lastDailyChallengeDate: '',
    dailyChallengeHistory: [],
    dailyQuestionsDate: '',
    dailyQuestionsCount: 0,
    skills: {},
    practiceQuestionsAnswered: 0,
    practiceFocus: [],
    gradeLevel: null,
    errorPatterns: {},
  };
}

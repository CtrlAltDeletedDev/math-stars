import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserProgress, SRSCard, BadgeEarned, SkillState } from '@/types';
import { buildInitialProgress, loadProgressResult, normalizeProgress, saveProgress, storageWorks } from './storage';
import { getLevelById } from '@/data/categories';
import { calculateStars, didPassLevel, updateStreak } from '@/engine/scoring';
import { GradeLevel, ceilingFor } from '@/data/grades';
import { Question } from '@/types';
import { newBadgesFor, newStickersFor } from '@/engine/rewards';
import { LevelUp, SessionAnswer, foldLevelAnswers, foldMixedAnswers, noteError } from '@/engine/foldAnswers';
import { SHOP_ITEMS } from '@/data/shop';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { todayString, yesterdayString } from '@/engine/dates';
import { recordSkillAnswer, newSkillState, LadderMove } from '@/engine/skillLadder';
import { pruneSRSCards } from '@/engine/srs';
import { isServableCard } from '@/engine/sessionBuilder';
import { updateSRSCard, createNewSRSCard } from '@/engine/srs';

interface ProgressContextValue {
  progress: UserProgress;
  isLoaded: boolean;
  recordLevelComplete: (
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    answers?: SessionAnswer[],
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; levelUps: LevelUp[] };
  recordDailyChallengeComplete: (
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    answers?: SessionAnswer[],
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; dcStreakBonus: number };
  recordMasterComplete: (
    /** The topic of a Master run, or 'review' for Practice Mistakes. */
    sourceId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    answers?: SessionAnswer[],
  ) => { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number };
  recordQuestionsAnswered: (count: number) => void;
  recordPracticeAnswer: (
    skillId: string | null,
    questionId: string,
    wasCorrect: boolean,
    servedRung?: number | null,
    picked?: { question: Question; chosen: string; ms?: number },
  ) => {
    move: LadderMove; skill: SkillState | null; starsAwarded: number;
    newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number;
  };
  selectCharacter: (characterId: string) => void;
  purchaseItem: (itemId: string) => boolean;
  setActiveTheme: (themeId: string) => void;
  toggleMusic: () => void;
  toggleChallengeMode: () => void;
  toggleSlowMode: () => void;
  toggleAutoRead: () => void;
  setPracticeFocus: (skillIds: string[]) => void;
  markLessonDone: (lessonId: string) => void;
  setGradeLevel: (grade: GradeLevel) => void;
  /** Non-null when saving is broken or a previous save could not be read. */
  storageIssue: StorageIssue;
  importProgress: (data: UserProgress) => boolean;
}

/**
 * Something the parent needs to know about persistence.
 *  - 'cannot-save'          nothing is being written (private browsing, quota)
 *  - 'unreadable'           a save existed but could not be parsed, and we could not back it up
 *  - 'unreadable-backed-up' ...and the original text was preserved for recovery
 */
export type StorageIssue = null | 'cannot-save' | 'unreadable' | 'unreadable-backed-up';

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(buildInitialProgress());
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageIssue, setStorageIssue] = useState<StorageIssue>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // A save we cannot read is NOT nothing. Starting from a blank profile and
    // saving over it on her next answer turns a recoverable glitch into every
    // star gone, with no signal that anything happened — so the raw text is
    // parked under a backup key and the Parent screen is told.
    const result = loadProgressResult();
    if (result.ok) {
      setProgress(result.progress);
      // Write the migrated shape straight back, so an older save on disk
      // converges to the current schema even if she never finishes a level
      // this session.
      if (!savePruned(result.progress)) setStorageIssue('cannot-save');
    } else if (result.reason === 'unreadable') {
      setStorageIssue(result.backedUp ? 'unreadable-backed-up' : 'unreadable');
    } else if (!storageWorks()) {
      // Private browsing, or a full disk: she can play, but nothing will stick.
      setStorageIssue('cannot-save');
    }
    setIsLoaded(true);
  }, []);

  // The most recent state, kept in a ref so a backgrounding tab can flush it
  // without waiting for a re-render.
  const pendingSave = useRef<UserProgress | null>(null);

  /**
   * Every write goes through the same prune.
   *
   * Only `flushSave` used to, so the startup rewrite and an import wrote the
   * card map unpruned -- and an imported profile carrying tens of thousands of
   * cards could blow the quota on its very first write, before anything had a
   * chance to trim it.
   */
  function savePruned(p: UserProgress): boolean {
    return saveProgress({ ...p, srsCards: pruneSRSCards(p.srsCards, undefined, isServableCard) });
  }

  function flushSave() {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    if (pendingSave.current) {
      const p = pendingSave.current;
      const ok = savePruned(p);
      if (!ok) setStorageIssue('cannot-save');
      pendingSave.current = null;
    }
  }

  function debouncedSave(p: UserProgress) {
    pendingSave.current = p;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 500);
  }

  // Finishing a level and immediately swiping the app away used to lose the whole
  // session: the 500ms timer never fired, and iOS suspends timers on background.
  // `pagehide` and a hidden `visibilitychange` are the two events that actually
  // arrive on iOS, so both force the write out.
  useEffect(() => {
    const onHide = () => flushSave();
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushSave(); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flushSave();
    };
  }, []);

  function recordLevelComplete(
    levelId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    /**
     * Every answer of the session, so level play feeds the adaptive ladder.
     * Without this, passing levels moved nothing the ladder could read and a
     * child could three-star a whole category yet still open Practice at rung 0.
     */
    answers: SessionAnswer[] = [],
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; levelUps: LevelUp[] } {
    const level = getLevelById(levelId);
    if (!level) return { newBadges: [], newStickers: [], streakBonus: 0, levelUps: [] };

    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    const passed = didPassLevel(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;
    let levelUps: LevelUp[] = [];

    setProgress((prev) => {
      let next = updateStreak(prev);
      const todayStr = todayString();
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = {
            ...next,
            spendableStars: next.spendableStars + streakBonus,
            totalStars: next.totalStars + streakBonus,
          };
        }
      }
      next = { ...next, consecutiveCorrect };

      // Created on first play rather than seeded up front: nothing reads this
      // map to decide what she may open, so an absent entry just means "not
      // played yet".
      const existingCat = next.categories[level.categoryId];
      const catProgress = existingCat
        ? { ...existingCat, levels: { ...existingCat.levels } }
        : { categoryId: level.categoryId, levels: {}, totalStarsEarned: 0 };

      const prevLevel = catProgress.levels[levelId] ?? {
        levelId,
        bestScore: 0,
        starsEarned: 0,
        totalAttempts: 0,
        lastPlayed: 0,
      };

      const newStarDelta = Math.max(0, stars - prevLevel.starsEarned);

      // Every merge is monotonic, so replaying a level she has already aced can
      // only ever leave her where she was — never take stars back.
      catProgress.levels[levelId] = {
        ...prevLevel,
        bestScore: Math.max(prevLevel.bestScore, score),
        starsEarned: Math.max(prevLevel.starsEarned, stars),
        totalAttempts: prevLevel.totalAttempts + 1,
        lastPlayed: Date.now(),
      };

      // No next-level unlocking: nothing is locked any more.

      catProgress.totalStarsEarned = (catProgress.totalStarsEarned ?? 0) + newStarDelta;

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) {
        updatedSRS[card.questionId] = card;
      }

      const folded = foldLevelAnswers(
        next.skills ?? {}, next.errorPatterns ?? {}, answers, levelId, next.gradeLevel,
      );
      levelUps = folded.levelUps;
      const levelUpStars = levelUps.length * GAME_CONFIG.levelUpBonusStars;

      next = {
        ...next,
        totalStars: next.totalStars + newStarDelta + levelUpStars,
        spendableStars: next.spendableStars + newStarDelta + levelUpStars,
        categories: { ...next.categories, [level.categoryId]: catProgress },
        srsCards: updatedSRS,
        skills: folded.skills,
        errorPatterns: folded.errorPatterns,
      };

      newBadges = newBadgesFor(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) {
        next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      }
      newStickers = newStickersFor(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) {
        next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };
      }

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus, levelUps };
  }

  function recordDailyChallengeComplete(
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    answers: SessionAnswer[] = [],
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number; dcStreakBonus: number } {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;
    // Assigned inside the updater, below the guard. Computing it here meant a
    // second run on the same day discarded the whole session with `return prev`
    // while still telling her "⭐ Daily bonus: +5 stars!".
    let dcStreakBonus = 0;

    setProgress((prev) => {
      const todayStr = todayString();
      if (prev.lastDailyChallengeDate === todayStr) return prev;
      dcStreakBonus = GAME_CONFIG.dailyChallengeBonus;

      let next = updateStreak(prev);
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = {
            ...next,
            spendableStars: next.spendableStars + streakBonus,
            totalStars: next.totalStars + streakBonus,
          };
        }
      }

      const yesterdayStr = yesterdayString();
      const dcStreak = prev.lastDailyChallengeDate === yesterdayStr
        ? prev.dailyChallengeStreak + 1
        : 1;

      next = {
        ...next,
        consecutiveCorrect,
        dailyChallengeStreak: dcStreak,
        lastDailyChallengeDate: todayStr,
        dailyChallengeHistory: [...(next.dailyChallengeHistory ?? []), todayStr],
        totalStars: next.totalStars + stars + dcStreakBonus,
        spendableStars: next.spendableStars + stars + dcStreakBonus,
      };

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) updatedSRS[card.questionId] = card;
      next = {
        ...next,
        srsCards: updatedSRS,
        ...foldMixedAnswers(next.skills ?? {}, next.errorPatterns ?? {}, answers, 'daily', next.gradeLevel),
      };

      newBadges = newBadgesFor(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      newStickers = newStickersFor(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus, dcStreakBonus };
  }

  function recordMasterComplete(
    sourceId: string,
    correctCount: number,
    totalCount: number,
    srsUpdates: SRSCard[],
    consecutiveCorrect: number,
    answers: SessionAnswer[] = [],
  ): { newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number } {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const stars = calculateStars(score);
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;

    setProgress((prev) => {
      let next = updateStreak(prev);
      const todayStr = todayString();
      const ph = next.playHistory ?? [];
      const isFirstPlayToday = !ph.includes(todayStr);
      if (isFirstPlayToday) {
        next = { ...next, playHistory: [...ph, todayStr] };
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next = {
            ...next,
            spendableStars: next.spendableStars + streakBonus,
            totalStars: next.totalStars + streakBonus,
          };
        }
      }
      next = {
        ...next,
        consecutiveCorrect,
        totalStars: next.totalStars + stars,
        spendableStars: next.spendableStars + stars,
      };

      const updatedSRS: Record<string, SRSCard> = { ...next.srsCards };
      for (const card of srsUpdates) updatedSRS[card.questionId] = card;
      next = {
        ...next,
        srsCards: updatedSRS,
        ...foldMixedAnswers(next.skills ?? {}, next.errorPatterns ?? {}, answers, sourceId, next.gradeLevel),
      };

      newBadges = newBadgesFor(prev, next, correctCount, totalCount);
      if (newBadges.length > 0) next = { ...next, earnedBadges: [...next.earnedBadges, ...newBadges] };
      newStickers = newStickersFor(prev, next, correctCount, totalCount);
      if (newStickers.length > 0) next = { ...next, earnedStickers: [...(next.earnedStickers ?? []), ...newStickers] };

      debouncedSave(next);
      return next;
    });

    return { newBadges, newStickers, streakBonus };
  }

  // One answer in endless practice: move her along the skill ladder, keep the
  // SRS card current, and hand back whether she just levelled up so the screen
  // can celebrate it.
  function recordPracticeAnswer(
    skillId: string | null,
    questionId: string,
    wasCorrect: boolean,
    /** The rung the queue served this from; null for an SRS review. */
    servedRung?: number | null,
    /**
     * The question and the option she picked, so a mistake can say what it
     * meant, and how long that first tap took.
     */
    picked?: { question: Question; chosen: string; ms?: number },
  ): {
    move: LadderMove; skill: SkillState | null; starsAwarded: number;
    newBadges: BadgeEarned[]; newStickers: string[]; streakBonus: number;
  } {
    let move: LadderMove = null;
    let skill: SkillState | null = null;
    let starsAwarded = 0;
    let newBadges: BadgeEarned[] = [];
    let newStickers: string[] = [];
    let streakBonus = 0;

    setProgress((prev) => {
      const answered = (prev.practiceQuestionsAnswered ?? 0) + 1;

      // A star every ten questions: enough to feel like progress, slow enough
      // that endless practice can't flood the shop.
      starsAwarded = answered % 10 === 0 ? 1 : 0;

      const skills = { ...(prev.skills ?? {}) };
      let errorPatterns = prev.errorPatterns ?? {};
      if (skillId) {
        const before = skills[skillId] ?? newSkillState(skillId);
        const result = recordSkillAnswer(
          before, wasCorrect, ceilingFor(skillId, prev.gradeLevel), servedRung, picked?.ms,
        );
        skills[skillId] = result.state;
        move = result.move;
        skill = result.state;
        // Climbing a rung is the progress the whole app is built around, so it
        // pays like a level does. A star every ten answers alone made Play — the
        // button Home puts first — the worst-paid way to learn anything.
        if (move === 'promoted') starsAwarded += GAME_CONFIG.levelUpBonusStars;
        if (!wasCorrect && picked) {
          errorPatterns = noteError(errorPatterns, skillId, picked.question, picked.chosen);
        }
      }

      const card = prev.srsCards[questionId] ?? createNewSRSCard(questionId);
      const next: UserProgress = {
        ...updateStreak(prev),
        skills,
        errorPatterns,
        practiceQuestionsAnswered: answered,
        srsCards: { ...prev.srsCards, [questionId]: updateSRSCard(card, wasCorrect) },
        consecutiveCorrect: wasCorrect ? prev.consecutiveCorrect + 1 : 0,
        totalStars: prev.totalStars + starsAwarded,
        spendableStars: prev.spendableStars + starsAwarded,
      };

      // First play of the day pays the streak bonus, whichever mode she opened.
      //
      // This used to only mark playHistory, while the bonus lived in
      // recordLevelComplete and was gated on that same field — so opening
      // Practice first cost her up to seven stars for pressing the "wrong"
      // button, and the reward for identical effort depended on entry order.
      const todayStr = todayString();
      const ph = next.playHistory ?? [];
      if (!ph.includes(todayStr)) {
        next.playHistory = [...ph, todayStr];
        if (next.currentStreak > 1) {
          streakBonus = Math.min(next.currentStreak, 7);
          next.spendableStars += streakBonus;
          next.totalStars += streakBonus;
        }
      }

      // Practice awarded no badges and no stickers at all, which is a strange
      // thing to say about the mode the whole adaptive ladder exists to serve:
      // a child could live in it for a thousand questions and the Badges screen
      // would still read 0.
      newBadges = newBadgesFor(prev, next, wasCorrect ? 1 : 0, 1);
      if (newBadges.length > 0) next.earnedBadges = [...next.earnedBadges, ...newBadges];
      newStickers = newStickersFor(prev, next, wasCorrect ? 1 : 0, 1);
      if (newStickers.length > 0) next.earnedStickers = [...(next.earnedStickers ?? []), ...newStickers];

      debouncedSave(next);
      return next;
    });

    return { move, skill, starsAwarded, newBadges, newStickers, streakBonus };
  }

  function recordQuestionsAnswered(count: number) {
    setProgress((prev) => {
      const todayStr = todayString();
      const wasAtGoal = prev.dailyQuestionsDate === todayStr && prev.dailyQuestionsCount >= GAME_CONFIG.dailyGoalQuestions;
      if (wasAtGoal) return prev;

      const prevCount = prev.dailyQuestionsDate === todayStr ? prev.dailyQuestionsCount : 0;
      const newCount = prevCount + count;
      const crossedGoal = !wasAtGoal && newCount >= GAME_CONFIG.dailyGoalQuestions;

      const next = {
        ...prev,
        dailyQuestionsDate: todayStr,
        dailyQuestionsCount: newCount,
        ...(crossedGoal ? {
          spendableStars: prev.spendableStars + GAME_CONFIG.dailyGoalBonus,
          totalStars: prev.totalStars + GAME_CONFIG.dailyGoalBonus,
        } : {}),
      };
      debouncedSave(next);
      return next;
    });
  }

  function selectCharacter(characterId: string) {
    setProgress((prev) => {
      const next = { ...prev, characterId };
      debouncedSave(next);
      return next;
    });
  }

  function purchaseItem(itemId: string): boolean {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;

    let success = false;
    setProgress((prev) => {
      if (prev.spendableStars < item.cost || prev.purchasedItems.includes(itemId)) return prev;
      const next = {
        ...prev,
        spendableStars: prev.spendableStars - item.cost,
        purchasedItems: [...prev.purchasedItems, itemId],
      };
      debouncedSave(next);
      success = true;
      return next;
    });
    return success;
  }

  function setActiveTheme(themeId: string) {
    setProgress((prev) => {
      const next = { ...prev, activeTheme: themeId };
      debouncedSave(next);
      return next;
    });
  }

  function toggleMusic() {
    setProgress((prev) => {
      const next = { ...prev, musicEnabled: !prev.musicEnabled };
      debouncedSave(next);
      return next;
    });
  }

  function toggleChallengeMode() {
    setProgress((prev) => {
      const next = { ...prev, challengeMode: !prev.challengeMode };
      debouncedSave(next);
      return next;
    });
  }

  function toggleSlowMode() {
    setProgress((prev) => {
      const next = { ...prev, slowMode: !prev.slowMode };
      debouncedSave(next);
      return next;
    });
  }

  function toggleAutoRead() {
    setProgress((prev) => {
      const next = { ...prev, autoReadEnabled: !prev.autoReadEnabled };
      debouncedSave(next);
      return next;
    });
  }

  /** Focus Mode: pin endless practice to a handful of skills. Empty clears it. */
  function setPracticeFocus(skillIds: string[]) {
    setProgress((prev) => {
      const next = { ...prev, practiceFocus: [...skillIds] };
      debouncedSave(next);
      return next;
    });
  }

  /** A lesson played to the end. Teaching only: no stars, no ladder, no SRS. */
  function markLessonDone(lessonId: string) {
    setProgress((prev) => {
      const next = { ...prev, lessonsDone: { ...(prev.lessonsDone ?? {}), [lessonId]: todayString() } };
      debouncedSave(next);
      return next;
    });
  }

  function importProgress(data: UserProgress): boolean {
    const normalized = normalizeProgress(data);
    if (!normalized) return false;
    // Drop any pending write first. A debounced save queued moments before the
    // import (toggling Slow Mode on this very screen is enough) would otherwise
    // fire afterwards and silently put the old profile back, while the UI said
    // "Progress imported successfully!".
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    pendingSave.current = null;
    setProgress(normalized);
    if (!savePruned(normalized)) setStorageIssue('cannot-save');
    return true;
  }

  /** Which grade she is working at. Sets the topics in scope and each ladder's ceiling. */
  function setGradeLevel(grade: GradeLevel) {
    setProgress((prev) => {
      const next = { ...prev, gradeLevel: grade };
      debouncedSave(next);
      return next;
    });
  }

  return (
    <ProgressContext.Provider value={{ progress, isLoaded, recordLevelComplete, recordDailyChallengeComplete, recordMasterComplete, recordQuestionsAnswered, recordPracticeAnswer, selectCharacter, purchaseItem, setActiveTheme, toggleMusic, toggleChallengeMode, toggleSlowMode, toggleAutoRead, setPracticeFocus, markLessonDone, setGradeLevel, storageIssue, importProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

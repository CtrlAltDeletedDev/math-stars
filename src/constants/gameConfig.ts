export const GAME_CONFIG = {
  sessionSize: 10,
  passThreshold: 0.8,
  starsForThree: 0.9,
  starsForTwo: 0.8,
  starsForOne: 0.6,
  feedbackDurationMs: 1200,
  maxStreakDisplay: 7,
  srsMaxIntervalDays: 7,
  srsInitialEase: 2.5,
  srsMinEase: 1.3,
  choiceCount: 4,
  answerButtonMinSize: 120,
  maxSRSPerSession: 5,
  dailyGoalQuestions: 20,
  dailyGoalBonus: 3,
  dailyChallengeBonus: 5,
  // localStorage has a hard quota; generated questions would otherwise mint
  // cards forever. Well above a year of daily play.
  maxSRSCards: 3000,
} as const;

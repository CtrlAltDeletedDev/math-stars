import { BadgeCheckContext } from './badges';

export interface StickerDef {
  id: string;
  emoji: string;
  name: string;
  unlockHint: string;
  check: (ctx: BadgeCheckContext & { playDays: number }) => boolean;
}

export const STICKERS: StickerDef[] = [
  // Starter
  { id: 'sk-sun',      emoji: '☀️', name: 'Sunny Day',      unlockHint: 'Play your first game',      check: (c) => c.totalLevelsCompleted >= 1 },
  { id: 'sk-star',     emoji: '⭐', name: 'Star Friend',    unlockHint: 'Earn 1 star',               check: (c) => c.totalStars >= 1 },
  { id: 'sk-heart',    emoji: '❤️', name: 'Love Learning',  unlockHint: 'Earn 3 stars',              check: (c) => c.totalStars >= 3 },
  // Animals
  { id: 'sk-cat',      emoji: '🐱', name: 'Curious Cat',    unlockHint: 'Earn 5 stars',              check: (c) => c.totalStars >= 5 },
  { id: 'sk-dog',      emoji: '🐶', name: 'Happy Pup',      unlockHint: 'Complete 2 levels',         check: (c) => c.totalLevelsCompleted >= 2 },
  { id: 'sk-bunny',    emoji: '🐰', name: 'Bouncy Bunny',   unlockHint: 'Earn 10 stars',             check: (c) => c.totalStars >= 10 },
  { id: 'sk-frog',     emoji: '🐸', name: 'Jumping Frog',   unlockHint: 'Complete 4 levels',         check: (c) => c.totalLevelsCompleted >= 4 },
  { id: 'sk-penguin',  emoji: '🐧', name: 'Cool Penguin',   unlockHint: 'Earn 15 stars',             check: (c) => c.totalStars >= 15 },
  { id: 'sk-fox',      emoji: '🦊', name: 'Clever Fox',     unlockHint: 'Complete 6 levels',         check: (c) => c.totalLevelsCompleted >= 6 },
  { id: 'sk-unicorn',  emoji: '🦄', name: 'Magic Unicorn',  unlockHint: 'Earn 25 stars',             check: (c) => c.totalStars >= 25 },
  { id: 'sk-owl',      emoji: '🦉', name: 'Wise Owl',       unlockHint: 'Complete 8 levels',         check: (c) => c.totalLevelsCompleted >= 8 },
  { id: 'sk-dragon',   emoji: '🐲', name: 'Brave Dragon',   unlockHint: 'Earn 40 stars',             check: (c) => c.totalStars >= 40 },
  // Food
  { id: 'sk-pizza',    emoji: '🍕', name: 'Pizza Party',    unlockHint: 'Play 2 days in a row',      check: (c) => c.currentStreak >= 2 },
  { id: 'sk-icecream', emoji: '🍦', name: 'Ice Cream!',     unlockHint: 'Get 8 correct in a row',    check: (c) => c.consecutiveCorrect >= 8 },
  { id: 'sk-cake',     emoji: '🎂', name: 'Birthday Cake',  unlockHint: 'Get a perfect score',       check: (c) => c.sessionTotal >= 5 && c.sessionCorrect === c.sessionTotal },
  { id: 'sk-candy',    emoji: '🍭', name: 'Sweet Candy',    unlockHint: 'Earn 20 stars',             check: (c) => c.totalStars >= 20 },
  { id: 'sk-cookie',   emoji: '🍪', name: 'Yummy Cookie',   unlockHint: 'Play 5 different days',     check: (c) => c.playDays >= 5 },
  // Space & nature
  { id: 'sk-moon',     emoji: '🌙', name: 'Night Moon',     unlockHint: 'Play 3 days in a row',      check: (c) => c.currentStreak >= 3 },
  { id: 'sk-rainbow',  emoji: '🌈', name: 'Rainbow',        unlockHint: 'Complete a whole category', check: (c) => c.categoriesCompleted >= 1 },
  { id: 'sk-rocket',   emoji: '🚀', name: 'Rocket Ship',    unlockHint: 'Complete 10 levels',        check: (c) => c.totalLevelsCompleted >= 10 },
  { id: 'sk-planet',   emoji: '🪐', name: 'Saturn',         unlockHint: 'Earn 50 stars',             check: (c) => c.totalStars >= 50 },
  { id: 'sk-comet',    emoji: '☄️', name: 'Shooting Star',  unlockHint: 'Play 7 days in a row',      check: (c) => c.currentStreak >= 7 },
  { id: 'sk-flower',   emoji: '🌸', name: 'Cherry Blossom', unlockHint: 'Play 10 different days',    check: (c) => c.playDays >= 10 },
  // Achievements
  { id: 'sk-trophy',   emoji: '🏆', name: 'Gold Trophy',    unlockHint: 'Complete 12 levels',        check: (c) => c.totalLevelsCompleted >= 12 },
  { id: 'sk-crown',    emoji: '👑', name: 'Royal Crown',    unlockHint: 'Earn 75 stars',             check: (c) => c.totalStars >= 75 },
  { id: 'sk-gem',      emoji: '💎', name: 'Diamond Gem',    unlockHint: 'Finish 5 whole categories', check: (c) => c.categoriesCompleted >= 5 },
  { id: 'sk-fireworks',emoji: '🎆', name: 'Fireworks',      unlockHint: 'Earn 100 stars',            check: (c) => c.totalStars >= 100 },
  { id: 'sk-wizard',   emoji: '🧙', name: 'Math Wizard',    unlockHint: 'Complete 20 levels',        check: (c) => c.totalLevelsCompleted >= 20 },
];

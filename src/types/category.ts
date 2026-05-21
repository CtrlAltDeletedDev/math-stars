export type CategoryId = 'addition' | 'counting' | 'shapes' | 'multiplication' | 'time';

export interface Level {
  id: string;
  categoryId: CategoryId;
  levelNumber: number;
  title: string;
  description: string;
  questionsPerSession: number;
  passThreshold: number;
  generatorParams?: Record<string, number | string>;
  questionBankIds?: string[];
}

export interface Category {
  id: CategoryId;
  title: string;
  emoji: string;
  bgColor: string;
  darkColor: string;
  levels: Level[];
}

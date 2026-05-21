export type QuestionType =
  | 'addition'
  | 'subtraction'
  | 'counting'
  | 'shape_identify'
  | 'pattern_complete'
  | 'skip_count'
  | 'number_compare'
  | 'number_order'
  | 'multiplication';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  promptEmoji?: string;
  correctAnswer: string;
  choices: string[];
  difficulty: number;
}

export interface QuestionResult {
  questionId: string;
  answeredCorrectly: boolean;
  responseTimeMs: number;
  timestamp: number;
}

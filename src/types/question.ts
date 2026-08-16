export type QuestionType =
  | 'addition'
  | 'subtraction'
  | 'counting'
  | 'shape_identify'
  | 'pattern_complete'
  | 'skip_count'
  | 'number_compare'
  | 'number_order'
  | 'multiplication'
  | 'word_problem'
  | 'tell_time'
  | 'measurement'
  | 'money'
  | 'place_value'
  | 'number_bond'
  | 'even_odd'
  | 'fact_family'
  | 'missing_number'
  | 'fraction';

/**
 * A drawn illustration for questions a picture explains better than words.
 * Rendered by the matching component in components/game/.
 */
export type QuestionVisual =
  | { kind: 'fraction'; numerator: number; denominator: number; shape: 'circle' | 'bar' }
  | { kind: 'fractionSet'; fractions: [number, number][] } // several, drawn to compare
  | { kind: 'coins'; coins: number[] } // cent values, e.g. [25, 10, 1]
  | { kind: 'clock'; hour: number; minute: number };

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  promptEmoji?: string;
  correctAnswer: string;
  choices: string[];
  difficulty: number;
  hint?: string;
  speakText?: string;
  visual?: QuestionVisual;
}

export interface QuestionResult {
  questionId: string;
  answeredCorrectly: boolean;
  responseTimeMs: number;
  timestamp: number;
}

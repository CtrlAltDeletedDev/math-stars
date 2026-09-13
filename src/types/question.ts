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
 * What a particular wrong answer would mean.
 *
 * The generators already choose distractors that are specific mistakes -- `a+b`
 * on a subtraction question is "added instead of subtracting", not noise. That
 * meaning was written down in comments and then thrown away the moment she
 * tapped one. These tags carry it as far as the parent screen, so "72%" can
 * become "8 of her last 10 subtraction mistakes were adding instead".
 *
 * Each one has to map to something a grown-up can actually do about it, which
 * is why the list is short and stays short.
 */
export type ErrorTag =
  /** Counted one too far or one short. */
  | 'off-by-one'
  /** Added when the sign said subtract, or the reverse. */
  | 'wrong-operation'
  /** Answered with a number the question had already shown her. */
  | 'answered-a-given-number'
  /** Gave the whole when asked for a part. */
  | 'answered-the-whole'
  /** Dropped or kept a ten -- 14 for 4, 7 for 17. */
  | 'place-value'
  /** Landed on the wrong multiple when counting in groups. */
  | 'wrong-multiple'
  /** Counted the objects instead of what they were worth, or the groups instead of what is in one. */
  | 'counted-the-wrong-thing'
  /** Gave the leftover instead of the part asked for. */
  | 'reversed'
  /** A near miss with no story behind it. Never inferred -- only ever assigned. */
  | 'unknown';

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
  /**
   * What each wrong option would mean, keyed by the option's own text.
   *
   * Keyed by value and not by index on purpose: every question passes through
   * `shuffleChoices` at least once between being built and being shown, so an
   * index would point at the wrong option by the time she taps it.
   */
  distractorMeaning?: Record<string, ErrorTag>;
}

export interface QuestionResult {
  questionId: string;
  answeredCorrectly: boolean;
  responseTimeMs: number;
  timestamp: number;
}

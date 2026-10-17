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
  /**
   * Added the two numbers in a story that was really asking for a missing part
   * or a difference ("14 balls, 6 are soccer balls, how many basketballs?" → 20).
   * Kept apart from 'wrong-operation' because there is no sign to misread: the
   * fix is modelling the story, not reading the symbol.
   */
  | 'added-story-numbers'
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
  | { kind: 'clock'; hour: number; minute: number }
  /**
   * A blank 0..max number line she can hop along, the way the class worksheet
   * says "show your work". Deliberately blank: marking the start would be fine,
   * but marking the hops would be the answer.
   */
  | { kind: 'numberLine'; max: number };

export interface Question {
  id: string;
  type: QuestionType;
  /**
   * The ladder this question practises, when its `type` would say another.
   *
   * Doubles and counting on are written as addition, and making ten as a
   * missing number — that is what they look like on screen, and the dot and
   * hop aids key off `type` — but Number Tricks serves them, and an answer to
   * one is evidence about Number Tricks. Routed by type alone, every one of
   * them was credited to Adding or Mystery Number and the Number Tricks levels
   * never moved their own ladder. `skillForQuestion` reads this first.
   */
  skill?: string;
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

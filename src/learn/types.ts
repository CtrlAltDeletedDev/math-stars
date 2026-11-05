// The course: what they are taught, as data.
//
// Every lesson is taught the way a good first-grade teacher teaches it:
//
//   warm-up    two or three things from earlier lessons (spaced review)
//   show       "I do": the guide says one short thing while a model moves --
//              counters filling a ten frame, hops on a number line, blocks
//              snapping into a ten
//   do         "we do": They move the model -- puts the counters in, makes the
//              hops, builds the number, sets the clock -- with a hint written
//              for the step they are on
//   practice   "you do": questions on their own, the picture fading
//   check      a few questions with no help; most right and the lesson's stone
//              fills. Otherwise it is simply today's lesson again tomorrow.
//
// Concrete, then pictures, then numbers: the same model they touch in "do"
// is the picture in "practice", and goes away in "check".
//
// Every word is spoken. Captions are a few words with the numbers in them, so a
// child who cannot read yet can follow by ear and still see the maths. Names
// are repeated, never a pronoun.

// --- Models ---------------------------------------------------------------
//
// A model is a manipulative: a state, drawn by one component that can also let
// their change it. A lesson is data because every model is drawn from its state.
// See src/learn/models/ for the components.

/** Who a counter belongs to: the first number (a), the second (b). */
export type CounterColour = 'a' | 'b';

export type ModelState =
  /**
   * One or two ten frames. `cells` is read top row left to right, then the
   * bottom row, then the second frame; null is empty. `crossed` marks cells
   * taken away. `tray` holds counters waiting below the frame: tapping an
   * empty cell (in "do") moves the next one in. Tapping a counter removes it
   * back to the tray, or crosses it out when `takeAway` is set. With no
   * `tray` the supply is endless and a removed counter vanishes, so a "move
   * 2 counters up" task sets `tray: { a: 0, b: 0 }` to be doable only by moving.
   */
  | { model: 'tenFrame'; frames: 1 | 2; cells: (CounterColour | null)[]; crossed?: number[]; tray?: { a: number; b: number }; takeAway?: boolean }
  /**
   * A number line from min to max. `start` is circled; `path` is every number
   * landed on, one hop at a time. In "do" they tap a start, then tap to hop.
   * `jumps` draws bigger hops (e.g. tens) as single arcs instead of ones.
   */
  | { model: 'numberLine'; min: number; max: number; start: number | null; path: number[]; jumps?: number }
  /**
   * Things to count, laid out in rows of five (or scattered). In "do" they tap
   * each one; it gets the next number. `counted` is the tap order.
   */
  | { model: 'objects'; emoji: string; count: number; counted: number[]; scattered?: boolean; crossed?: number[] }
  /**
   * A number bond / part-whole: the whole on top, two parts below. Null is the
   * missing one. In "do" with `counters`, they move counters between the two
   * parts (`split` is how many are in the left part).
   */
  | { model: 'bond'; whole: number | null; parts: [number | null, number | null]; counters?: boolean; split?: number }
  /** Two rows lined up to compare; `matched` draws the pairing lines and lights up the extras. */
  | { model: 'compare'; rows: [{ emoji: string; count: number }, { emoji: string; count: number }]; matched?: boolean }
  /**
   * Tens and ones: base-ten rods and unit cubes. In "do" they tap "+ten" /
   * "+one" and taps a piece to take it away; ten loose ones can be traded
   * for a rod when `canTrade`.
   */
  | { model: 'blocks'; tens: number; ones: number; maxTens?: number; canTrade?: boolean }
  /**
   * An analogue clock. In "do" they drag (or taps around) the hands;
   * `snapMinutes` is how finely the minute hand snaps (60 = o'clock only,
   * 30 = half past).
   */
  | { model: 'clock'; hour: number; minute: number; snapMinutes?: 60 | 30 | 15 | 5 }
  /**
   * Coins: `tray` is what they have put down (in cents per coin); `bank` is what
   * they can tap to add. `showTotal` writes the running total.
   */
  | { model: 'coins'; tray: number[]; bank?: number[]; showTotal?: boolean }
  /**
   * A shape cut into equal (or, to spot the difference, unequal) parts. In
   * "do" they tap parts to shade them. `cut` lets them choose the cuts instead.
   */
  | { model: 'fraction'; shape: 'circle' | 'rect'; parts: number; shaded: boolean[]; unequal?: boolean }
  /** 2-D and 3-D shapes to look at or sort. `picked` are the ones they have tapped. */
  | { model: 'shapes'; items: ShapeName[]; picked: number[] }
  /**
   * Measuring: an object `length` units long, and units laid end to end under
   * it. In "do" they tap to lay the next unit. `gaps` shows units laid badly
   * (with gaps or overlaps) to spot why that is wrong.
   */
  | { model: 'measure'; object: string; length: number; unit: string; placed: number; gaps?: boolean }
  /** A picture graph: one row per category, one picture per thing. In "do" they tap to add. */
  | { model: 'graph'; rows: { emoji: string; label: string; count: number }[]; max?: number }
  /** A big written thing for the guide to point at: "8 + 5 = 13", "=". */
  | { model: 'text'; text: string; tone?: 'plus' | 'minus' | 'plain' };

export type ShapeName =
  | 'circle' | 'triangle' | 'square' | 'rectangle' | 'hexagon' | 'trapezoid' | 'rhombus'
  | 'cube' | 'sphere' | 'cone' | 'cylinder' | 'rectangular prism';

export type ModelKind = ModelState['model'];

// --- Steps ----------------------------------------------------------------

/** "I do": the guide shows. Consecutive show steps on the same model animate from one state to the next. */
export interface ShowStep {
  type: 'show';
  say: string;
  caption?: string;
  model?: ModelState;
}

/**
 * "We do": they move the model until `goal` says it is right.
 *
 * `solution` is a state that meets the goal; the course tests check that the
 * goal is false at the start and true for the solution, so every task can be
 * done. `hint` is spoken when they ask, or after a while without progress; a
 * function gets the state they have made, so it can say what to fix.
 */
export interface DoStep {
  type: 'do';
  say: string;
  caption?: string;
  model: ModelState;
  goal: (s: ModelState) => boolean;
  solution: ModelState;
  hint: string | ((s: ModelState) => string);
  /** Said when they get there: why it worked. */
  then: string;
}

/** A single question they answer, inside the teaching steps (guided, with its hint). */
export interface AskStep {
  type: 'ask';
  item: Item;
}

export type TeachStep = ShowStep | DoStep | AskStep;

// --- Items (questions) ------------------------------------------------------

export interface Choice {
  /** What is checked against `answer`. */
  value: string;
  /**
   * What is shown: words, a number, an emoji. Spoken if `say` is absent.
   * Optional when `model` is set: a number on a picture choice ("which ten
   * frame shows 7?") would give the answer away.
   */
  label?: string;
  say?: string;
  /** A picture instead of (or with) the label. */
  model?: ModelState;
}

/**
 * One question. Numbers are typed on the number pad. Anything else is
 * answered by tapping one of a few big choices, or by doing something with a
 * model (set the clock, build the number).
 */
export interface Item {
  /** Stable for the same question, so review can bring it back. Facts use the fact ids (add-7+5). */
  id: string;
  /** Spoken. */
  say: string;
  /** Shown big: "8 + 5 = ?", "How many?", "Which is longer?". */
  prompt: string;
  answer: string;
  input: 'number' | { choices: Choice[] } | { model: ModelState; goal: (s: ModelState) => boolean; solution: ModelState };
  /**
   * Part of the question itself, always shown, even in the check: the clock
   * to read, the coins to count, the graph to answer from, the blocks whose
   * number they type. Never a hint.
   */
  figure?: ModelState;
  /** The picture: support for working it out (counters for a sum). Faded in practice, gone in "check". */
  picture?: ModelState;
  /** A strategy, never the answer. */
  hint?: string;
}

// --- Lessons and units ----------------------------------------------------

export interface Lesson {
  id: string;
  title: string;
  /** Parent words: what they will be able to do. */
  goal: string;
  /** The standard it teaches, e.g. "1.OA.6". */
  standard?: string;
  emoji: string;
  teach: TeachStep[];
  /** "You do": a fresh question each call. */
  practice: () => Item;
  /** How many practice questions. Default 6. */
  practiceCount?: number;
  /** The check: no pictures, no hints. Default is `practice`. */
  check?: () => Item;
  /** How many check questions. Default 4; pass with all but one right. */
  checkCount?: number;
  /** For spaced review later. Default is `check`, else `practice`. */
  review?: () => Item;
  /**
   * Counts as done for a child already past this stone on a plus/minus track,
   * so they are not re-taught "+1" when their path says they are on "within 10".
   * Only for lessons whose content is that stone's facts.
   */
  placedBy?: Placement | Placement[];
}

/** "They are past this stone on this track." A list means past all of them. */
export interface Placement {
  track: 'plus' | 'minus';
  stage: number;
}

export interface Unit {
  id: string;
  title: string;
  emoji: string;
  /** Parent words: what the unit is about. */
  about: string;
  colour: string;
  lessons: Lesson[];
}

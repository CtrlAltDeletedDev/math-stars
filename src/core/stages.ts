import { Question } from '@/types';
import {
  generateAdditionPattern, generateSubtractionPattern,
  generateTargetedAdditionQuestion, generateTargetedSubtractionQuestion,
  generateAdditionQuestion, generateSubtractionQuestion,
} from '@/engine/questionGenerator';

// The path.
//
// Two tracks, plus and minus, each a fixed sequence of named steps. This is the
// curriculum a parent can point at: "she's on 10+ for plus, counting back for
// minus". The steps are exactly the v7 adding / taking-away rungs, in the same
// order with the same labels, so a saved rung index *is* a stage index and
// migrating her needs no remap (core.test.ts holds the two lists together).
//
// Appending a stage is free. Inserting one moves every saved stage above it:
// write a migration in migrate.ts if you ever have to.

export type TrackId = 'plus' | 'minus';
export const TRACKS: readonly TrackId[] = ['plus', 'minus'];

export type Grade = 'K' | '1' | '2';

export interface Stage {
  /** Parent words, the same as the old rung label. */
  label: string;
  /**
   * What the stone on her path says. Numbers and symbols only, because she
   * cannot read the label. Shared by the same step on both tracks.
   */
  stone: string;
  /** One example, for the grown-ups screen: "10 + 4". */
  example: string;
  make: () => Question;
}

const add = (label: string, stone: string, example: string, make: () => Question): Stage => ({ label, stone, example, make });

export const STAGES: Record<TrackId, readonly Stage[]> = {
  plus: [
    add('Adding 1 more', '1', '7 + 1', () => generateTargetedAdditionQuestion(1, 20)),
    add('Adding 2 more', '2', '7 + 2', () => generateTargetedAdditionQuestion(2, 20)),
    add('Adding within 5', '5', '3 + 2', () => generateAdditionQuestion(5)),
    add('Counting on 1, 2 or 3', '3', '2 + 9', () => generateAdditionPattern('countOn')),
    add('Adding within 10', '10', '6 + 3', () => generateAdditionQuestion(10)),
    add('Ten and some more', '10+', '10 + 4', () => generateAdditionPattern('plusTen')),
    add('Doubles and near doubles', '6+6', '6 + 7', () => generateAdditionPattern('nearDoubles')),
    add('Adding 9 (one away from ten)', '9', '9 + 6', () => generateAdditionPattern('plusNine')),
    add('Making a ten to cross ten', '8+5', '8 + 5', () => generateAdditionPattern('bridge')),
    add('Adding within 20', '20', '7 + 6', () => generateAdditionQuestion(20)),
    add('Adding within 50', '50', '23 + 14', () => generateAdditionQuestion(50)),
    add('Adding within 100', '100', '46 + 38', () => generateAdditionQuestion(100)),
    add('Adding within 200', '200', '120 + 65', () => generateAdditionQuestion(200)),
  ],
  minus: [
    add('Taking away 1', '1', '8 − 1', () => generateTargetedSubtractionQuestion(1, 20)),
    add('Taking away 2', '2', '8 − 2', () => generateTargetedSubtractionQuestion(2, 20)),
    add('Subtracting within 5', '5', '5 − 3', () => generateSubtractionQuestion(5)),
    add('Counting back 1, 2 or 3', '3', '12 − 3', () => generateSubtractionPattern('countBack')),
    add('Subtracting within 10', '10', '9 − 4', () => generateSubtractionQuestion(10)),
    add('Taking away from teen numbers', '10+', '14 − 4', () => generateSubtractionPattern('teenMinusTen')),
    add('Taking away with doubles', '6+6', '12 − 6', () => generateSubtractionPattern('halves')),
    add('Taking away 9 and 8', '9', '15 − 9', () => generateSubtractionPattern('minusNine')),
    add('Going back through ten', '8+5', '13 − 5', () => generateSubtractionPattern('bridge')),
    add('Subtracting within 20', '20', '16 − 7', () => generateSubtractionQuestion(20)),
    add('Subtracting within 50', '50', '42 − 17', () => generateSubtractionQuestion(50)),
    add('Subtracting within 100', '100', '83 − 46', () => generateSubtractionQuestion(100)),
  ],
};

export function topStage(track: TrackId): number {
  return STAGES[track].length - 1;
}

/**
 * How far a grade's path goes. A soft edge: at the top she keeps practising,
 * and earning a promotion there twice tells the grown-ups she may be ready for
 * the next grade (`ceilingHits`). The same ceilings as the old grade bands.
 */
const CEILINGS: Record<Grade, Record<TrackId, number>> = {
  K: { plus: 4, minus: 4 }, // within 10
  '1': { plus: 9, minus: 9 }, // within 20
  '2': { plus: 12, minus: 11 }, // within 200 / within 100
};

export function ceilingFor(track: TrackId, grade: Grade): number {
  return Math.min(CEILINGS[grade][track], topStage(track));
}

/** The track a question's fact belongs to, from its id. */
export function trackOfFact(factId: string): TrackId | null {
  if (factId.startsWith('add-')) return 'plus';
  if (factId.startsWith('sub-')) return 'minus';
  return null;
}

import type { Lesson } from '../learn';
import { COUNTING_LESSONS } from './counting';
import { COUNTING_UP_LESSONS } from './countingUp';
import { COMPARING_LESSONS } from './comparing';
import { PLACE_VALUE_LESSONS } from './placeValue';
import { NUMBER_BOND_LESSONS } from './numberBonds';
import { EVEN_ODD_LESSONS } from './evenOdd';
import { CLOCK_LESSONS } from './clocks';
import { MEASURING_LESSONS } from './measuring';
import { SHAPE_LESSONS } from './shapes';
import { MONEY_LESSONS } from './money';
import { FRACTION_LESSONS } from './fractions';

// One file per topic, so each topic's lessons can be read, and written, on
// their own. The add & subtract unit's lessons, which came first, live in
// learn.ts itself.

export const TOPIC_LESSONS: Lesson[] = [
  ...COUNTING_LESSONS,
  ...COUNTING_UP_LESSONS,
  ...COMPARING_LESSONS,
  ...PLACE_VALUE_LESSONS,
  ...NUMBER_BOND_LESSONS,
  ...EVEN_ODD_LESSONS,
  ...CLOCK_LESSONS,
  ...MEASURING_LESSONS,
  ...SHAPE_LESSONS,
  ...MONEY_LESSONS,
  ...FRACTION_LESSONS,
];

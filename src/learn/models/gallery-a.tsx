import { GalleryEntry } from './gallery';
import { CounterColour } from '../types';

// Entries for TenFrame, NumberLine, Objects, Bond, Compare, Text: every model
// in the states lessons use, and each interaction once.

/** Cells for `n` 'a' counters then `m` 'b' counters, padded to `len`. */
function fill(n: number, m = 0, len = 10): (CounterColour | null)[] {
  return Array.from({ length: len }, (_, i) => (i < n ? 'a' : i < n + m ? 'b' : null));
}
const range = (from: number, to: number) => {
  const out: number[] = [];
  for (let n = from; from <= to ? n <= to : n >= to; n += from <= to ? 1 : -1) out.push(n);
  return out;
};

export const GALLERY_A: GalleryEntry[] = [
  // --- Ten frame
  { title: 'Ten frame · 7 is 5 and 2', state: { model: 'tenFrame', frames: 1, cells: fill(7) } },
  {
    title: 'Ten frame · 4 + 3: tap empty squares to bring counters in from the tray',
    state: { model: 'tenFrame', frames: 1, cells: fill(0), tray: { a: 4, b: 3 } },
    interactive: true,
  },
  {
    title: 'Ten frame · 7 − 3: tap counters to cross them out',
    state: { model: 'tenFrame', frames: 1, cells: fill(7), crossed: [6], takeAway: true },
    interactive: true,
  },
  { title: 'Ten frame · 9, 4 crossed out', state: { model: 'tenFrame', frames: 1, cells: fill(9), crossed: [5, 6, 7, 8] } },
  { title: 'Two ten frames · 8 + 5 makes a ten and 3', state: { model: 'tenFrame', frames: 2, cells: fill(8, 5, 20) } },
  {
    title: 'Two ten frames · no tray: endless counters, tap one to take it back',
    state: { model: 'tenFrame', frames: 2, cells: fill(10, 0, 20) },
    interactive: true,
  },

  // --- Number line
  { title: 'Number line · 8 + 3: start on 8, three hops forward', state: { model: 'numberLine', min: 0, max: 20, start: 8, path: [9, 10, 11] } },
  { title: 'Number line · 14 − 6: six hops back', state: { model: 'numberLine', min: 0, max: 20, start: 14, path: range(13, 8) } },
  {
    title: 'Number line · their turn: tap a start, then tap to hop',
    state: { model: 'numberLine', min: 0, max: 20, start: null, path: [] },
    interactive: true,
  },
  {
    title: 'Number line · start given (undo keeps it)',
    state: { model: 'numberLine', min: 0, max: 10, start: 5, path: [] },
    interactive: true,
  },
  {
    title: 'Number line · 0–100 by tens: 20 + 30',
    state: { model: 'numberLine', min: 0, max: 100, start: 20, path: [30, 40, 50], jumps: 10 },
    interactive: true,
  },
  { title: 'Number line · 0–100 by ones zooms to the hops', state: { model: 'numberLine', min: 0, max: 100, start: 47, path: [48, 49, 50, 51] } },

  // --- Objects
  {
    title: 'Objects · 7 in rows of five: tap each to count',
    state: { model: 'objects', emoji: '🍎', count: 7, counted: [] },
    interactive: true,
  },
  {
    title: 'Objects · 12 scattered, 4 counted',
    state: { model: 'objects', emoji: '⭐', count: 12, counted: [2, 0, 5, 7], scattered: true },
    interactive: true,
  },
  {
    title: 'Objects · 9 balloons, 3 flew away (crossed): count the rest',
    state: { model: 'objects', emoji: '🎈', count: 9, counted: [], crossed: [6, 7, 8] },
    interactive: true,
  },
  { title: 'Objects · 3 ducks', state: { model: 'objects', emoji: '🦆', count: 3, counted: [] } },
  { title: 'Objects · 20 scattered', state: { model: 'objects', emoji: '🐟', count: 20, counted: [], scattered: true } },

  // --- Bond
  { title: 'Bond · 10 is 6 and ?', state: { model: 'bond', whole: 10, parts: [6, null] } },
  { title: 'Bond · ? is 3 and 4', state: { model: 'bond', whole: null, parts: [3, 4] } },
  {
    title: 'Bond · 7 counters: tap a part to move one across',
    state: { model: 'bond', whole: 7, parts: [null, null], counters: true, split: 7 },
    interactive: true,
  },
  { title: 'Bond · 10 as 6 and 4, with counters', state: { model: 'bond', whole: 10, parts: [6, 4], counters: true, split: 6 } },

  // --- Compare
  {
    title: 'Compare · 5 dogs, 3 bones, matched',
    state: { model: 'compare', rows: [{ emoji: '🐶', count: 5 }, { emoji: '🦴', count: 3 }], matched: true },
  },
  {
    title: 'Compare · 4 and 7: tap to match them up',
    state: { model: 'compare', rows: [{ emoji: '🐱', count: 4 }, { emoji: '🐟', count: 7 }] },
    interactive: true,
  },
  {
    title: 'Compare · 6 and 6, the same',
    state: { model: 'compare', rows: [{ emoji: '🍓', count: 6 }, { emoji: '🍌', count: 6 }], matched: true },
  },

  // --- Text
  { title: 'Text · 8 + 5 = 13', state: { model: 'text', text: '8 + 5 = 13', tone: 'plus' } },
  { title: 'Text · 12 - 5 = 7 (hyphen drawn as a minus sign)', state: { model: 'text', text: '12 - 5 = 7', tone: 'minus' } },
  { title: 'Text · both signs', state: { model: 'text', text: '3 + 4 − 2 = 5' } },
  { title: 'Text · =', state: { model: 'text', text: '=', tone: 'plain' } },
  { title: 'Text · two lines', state: { model: 'text', text: '8 + 2 = 10\n10 + 3 = 13' } },
];

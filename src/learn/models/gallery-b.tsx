import { GalleryEntry } from './gallery';

// Entries for Blocks, Clock, Coins, Fraction, Shapes, Measure, Graph: every
// model, its key teaching states, and the ones they play with.
export const GALLERY_B: GalleryEntry[] = [
  // Blocks
  { title: 'Blocks · 3 tens 4 ones (34)', state: { model: 'blocks', tens: 3, ones: 4 } },
  { title: 'Blocks · 1 ten 12 ones, ready to trade', state: { model: 'blocks', tens: 1, ones: 12, canTrade: true } },
  { title: 'Blocks · build a number (up to 5 tens)', state: { model: 'blocks', tens: 0, ones: 0, maxTens: 5 }, interactive: true },
  { title: 'Blocks · trade ten ones for a ten', state: { model: 'blocks', tens: 1, ones: 9, canTrade: true, maxTens: 9 }, interactive: true },

  // Clock
  { title: "Clock · 3 o'clock", state: { model: 'clock', hour: 3, minute: 0, snapMinutes: 60 } },
  { title: 'Clock · half past 7', state: { model: 'clock', hour: 7, minute: 30, snapMinutes: 30 } },
  { title: 'Clock · 10:15', state: { model: 'clock', hour: 10, minute: 15, snapMinutes: 15 } },
  { title: "Clock · set o'clock (hour hand only)", state: { model: 'clock', hour: 12, minute: 0, snapMinutes: 60 }, interactive: true },
  { title: 'Clock · set half past', state: { model: 'clock', hour: 2, minute: 0, snapMinutes: 30 }, interactive: true },
  { title: 'Clock · five-minute clock', state: { model: 'clock', hour: 4, minute: 20, snapMinutes: 5 }, interactive: true },

  // Coins
  { title: 'Coins · penny, nickel, dime, quarter', state: { model: 'coins', tray: [1, 5, 10, 25] } },
  { title: 'Coins · count on: 2 dimes, a nickel, 3 pennies (total)', state: { model: 'coins', tray: [10, 10, 5, 1, 1, 1], showTotal: true } },
  { title: 'Coins · make 17¢ (bank, total)', state: { model: 'coins', tray: [], bank: [1, 5, 10, 25], showTotal: true }, interactive: true },
  { title: 'Coins · pennies and dimes only', state: { model: 'coins', tray: [10], bank: [10, 1] }, interactive: true },

  // Fraction
  { title: 'Fraction · a half shaded', state: { model: 'fraction', shape: 'circle', parts: 2, shaded: [true, false] } },
  { title: 'Fraction · fourths, 1 shaded', state: { model: 'fraction', shape: 'circle', parts: 4, shaded: [true, false, false, false] } },
  { title: 'Fraction · bar in fourths, 3 shaded', state: { model: 'fraction', shape: 'rect', parts: 4, shaded: [true, true, true, false] } },
  { title: 'Fraction · NOT halves (unequal)', state: { model: 'fraction', shape: 'circle', parts: 2, shaded: [false, false], unequal: true } },
  { title: 'Fraction · NOT fourths (unequal bar)', state: { model: 'fraction', shape: 'rect', parts: 4, shaded: [true, false, false, false], unequal: true } },
  { title: 'Fraction · shade a fourth', state: { model: 'fraction', shape: 'circle', parts: 4, shaded: [false, false, false, false] }, interactive: true },
  { title: 'Fraction · shade a half of the bar', state: { model: 'fraction', shape: 'rect', parts: 2, shaded: [false, false] }, interactive: true },

  // Shapes
  { title: 'Shapes · flat shapes', state: { model: 'shapes', items: ['circle', 'triangle', 'square', 'rectangle', 'hexagon', 'trapezoid', 'rhombus'], picked: [] } },
  { title: 'Shapes · solid shapes', state: { model: 'shapes', items: ['cube', 'sphere', 'cone', 'cylinder', 'rectangular prism'], picked: [] } },
  { title: 'Shapes · triangles picked', state: { model: 'shapes', items: ['triangle', 'square', 'triangle', 'circle'], picked: [0, 2] } },
  { title: 'Shapes · tap every shape with 4 sides', state: { model: 'shapes', items: ['square', 'triangle', 'rectangle', 'circle', 'trapezoid', 'hexagon'], picked: [] }, interactive: true },
  { title: 'Shapes · tap the ones that roll', state: { model: 'shapes', items: ['cube', 'sphere', 'cylinder', 'rectangular prism'], picked: [] }, interactive: true },

  // Measure
  { title: 'Measure · pencil, 5 cubes', state: { model: 'measure', object: '✏️', length: 5, unit: '🟩', placed: 5 } },
  { title: 'Measure · crayon, 3 paper clips', state: { model: 'measure', object: '🖍️', length: 3, unit: '📎', placed: 3 } },
  { title: 'Measure · gaps: why is this wrong?', state: { model: 'measure', object: '🎀', length: 6, unit: '🟦', placed: 5, gaps: true } },
  { title: 'Measure · caterpillar (lay the cubes)', state: { model: 'measure', object: '🐛', length: 4, unit: '🟧', placed: 0 }, interactive: true },
  { title: 'Measure · any emoji, stretched (paper clips)', state: { model: 'measure', object: '🥖', length: 4, unit: '📎', placed: 1 }, interactive: true },

  // Graph
  { title: 'Graph · favourite fruit', state: { model: 'graph', rows: [{ emoji: '🍎', label: 'apple', count: 4 }, { emoji: '🍌', label: 'banana', count: 2 }, { emoji: '🍇', label: 'grapes', count: 5 }], max: 6 } },
  { title: 'Graph · add the pets', state: { model: 'graph', rows: [{ emoji: '🐶', label: 'dog', count: 3 }, { emoji: '🐱', label: 'cat', count: 1 }, { emoji: '🐟', label: 'fish', count: 0 }], max: 6 }, interactive: true },
];

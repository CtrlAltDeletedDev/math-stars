import { Choice, Item, Lesson, ModelState, ShapeName, Unit } from '../types';
import { any, ask, choiceItem, doStep, mix, modelItem, numberItem, randomInt, shuffle, show } from './helpers-world';

// Unit: Shapes and halves.
//
// A shape is what its sides and corners make it, not its colour or size or
// which way up it sits. So shapes are named, then their sides and corners are
// counted, then she sorts by them. Solid shapes are met through things she
// knows (a ball, a can, a box). Then shapes are cut: equal parts first, and
// "not fair" when they are not, then halves and fourths, and that more equal
// parts means smaller parts.

type Shapes = Extract<ModelState, { model: 'shapes' }>;
type Fraction = Extract<ModelState, { model: 'fraction' }>;

export const FLAT: ShapeName[] = ['circle', 'triangle', 'square', 'rectangle', 'hexagon', 'trapezoid', 'rhombus'];
export const SOLID: ShapeName[] = ['cube', 'sphere', 'cone', 'cylinder', 'rectangular prism'];

/** Straight sides, and corners, of each flat shape. */
export const SIDES: Partial<Record<ShapeName, number>> = { circle: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6, trapezoid: 4, rhombus: 4 };

/** Four square corners. */
const SQUARE_CORNERS: ShapeName[] = ['square', 'rectangle'];

/** The shapes a child mixes each one up with, most likely first. */
const LOOKS_LIKE: Record<ShapeName, ShapeName[]> = {
  circle: ['hexagon', 'square', 'triangle'],
  triangle: ['trapezoid', 'rhombus', 'square'],
  square: ['rectangle', 'rhombus', 'trapezoid'],
  rectangle: ['square', 'trapezoid', 'rhombus'],
  hexagon: ['circle', 'trapezoid', 'rhombus'],
  trapezoid: ['triangle', 'rectangle', 'rhombus'],
  rhombus: ['square', 'trapezoid', 'rectangle'],
  cube: ['rectangular prism', 'cylinder', 'sphere'],
  sphere: ['cylinder', 'cone', 'cube'],
  cone: ['cylinder', 'sphere', 'cube'],
  cylinder: ['cone', 'sphere', 'rectangular prism'],
  'rectangular prism': ['cube', 'cylinder', 'cone'],
};

/** Things she knows, shaped like each solid. */
const LIKE: Record<string, { thing: string; emoji: string }> = {
  cube: { thing: 'a dice', emoji: '🎲' },
  sphere: { thing: 'a ball', emoji: '⚽' },
  cone: { thing: 'an ice cream cone', emoji: '🍦' },
  cylinder: { thing: 'a can', emoji: '🥫' },
  'rectangular prism': { thing: 'a box', emoji: '📦' },
};

export const shapes = (items: ShapeName[], picked: number[] = []): Shapes => ({ model: 'shapes', items, picked });

const indicesOf = (items: ShapeName[], ok: (s: ShapeName) => boolean) => items.flatMap((s, i) => (ok(s) ? [i] : []));
const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** A "tap all the …" step, with a hint that says what is missing or what does not belong. */
const pickStep = (items: ShapeName[], ok: (s: ShapeName) => boolean, what: string, say: string, then: string) => {
  const target = indicesOf(items, ok);
  return doStep({
    say,
    caption: what,
    model: shapes(items),
    solution: shapes(items, target),
    goal: (s) => sameSet(s.picked, target),
    hint: (s) => {
      const extra = s.picked.find((i) => !target.includes(i));
      if (extra !== undefined) return `The ${items[extra]} is not ${what}. Tap it again to put it back.`;
      return 'Look again at every shape. There are more to find.';
    },
    then,
  });
};

const nameChoice = (s: ShapeName): Choice => ({ value: s, label: s });
const nameIt = (pool: ShapeName[]) => (): Item => {
  const s = any(pool);
  return choiceItem({
    id: `shape-name-${s.replace(' ', '-')}`,
    say: 'What is this shape called?',
    prompt: 'What shape is this?',
    answer: nameChoice(s),
    wrong: LOOKS_LIKE[s].filter((w) => pool.includes(w)).concat(pool.filter((w) => w !== s)).map(nameChoice),
    figure: shapes([s]),
    hint: SOLID.includes(s) ? 'Think of something at home with this shape.' : 'Count its sides and corners. Are the sides straight?',
  });
};

// --- 1. Flat shapes -----------------------------------------------------------------------

const BASIC: ShapeName[] = ['circle', 'triangle', 'square', 'rectangle', 'hexagon'];

const flatShapes: Lesson = {
  id: 'shapes-flat',
  title: 'Flat shapes',
  goal: 'Name circles, triangles, squares, rectangles and hexagons, by their sides and corners.',
  standard: '1.G.1',
  emoji: '🔺',
  teach: [
    show('This is a triangle. A triangle has 3 straight sides and 3 corners.', 'triangle: 3 sides', shapes(['triangle'])),
    show('This is a square. 4 sides, all the same length, and 4 square corners.', 'square: 4 sides', shapes(['square'])),
    show('This is a rectangle. 4 sides and 4 square corners: 2 long sides and 2 short sides.', 'rectangle: 4 sides', shapes(['rectangle'])),
    show('This is a circle. A circle is round: no straight sides and no corners.', 'circle: 0 sides', shapes(['circle'])),
    show('This is a hexagon. A hexagon has 6 sides and 6 corners.', 'hexagon: 6 sides', shapes(['hexagon'])),
    pickStep(['circle', 'triangle', 'square', 'triangle', 'hexagon', 'rectangle'], (s) => s === 'triangle', 'a triangle',
      'Tap every triangle.', 'Both triangles: 3 sides and 3 corners each.'),
    pickStep(['square', 'hexagon', 'circle', 'rectangle', 'triangle', 'circle'], (s) => s === 'circle', 'a circle',
      'Tap every circle.', 'Circles are round, with no corners.'),
  ],
  practice: nameIt(BASIC),
};

// --- 2. Sides and corners ---------------------------------------------------------------------

function sidesItem(): Item {
  const s = any(FLAT);
  const corners = Math.random() < 0.5;
  return numberItem({
    id: `shape-${corners ? 'corners' : 'sides'}-${s}`,
    say: corners ? `How many corners does this ${s} have?` : `How many straight sides does this ${s} have?`,
    prompt: corners ? 'How many corners?' : 'How many sides?',
    answer: SIDES[s]!,
    figure: shapes([s]),
    hint: corners ? 'A corner is where two sides meet. Touch each one as you count.' : 'Touch each straight side as you count, all the way round.',
  });
}

const sidesAndCorners: Lesson = {
  id: 'shapes-sides-corners',
  title: 'Sides and corners',
  goal: 'Count the sides and corners of flat shapes, including trapezoids and rhombuses.',
  standard: '1.G.1',
  emoji: '📐',
  teach: [
    show('Count the sides of a triangle. Touch each straight side: 1, 2, 3.', '3 sides', shapes(['triangle'])),
    show('A corner is where two sides meet. 1, 2, 3 corners.', '3 corners', shapes(['triangle'])),
    show('This is a trapezoid. Count its sides: 4. And its corners: 4.', 'trapezoid: 4 sides', shapes(['trapezoid'])),
    show('This is a rhombus. 4 sides, all the same length, like a square that leans over.', 'rhombus: 4 sides', shapes(['rhombus'])),
    show('A shape has as many corners as it has sides. A hexagon: 6 and 6.', 'hexagon: 6 and 6', shapes(['hexagon'])),
    pickStep(['triangle', 'square', 'hexagon', 'trapezoid', 'circle', 'rhombus'], (s) => SIDES[s] === 4, 'a shape with 4 sides',
      'Tap every shape that has 4 sides.', 'Square, trapezoid and rhombus: different shapes, but all with 4 sides.'),
    pickStep(['rectangle', 'triangle', 'hexagon', 'circle', 'trapezoid', 'triangle'], (s) => SIDES[s] === 6, 'a shape with 6 corners',
      'Tap the shape with 6 corners.', 'The hexagon has 6 corners.'),
  ],
  practice: sidesItem,
};

// --- 3. Sorting by sides --------------------------------------------------------------------------

const RULES: { what: string; ok: (s: ShapeName) => boolean; id: string }[] = [
  { id: '3-sides', what: 'with 3 sides', ok: (s) => SIDES[s] === 3 },
  { id: '4-sides', what: 'with 4 sides', ok: (s) => SIDES[s] === 4 },
  { id: 'no-corners', what: 'with no corners', ok: (s) => SIDES[s] === 0 },
  { id: 'square-corners', what: 'with 4 square corners', ok: (s) => SQUARE_CORNERS.includes(s) },
  { id: '6-sides', what: 'with 6 sides', ok: (s) => SIDES[s] === 6 },
];

function sortItem(): Item {
  const rule = any(RULES);
  for (;;) {
    const items = Array.from({ length: 6 }, () => any(FLAT));
    const target = indicesOf(items, rule.ok);
    if (target.length === 0 || target.length === items.length) continue;
    return modelItem({
      id: `shape-sort-${rule.id}-${items.map((s) => FLAT.indexOf(s)).join('')}`,
      say: `Tap all the shapes ${rule.what}.`,
      prompt: `Tap all ${rule.what}`,
      answer: target.join(','),
      model: shapes(items),
      solution: shapes(items, target),
      goal: (s) => sameSet(s.picked, target),
      hint: 'Check every shape, one at a time. Count its sides and corners.',
    });
  }
}

const sorting: Lesson = {
  id: 'shapes-sort',
  title: 'Sort by sides',
  goal: 'Sort shapes by their sides and corners, whatever their size or colour.',
  standard: '1.G.1',
  emoji: '🗂️',
  teach: [
    show('Here are some shapes. Let\'s sort them by their sides.', 'sort by sides', shapes(['triangle', 'square', 'rectangle', 'triangle', 'hexagon'])),
    show('These two have 3 sides each. Any shape with 3 straight sides is a triangle.', '3 sides: triangles', shapes(['triangle', 'square', 'rectangle', 'triangle', 'hexagon'], [0, 3])),
    show('These have 4 sides and 4 square corners: a square and a rectangle.', '4 square corners', shapes(['triangle', 'square', 'rectangle', 'triangle', 'hexagon'], [1, 2])),
    show('Big or small, red or blue, turned any way: the sides and corners tell you the shape.', 'sides and corners', shapes(['triangle', 'square', 'rectangle', 'triangle', 'hexagon'])),
    pickStep(['triangle', 'rectangle', 'triangle', 'circle', 'hexagon', 'triangle'], (s) => SIDES[s] === 3, 'a shape with 3 sides',
      'Tap all the shapes with 3 sides.', 'Three triangles, each with 3 sides.'),
    pickStep(['square', 'circle', 'trapezoid', 'circle', 'rhombus', 'rectangle'], (s) => SIDES[s] === 0, 'a shape with no corners',
      'Tap all the shapes with no corners.', 'Circles have no corners at all.'),
    pickStep(['rhombus', 'square', 'trapezoid', 'rectangle', 'hexagon', 'square'], (s) => SQUARE_CORNERS.includes(s), 'a shape with 4 square corners',
      'Tap all the shapes with 4 square corners, like the corner of a page.', 'Squares and rectangles. The rhombus and trapezoid have 4 corners, but not square ones.'),
  ],
  practice: sortItem,
};

// --- 4. Solid shapes ----------------------------------------------------------------------------------

/** "Which shape is like a can?" -- the choices are shapes. */
function likeItem(): Item {
  const s = any(SOLID);
  const c = (x: ShapeName): Choice => ({ value: x, label: x, model: shapes([x]) });
  return choiceItem({
    id: `shape-like-${s.replace(' ', '-')}`,
    say: `Which shape is like ${LIKE[s].thing}?`,
    prompt: `Which shape is like ${LIKE[s].emoji}?`,
    answer: c(s),
    wrong: LOOKS_LIKE[s].map(c),
    hint: 'Think about its faces: flat or round? Does it have a point?',
  });
}

const solids: Lesson = {
  id: 'shapes-solid',
  title: 'Solid shapes',
  goal: 'Name cubes, spheres, cones, cylinders and rectangular prisms, and match them to things she knows.',
  standard: '1.G.1',
  emoji: '🧊',
  teach: [
    show('Solid shapes can be picked up. This is a cube, like a dice. Its 6 faces are all squares.', 'cube 🎲', shapes(['cube'])),
    show('This is a sphere, round all over, like a ball.', 'sphere ⚽', shapes(['sphere'])),
    show('This is a cylinder, like a can. A flat circle at each end, round in between.', 'cylinder 🥫', shapes(['cylinder'])),
    show('This is a cone, like an ice cream cone: a flat circle at one end, a point at the other.', 'cone 🍦', shapes(['cone'])),
    show('This is a rectangular prism, like a box. Its flat faces are rectangles.', 'rectangular prism 📦', shapes(['rectangular prism'])),
    pickStep(['cube', 'sphere', 'cone', 'cylinder', 'rectangular prism', 'sphere'], (s) => ['sphere', 'cone', 'cylinder'].includes(s), 'a shape that can roll',
      'Tap every shape that can roll.', 'Spheres, cylinders and cones have a curved side, so they roll. Cubes and boxes slide.'),
    pickStep(['rectangular prism', 'cube', 'cylinder', 'cube', 'cone', 'sphere'], (s) => s === 'cube', 'a cube',
      'Tap every cube.', 'Two cubes: every face is a square.'),
  ],
  practice: mix([1, likeItem], [1, nameIt(SOLID)]),
};

// --- 5. Halves --------------------------------------------------------------------------------------

export const fraction = (shape: 'circle' | 'rect', parts: number, shadedCount = 0, unequal = false): Fraction =>
  ({ model: 'fraction', shape, parts, shaded: Array.from({ length: parts }, (_, i) => i < shadedCount), ...(unequal ? { unequal } : {}) });

export const shadedOf = (f: Fraction) => f.shaded.filter(Boolean).length;

const cutChoice = (value: string, f: Fraction, say: string): Choice => ({ value, label: '', say, model: f });

/** Which is cut into halves? Two unequal parts, fourths and thirds are the near misses. */
function whichHalves(): Item {
  const shape = any(['circle', 'rect'] as const);
  return choiceItem({
    id: `fraction-halves-${shape}`,
    say: 'Which one is cut into halves?',
    prompt: 'Which shows halves?',
    answer: cutChoice('2-equal', fraction(shape, 2), '2 equal parts'),
    wrong: [
      cutChoice('2-unequal', fraction(shape, 2, 0, true), '2 parts that are not equal'),
      cutChoice('4-equal', fraction(shape, 4), '4 equal parts'),
      cutChoice('3-equal', fraction(shape, 3), '3 equal parts'),
    ],
    hint: 'Halves are 2 parts, and the 2 parts must be the same size.',
  });
}

/** Which shows one half shaded? A fourth, an unequal half and the whole are the near misses. */
function whichOneHalf(): Item {
  const shape = any(['circle', 'rect'] as const);
  return choiceItem({
    id: `fraction-one-half-${shape}`,
    say: 'Which one has one half shaded?',
    prompt: 'Which shows one half?',
    answer: cutChoice('half', fraction(shape, 2, 1), 'one of 2 equal parts'),
    wrong: [
      cutChoice('unequal', fraction(shape, 2, 1, true), 'one of 2 parts that are not equal'),
      cutChoice('fourth', fraction(shape, 4, 1), 'one of 4 equal parts'),
      cutChoice('whole', fraction(shape, 2, 2), 'both parts'),
    ],
    hint: 'One half is one of 2 equal parts.',
  });
}

const shadeStep = (f: Fraction, want: number, say: string, caption: string, then: string) => doStep({
  say,
  caption,
  model: f,
  solution: { ...f, shaded: f.shaded.map((_, i) => i < want) },
  goal: (s) => s.parts === f.parts && shadedOf(s) === want,
  hint: (s) => (shadedOf(s) < want ? 'Tap a part to shade it.' : 'Too many parts shaded. Tap one to unshade it.'),
  then,
});

const halves: Lesson = {
  id: 'shapes-halves',
  title: 'Halves',
  goal: 'Tell equal parts from unequal parts, and shade one half of a shape.',
  standard: '1.G.3',
  emoji: '🍕',
  teach: [
    show('This pizza is cut into 2 pieces. But one piece is much bigger! That is not fair.', '2 parts, not equal', fraction('circle', 2, 0, true)),
    show('Now the 2 pieces are the same size. They are equal parts. That is fair.', '2 equal parts', fraction('circle', 2)),
    show('When a shape is cut into 2 equal parts, each part is called a half.', 'halves', fraction('circle', 2)),
    show('One part is shaded. That is one half. The 2 halves together make the whole pizza.', 'one half', fraction('circle', 2, 1)),
    shadeStep(fraction('circle', 2), 1, 'Shade one half of this circle.', 'one half',
      '1 of 2 equal parts: one half.'),
    shadeStep(fraction('rect', 4), 2, 'This one is cut into 4 equal parts. Shade half of it.', 'half of 4 parts',
      '2 of the 4 parts is half the rectangle.'),
    ask(whichHalves()),
  ],
  practice: mix([1, whichHalves], [1, whichOneHalf]),
};

// --- 6. Fourths ---------------------------------------------------------------------------------------

const PART_NAMES: Record<string, Choice> = {
  half: { value: 'one half', label: 'one half' },
  fourth: { value: 'one fourth', label: 'one fourth' },
  whole: { value: 'the whole', label: 'the whole' },
};

function whatPart(): Item {
  const shape = any(['circle', 'rect'] as const);
  const [kind, f] = any([
    ['fourth', fraction(shape, 4, 1)],
    ['half', fraction(shape, 2, 1)],
    ['whole', fraction(shape, 4, 4)],
    ['whole', fraction(shape, 2, 2)],
  ] as const);
  return choiceItem({
    id: `fraction-part-${shape}-${f.parts}-${shadedOf(f)}`,
    say: 'How much of the shape is shaded?',
    prompt: 'How much is shaded?',
    answer: PART_NAMES[kind],
    wrong: Object.keys(PART_NAMES).filter((k) => k !== kind).map((k) => PART_NAMES[k]),
    figure: f,
    hint: 'Count the equal parts. 2 parts are halves; 4 parts are fourths.',
  });
}

/** One half or one fourth of the same pizza: which piece is bigger? "4 is more than 2" is the trap. */
function biggerPiece(): Item {
  const bigger = Math.random() < 0.6;
  return choiceItem({
    id: `fraction-${bigger ? 'bigger' : 'smaller'}-piece`,
    say: bigger ? 'Two pizzas the same size. Which piece is bigger: one half, or one fourth?' : 'Two pizzas the same size. Which piece is smaller: one half, or one fourth?',
    prompt: bigger ? 'Which piece is bigger?' : 'Which piece is smaller?',
    answer: bigger ? { ...PART_NAMES.half, model: fraction('circle', 2, 1) } : { ...PART_NAMES.fourth, model: fraction('circle', 4, 1) },
    wrong: shuffle([
      bigger ? { ...PART_NAMES.fourth, model: fraction('circle', 4, 1) } : { ...PART_NAMES.half, model: fraction('circle', 2, 1) },
      { value: 'the same', label: 'the same' },
    ]),
    hint: 'More equal parts means each part is smaller.',
  });
}

const fourths: Lesson = {
  id: 'shapes-fourths',
  title: 'Fourths',
  goal: 'Shade fourths, and see that more equal parts make smaller parts.',
  standard: '1.G.3',
  emoji: '🥧',
  teach: [
    show('This square is cut into 4 equal parts. Each part is called a fourth, or a quarter.', '4 equal parts: fourths', fraction('rect', 4)),
    show('One part is shaded. That is one fourth.', 'one fourth', fraction('rect', 4, 1)),
    show('All 4 fourths together make the whole square.', '4 fourths = the whole', fraction('rect', 4, 4)),
    show('Here is a pizza cut in half. One half is shaded.', 'one half', fraction('circle', 2, 1)),
    show('The same pizza cut into fourths. One fourth is smaller than one half. More parts, smaller parts!', 'one fourth', fraction('circle', 4, 1)),
    shadeStep(fraction('circle', 4), 1, 'Shade one fourth of this circle.', 'one fourth',
      '1 of 4 equal parts: one fourth.'),
    shadeStep(fraction('rect', 4), 4, 'Shade the whole rectangle, all 4 fourths.', '4 fourths',
      '4 fourths make one whole.'),
  ],
  // Both are three buttons, so each button's share of right answers stays even.
  practice: mix([3, whatPart], [1, biggerPiece]),
};

export const UNIT: Unit = {
  id: 'shapes',
  title: 'Shapes and halves',
  emoji: '🔷',
  about: 'Naming flat and solid shapes, sorting them by sides and corners, and cutting shapes into equal halves and fourths.',
  colour: '#D81B60',
  lessons: [flatShapes, sidesAndCorners, sorting, solids, halves, fourths],
};

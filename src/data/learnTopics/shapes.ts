import type { Lesson } from '../learn';

// Shapes & Patterns lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// Two ideas, the way kindergarten and first grade teach them. Shapes: a shape
// is named by how many straight sides it has, so count them, one finger going
// all the way round and stopping where it started (a corner is where 2 sides
// meet); turning a shape does not change its name. Patterns: find the part
// that repeats, say it out loud, and the next thing is whatever comes next in
// that part; in second grade the numbers in a pattern grow by the same jump
// each time. The tries ask what play asks ("How many sides does a hexagon
// have?", "A stop sign is what shape?", "What comes next?"), and their wrong
// buttons are the ones play offers next to them.
//
// No `helpsWith` in this file: this topic's questions carry no mistake tags, so
// there is no mistake for a lesson to be the answer to. Play still offers these
// on a demotion, nearest rung first.

const SIDES_AND_CORNERS: Lesson = {
  id: 'sides-and-corners',
  title: 'Sides and Corners',
  emoji: '🔺',
  places: [{ skillId: 'shapes', rung: 0 }],
  practiceLevelId: 'shapes-1',
  steps: [
    {
      kind: 'watch',
      say: "This is a triangle. Let's count its sides. A side is a straight line. 1, 2, 3. A triangle has 3 sides.",
      caption: 'A triangle has 3 sides',
      scene: { kind: 'shape', shape: 'triangle', mark: 'sides' },
    },
    {
      kind: 'watch',
      say: 'A corner is the point where 2 sides meet. Count the corners. 1, 2, 3. A triangle has 3 corners, too.',
      caption: '3 corners',
      scene: { kind: 'shape', shape: 'triangle', mark: 'corners' },
    },
    {
      kind: 'watch',
      say: 'This is a rectangle. Put your finger on the top side, and go all the way round. 1, 2, 3, 4. Stop when you get back to the start. A rectangle has 4 sides: 2 long ones and 2 short ones.',
      caption: 'A rectangle has 4 sides',
      scene: { kind: 'shape', shape: 'rectangle', mark: 'sides' },
    },
    {
      kind: 'try',
      say: 'Your turn! This is a square. How many sides does a square have? Count them all the way round.',
      caption: 'How many sides?',
      scene: { kind: 'shape', shape: 'square' },
      choices: ['4', '3', '5'],
      answer: '4',
      hints: {
        '3': 'Did you miss one? Start on the top side and go all the way round: top, side, bottom, side.',
        '5': 'Did you count the top side again when you got back to it? Stop when you get back to where you started.',
      },
      then: {
        say: 'Yes! 1, 2, 3, 4. A square has 4 sides, and they are all the same length.',
        caption: 'A square has 4 sides',
        scene: { kind: 'shape', shape: 'square', mark: 'sides' },
      },
    },
    {
      kind: 'try',
      say: 'Which shape has 3 sides? A triangle, a square, or a circle?',
      caption: 'Which has 3 sides?',
      scene: { kind: 'big', text: '🔺  🟦  🔵' },
      choices: ['🔺 Triangle', '🟦 Square', '🔵 Circle'],
      answer: '🔺 Triangle',
      hints: {
        '🟦 Square': 'Count the sides of a square: 1, 2, 3, 4. That is 1 too many.',
        '🔵 Circle': 'A circle is round. It has no straight sides at all.',
      },
      then: {
        say: 'Yes! 1, 2, 3. A shape with 3 sides is a triangle.',
        caption: 'A triangle has 3 sides',
        scene: { kind: 'shape', shape: 'triangle', mark: 'sides' },
      },
    },
    {
      kind: 'try',
      say: 'This one is tricky. How many corners does a circle have?',
      caption: 'How many corners?',
      scene: { kind: 'shape', shape: 'circle' },
      choices: ['0', '1', '4'],
      answer: '0',
      hints: {
        '1': 'Did you count the whole round edge as 1? A corner is where 2 straight sides meet, and a circle has no straight sides.',
        '4': 'A circle is not a square! Run your finger round it. It never turns a corner.',
      },
      then: {
        say: 'Yes! A circle is round all the way. It has no sides and no corners. 0 corners.',
        caption: 'A circle has 0 corners',
        scene: { kind: 'shape', shape: 'circle', mark: 'corners' },
      },
    },
  ],
};

const WHAT_COMES_NEXT: Lesson = {
  id: 'what-comes-next',
  title: 'What Comes Next?',
  emoji: '🔁',
  places: [{ skillId: 'shapes', rung: 0 }],
  // Shapes' rung 0 level is shapes only; this is the first level of patterns.
  practiceLevelId: 'patterns-1',
  steps: [
    {
      kind: 'watch',
      say: 'This is a pattern. Say it with me. Red, blue, red, blue, red, blue.',
      caption: 'Red, blue, red, blue…',
      scene: { kind: 'pattern', items: ['🔴', '🔵', '🔴', '🔵', '🔴', '🔵'] },
    },
    {
      kind: 'watch',
      say: 'A pattern has a part that repeats. Here, it is red, blue. Then red, blue again. And again!',
      caption: 'The part that repeats',
      scene: { kind: 'pattern', items: ['🔴', '🔵', '🔴', '🔵', '🔴', '🔵'], unit: 2 },
    },
    {
      kind: 'try',
      say: 'Your turn! What comes next? Say the pattern out loud. Red, blue, red, blue, red, and then?',
      caption: 'What comes next?',
      scene: { kind: 'pattern', items: ['🔴', '🔵', '🔴', '🔵', '🔴'], unit: 2, blank: true },
      choices: ['🔵', '🔴', '🟡'],
      answer: '🔵',
      hints: {
        '🔴': 'Red is the one we just had. In this pattern, red is always followed by blue.',
        '🟡': 'Yellow is not in this pattern at all. The part that repeats is red, blue.',
      },
      then: {
        say: 'Yes! Red, blue. Red, blue. Red, blue! Blue finishes the last part.',
        caption: 'Red, blue!',
        scene: { kind: 'pattern', items: ['🔴', '🔵', '🔴', '🔵', '🔴', '🔵'], unit: 2 },
      },
    },
    {
      kind: 'watch',
      say: 'The part that repeats can be longer. Frog, frog, lion. Frog, frog, lion. Here the part that repeats has 3 things in it.',
      caption: 'Frog, frog, lion',
      scene: { kind: 'pattern', items: ['🐸', '🐸', '🦁', '🐸', '🐸', '🦁'], unit: 3 },
    },
    {
      kind: 'try',
      say: 'Now you find the part that repeats. Say it out loud. Rain, sun, sun. What comes next?',
      caption: 'What comes next?',
      scene: { kind: 'pattern', items: ['🌧️', '☀️', '☀️', '🌧️', '☀️', '☀️'], blank: true },
      choices: ['🌧️', '☀️', '🌈'],
      answer: '🌧️',
      hints: {
        '☀️': 'Did you say sun because sun came last? The part that repeats is rain, sun, sun, and it is finished. So it starts again.',
        '🌈': 'A rainbow is not in this pattern at all. The part that repeats is rain, sun, sun.',
      },
      then: {
        say: 'Yes! Rain, sun, sun. Rain, sun, sun. When the part is finished, it starts again with rain!',
        caption: 'Rain, sun, sun, rain…',
        scene: { kind: 'pattern', items: ['🌧️', '☀️', '☀️', '🌧️', '☀️', '☀️', '🌧️'], unit: 3 },
      },
    },
  ],
};

const NAMED_BY_SIDES: Lesson = {
  id: 'named-by-sides',
  title: 'Shapes With More Sides',
  emoji: '🛑',
  places: [{ skillId: 'shapes', rung: 1 }],
  practiceLevelId: 'shapes-2',
  steps: [
    {
      kind: 'watch',
      say: 'A shape gets its name from how many sides it has. Count the sides of this one. 1, 2, 3, 4, 5. A shape with 5 sides is a pentagon.',
      caption: '5 sides: pentagon',
      scene: { kind: 'shape', shape: 'pentagon', mark: 'sides' },
    },
    {
      kind: 'watch',
      say: 'Count this one. 1, 2, 3, 4, 5, 6. A shape with 6 sides is a hexagon. A honeycomb is full of hexagons!',
      caption: '6 sides: hexagon',
      scene: { kind: 'shape', shape: 'hexagon', mark: 'sides' },
    },
    {
      kind: 'watch',
      say: 'Here is a shape you see on the street. A stop sign! Count its sides. 1, 2, 3, 4, 5, 6, 7, 8. A shape with 8 sides is an octagon.',
      caption: '8 sides: octagon',
      scene: { kind: 'shape', shape: 'octagon', mark: 'sides' },
    },
    {
      kind: 'try',
      say: 'Your turn! How many sides does a pentagon have? Count them all the way round.',
      caption: 'How many sides?',
      scene: { kind: 'shape', shape: 'pentagon' },
      choices: ['5', '4', '6'],
      answer: '5',
      hints: {
        '4': 'Did you miss a side? Start on one side and go all the way round, back to where you started.',
        '6': 'Did you count the first side again at the end? Stop when you get back to where you started.',
      },
      then: {
        say: 'Yes! 1, 2, 3, 4, 5. A pentagon has 5 sides.',
        caption: 'A pentagon has 5 sides',
        scene: { kind: 'shape', shape: 'pentagon', mark: 'sides' },
      },
    },
    {
      kind: 'try',
      say: 'A stop sign is this shape. What is it called? Is it a hexagon, an octagon, or a circle?',
      caption: 'A stop sign is what shape?',
      scene: { kind: 'shape', shape: 'octagon' },
      choices: ['Octagon', 'Hexagon', 'Circle'],
      answer: 'Octagon',
      hints: {
        Hexagon: 'A hexagon has 6 sides. Count the sides of the stop sign. It has more than 6.',
        Circle: 'A circle is round, with no sides and no corners. A stop sign has straight sides and corners.',
      },
      then: {
        say: 'Yes! 1, 2, 3, 4, 5, 6, 7, 8. It has 8 sides, so it is an octagon.',
        caption: '8 sides: octagon',
        scene: { kind: 'shape', shape: 'octagon', mark: 'sides' },
      },
    },
    {
      kind: 'try',
      say: 'This shape is pointing down. Is it still a triangle?',
      caption: 'Still a triangle?',
      scene: { kind: 'big', text: '🔻' },
      choices: ['Yes', 'No'],
      answer: 'Yes',
      hints: {
        No: 'It is upside down, but count its sides: 1, 2, 3. A shape with 3 sides is a triangle, whichever way it points.',
      },
      then: {
        say: 'Yes! It still has 3 sides. Turn a shape any way you like, or make it big or small. It keeps its name.',
        caption: 'Both have 3 sides',
        scene: { kind: 'big', text: '🔺  🔻' },
      },
    },
  ],
};

const NUMBER_PATTERNS: Lesson = {
  id: 'number-patterns',
  title: 'Number Patterns',
  emoji: '🔢',
  places: [{ skillId: 'shapes', rung: 2 }],
  practiceLevelId: 'patterns-2',
  steps: [
    {
      kind: 'watch',
      say: 'Patterns can be made of numbers, too. 2, 4, 6, 8. What comes next?',
      caption: '2, 4, 6, 8, ?',
      scene: { kind: 'pattern', items: ['2', '4', '6', '8'], blank: true },
    },
    {
      kind: 'watch',
      say: 'Find the jump. From 2 to 4 is a jump of 2. From 4 to 6, a jump of 2. From 6 to 8, a jump of 2. Every number is 2 more.',
      caption: 'Every jump is 2',
      scene: { kind: 'numberLine', max: 20, start: 2, hops: 3, dir: 1, step: 2, animate: true },
    },
    {
      kind: 'watch',
      say: 'So make one more jump of 2. 8 and 2 more is 10. 10 comes next!',
      caption: '2, 4, 6, 8, 10',
      scene: { kind: 'numberLine', max: 20, start: 2, hops: 4, dir: 1, step: 2, animate: true },
    },
    {
      kind: 'try',
      say: 'Your turn! 5, 10, 15, 20. What comes next? Find the jump first.',
      caption: '5, 10, 15, 20, ?',
      scene: { kind: 'pattern', items: ['5', '10', '15', '20'], blank: true },
      choices: ['25', '21', '30', '20'],
      answer: '25',
      hints: {
        '21': '21 is just 1 more than 20. Look at the jumps: 5 to 10 is 5 more. Every jump is 5.',
        '30': 'That is 2 jumps of 5 after 20. Make just 1 jump: 20 and 5 more.',
        '20': '20 is the last number we have already. What comes after it?',
      },
      then: {
        say: 'Yes! Every jump is 5. 20 and 5 more is 25.',
        caption: '5, 10, 15, 20, 25',
        scene: { kind: 'numberLine', max: 30, start: 5, hops: 4, dir: 1, step: 5, animate: true },
      },
    },
    {
      kind: 'try',
      say: 'This one is a little different. 1, 3, 5, 7. What comes next?',
      caption: '1, 3, 5, 7, ?',
      scene: { kind: 'pattern', items: ['1', '3', '5', '7'], blank: true },
      choices: ['9', '8', '11'],
      answer: '9',
      hints: {
        '8': '8 comes after 7 when you count by 1s. But this pattern jumps: 1 to 3 is 2 more. Every jump is 2.',
        '11': 'That is 2 jumps of 2 after 7. Make just 1 jump: 7 and 2 more.',
      },
      then: {
        say: 'Yes! Every jump is 2. 7 and 2 more is 9.',
        caption: '1, 3, 5, 7, 9',
        scene: { kind: 'numberLine', max: 20, start: 1, hops: 4, dir: 1, step: 2, animate: true },
      },
    },
  ],
};

export const SHAPE_LESSONS: Lesson[] = [SIDES_AND_CORNERS, WHAT_COMES_NEXT, NAMED_BY_SIDES, NUMBER_PATTERNS];

import type { Lesson } from '../learn';

// Measuring lessons. How a lesson is built, and the pictures it can use, is in
// src/data/learn.ts.
//
// The order kindergarten and first grade meet it in. Compare two things
// directly first: to say which is longer, line the ends up on one start line
// and look at the other end (a thing that starts further along only looks
// longer); to say which is heavier, put them on a balance and the heavier side
// goes down, and bigger is not always heavier. Then measure with units: cubes
// laid end to end from the start line, no gaps, and the last number counted is
// how long it is, so more cubes means longer. Last, the tool for each job: a
// ruler for how long or tall, a scale for how heavy, a thermometer for how hot,
// a clock for time. The tries ask what play asks ("Which is longer?", "Which
// weighs less?", "Which is the best tool to measure how tall you are?").
//
// No `helpsWith` in this file: this topic's questions carry no mistake tags, so
// there is no mistake for a lesson to be the answer to. Play still offers these
// on a demotion, nearest rung first. The topic has one level, so every lesson
// practises it.

const LINE_UP_THE_ENDS: Lesson = {
  id: 'line-up-the-ends',
  title: 'Longer or Shorter?',
  emoji: '✏️',
  places: [{ skillId: 'measuring', rung: 0 }],
  practiceLevelId: 'measure-length',
  steps: [
    {
      kind: 'watch',
      say: 'The snake and the caterpillar both start at this line. The snake goes further. The snake is longer. The caterpillar stops first. The caterpillar is shorter.',
      caption: 'Longer and shorter',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '🐍', label: 'snake', length: 10 }, { emoji: '🐛', label: 'caterpillar', length: 4 }],
      },
    },
    {
      kind: 'watch',
      say: 'Now a pencil and a crayon. Which is longer? The crayon sticks out further, so it looks longer. But wait! The crayon does not start at the line.',
      caption: 'Which is longer?',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '✏️', label: 'pencil', length: 7 }, { emoji: '🖍️', label: 'crayon', length: 5, start: 4 }],
      },
    },
    {
      kind: 'watch',
      say: 'Slide the crayon back to the start line. Now both ends are lined up. Look at the other end. The pencil goes further. The pencil is longer!',
      caption: 'Line up the ends first',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '✏️', label: 'pencil', length: 7 }, { emoji: '🖍️', label: 'crayon', length: 5 }],
      },
    },
    {
      kind: 'try',
      say: 'Your turn! The carrot and the banana start at the same line. Which is shorter?',
      caption: 'Which is shorter?',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '🥕', label: 'carrot', length: 8 }, { emoji: '🍌', label: 'banana', length: 5 }],
      },
      choices: ['🍌 Banana', '🥕 Carrot'],
      answer: '🍌 Banana',
      hints: {
        '🥕 Carrot': 'The carrot goes further, so the carrot is longer. Shorter is the one that stops first.',
      },
      then: {
        say: 'Yes! The banana stops first. The banana is shorter than the carrot.',
        caption: 'The banana is shorter',
      },
    },
    {
      kind: 'try',
      say: 'This one is tricky. Which is really longer, the spoon or the fork?',
      caption: 'Which is longer?',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '🥄', label: 'spoon', length: 6 }, { emoji: '🍴', label: 'fork', length: 4, start: 4 }],
      },
      choices: ['🥄 Spoon', '🍴 Fork', 'Same length'],
      answer: '🥄 Spoon',
      hints: {
        '🍴 Fork': 'The fork only looks longer, because it starts further along. Slide it back to the start line in your head, then look.',
        'Same length': 'Same length means they stop at the same place when they start at the same line. Slide the fork back, and look again.',
      },
      then: {
        say: 'Yes! Line them up on the start line, and the spoon goes further. The fork only looked longer.',
        caption: 'The spoon is longer',
        scene: {
          kind: 'lengths',
          items: [{ emoji: '🥄', label: 'spoon', length: 6 }, { emoji: '🍴', label: 'fork', length: 4 }],
        },
      },
    },
  ],
};

const HEAVIER_OR_LIGHTER: Lesson = {
  id: 'heavier-or-lighter',
  title: 'Heavier or Lighter?',
  emoji: '🎈',
  places: [{ skillId: 'measuring', rung: 0 }],
  practiceLevelId: 'measure-length',
  steps: [
    {
      kind: 'watch',
      say: 'This is a balance. Put one thing on each side. The heavier side goes down. The watermelon side goes down, so the watermelon is heavier.',
      caption: 'Heavier goes down',
      scene: { kind: 'weigh', left: '🍎', right: '🍉', heavier: 'right' },
    },
    {
      kind: 'watch',
      say: 'The lighter side goes up. The apple side went up, so the apple is lighter than the watermelon.',
      caption: 'Lighter goes up',
      scene: { kind: 'weigh', left: '🍎', right: '🍉', heavier: 'right' },
    },
    {
      kind: 'watch',
      say: 'Bigger is not always heavier! A balloon is big, but it is full of air. A rock is small, but the rock side goes down. The rock is heavier.',
      caption: 'Big is not always heavy',
      scene: { kind: 'weigh', left: '🎈', right: '🪨', heavier: 'right' },
    },
    {
      kind: 'try',
      say: 'Your turn! Watch the balance. Which weighs less, the brick or the feather?',
      caption: 'Which weighs less?',
      scene: { kind: 'weigh', left: '🧱', right: '🪶', heavier: 'left' },
      choices: ['🪶 Feather', '🧱 Brick'],
      answer: '🪶 Feather',
      hints: {
        '🧱 Brick': 'The brick side went down. Down means heavier. Which side went up?',
      },
      then: {
        say: 'Yes! The feather side went up. The feather is lighter, so it weighs less.',
        caption: 'The feather weighs less',
      },
    },
    {
      kind: 'try',
      say: 'A kite is bigger than a hammer. If you put them on the balance, which one is heavier?',
      caption: 'Which is heavier?',
      scene: { kind: 'big', text: '🪁   🔨' },
      choices: ['🔨 Hammer', '🪁 Kite'],
      answer: '🔨 Hammer',
      hints: {
        '🪁 Kite': 'The kite is bigger, but it is thin and light, so the wind can lift it. Bigger is not always heavier!',
      },
      then: {
        say: 'Yes! The hammer is small, but it is heavy. The hammer side goes down.',
        caption: 'The hammer is heavier',
        scene: { kind: 'weigh', left: '🪁', right: '🔨', heavier: 'right' },
      },
    },
  ],
};

const MEASURE_WITH_CUBES: Lesson = {
  id: 'measure-with-cubes',
  title: 'Measuring With Cubes',
  emoji: '📏',
  places: [{ skillId: 'measuring', rung: 1 }],
  practiceLevelId: 'measure-length',
  steps: [
    {
      kind: 'watch',
      say: 'How long is this pencil? We can measure it with cubes.',
      caption: 'How long is the pencil?',
      scene: { kind: 'lengths', items: [{ emoji: '✏️', label: 'pencil', length: 6 }] },
    },
    {
      kind: 'watch',
      say: 'Start right at the start line. Put the cubes end to end, with no gaps in between. Now count them. 1, 2, 3, 4, 5, 6. The pencil is 6 cubes long.',
      caption: '6 cubes long',
      scene: { kind: 'lengths', items: [{ emoji: '✏️', label: 'pencil', length: 6 }], units: true },
    },
    {
      kind: 'watch',
      say: 'Now measure the crayon. 1, 2, 3, 4. The crayon is 4 cubes long. 6 is more than 4, so the pencil is longer. More cubes means longer.',
      caption: '6 cubes is longer than 4',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '✏️', label: 'pencil', length: 6 }, { emoji: '🖍️', label: 'crayon', length: 4 }],
        units: true,
      },
    },
    {
      kind: 'try',
      say: 'Your turn! Count the cubes on each ribbon. Which ribbon is longer?',
      caption: 'Which is longer?',
      scene: {
        kind: 'lengths',
        items: [{ emoji: '🎀', label: 'red', length: 5 }, { emoji: '🎀', label: 'blue', length: 5 }],
        units: true,
      },
      choices: ['Same length', '🔴 Red ribbon', '🔵 Blue ribbon'],
      answer: 'Same length',
      hints: {
        '🔴 Red ribbon': 'Count the cubes on each one. The red ribbon is 5 cubes long. The blue ribbon is 5 cubes long, too.',
        '🔵 Blue ribbon': 'Count the cubes on each one. The blue ribbon is 5 cubes long. The red ribbon is 5 cubes long, too.',
      },
      then: {
        say: 'Yes! 5 cubes and 5 cubes. They stop at the same place. They are the same length.',
        caption: '5 cubes and 5 cubes',
      },
    },
    {
      kind: 'try',
      say: 'The spoon is 7 cubes long. The fork is 5 cubes long. Which is shorter?',
      caption: 'Which is shorter?',
      scene: { kind: 'big', text: '🥄 7 cubes\n🍴 5 cubes' },
      choices: ['🍴 Fork', '🥄 Spoon', 'Same length'],
      answer: '🍴 Fork',
      hints: {
        '🥄 Spoon': 'The spoon has more cubes, and more cubes means longer. Shorter has fewer cubes.',
        'Same length': '7 and 5 are not the same number, so they are not the same length.',
      },
      then: {
        say: 'Yes! 5 is less than 7. The fork has fewer cubes, so the fork is shorter.',
        caption: 'The fork is shorter',
        scene: {
          kind: 'lengths',
          items: [{ emoji: '🥄', label: 'spoon', length: 7 }, { emoji: '🍴', label: 'fork', length: 5 }],
          units: true,
        },
      },
    },
  ],
};

const WHICH_TOOL: Lesson = {
  id: 'which-tool',
  title: 'Which Tool?',
  emoji: '🧰',
  places: [{ skillId: 'measuring', rung: 1 }],
  practiceLevelId: 'measure-length',
  steps: [
    {
      kind: 'watch',
      say: 'How long is it? How tall are you? To measure a length, use a ruler or a tape measure. A ruler is like a row of cubes stuck together. It counts inches.',
      caption: 'How long: a ruler 📏',
      scene: { kind: 'lengths', items: [{ emoji: '✏️', label: 'pencil', length: 7 }], units: true },
    },
    {
      kind: 'watch',
      say: 'How heavy is it? To find out, use a scale. A scale counts pounds.',
      caption: 'Heavy: a scale ⚖️',
      scene: { kind: 'big', text: '⚖️' },
    },
    {
      kind: 'watch',
      say: 'How hot or cold is it? Use a thermometer. It counts degrees. And what time is it? Use a clock.',
      caption: 'Hot or cold: 🌡️  Time: ⏰',
      scene: { kind: 'big', text: '🌡️   ⏰' },
    },
    {
      kind: 'try',
      say: 'Your turn! Which is the best tool to measure how tall you are?',
      caption: 'How tall are you?',
      scene: { kind: 'big', text: '🧒' },
      choices: ['📏 Ruler', '⚖️ Scale', '🌡️ Thermometer', '⏰ Clock'],
      answer: '📏 Ruler',
      hints: {
        '⚖️ Scale': 'A scale tells how heavy you are, not how tall. How tall you are is a length.',
        '🌡️ Thermometer': 'A thermometer tells how hot or cold it is. How tall you are is a length.',
        '⏰ Clock': 'A clock tells the time. How tall you are is a length.',
      },
      then: {
        say: 'Yes! How tall you are is a length. Use a ruler or a tape measure.',
        caption: 'Tall is a length 📏',
      },
    },
    {
      kind: 'try',
      say: 'Which tool tells you how heavy a pumpkin is?',
      caption: 'How heavy is the pumpkin?',
      scene: { kind: 'big', text: '🎃' },
      choices: ['⚖️ Scale', '📏 Ruler', '🌡️ Thermometer'],
      answer: '⚖️ Scale',
      hints: {
        '📏 Ruler': 'A ruler tells how long the pumpkin is. Heavy is not a length.',
        '🌡️ Thermometer': 'A thermometer tells how hot or cold it is, not how heavy.',
      },
      then: {
        say: 'Yes! A scale tells how heavy something is. It counts pounds.',
        caption: 'Heavy: a scale ⚖️',
        scene: { kind: 'big', text: '🎃 ⚖️' },
      },
    },
    {
      kind: 'try',
      say: 'A ruler measures how long something is. What does a ruler count? Inches, pounds, or degrees?',
      caption: 'A ruler counts…',
      scene: { kind: 'big', text: '📏' },
      choices: ['Inches', 'Pounds', 'Degrees'],
      answer: 'Inches',
      hints: {
        Pounds: 'Pounds tell how heavy something is. A scale counts pounds.',
        Degrees: 'Degrees tell how hot or cold it is. A thermometer counts degrees.',
      },
      then: {
        say: 'Yes! A ruler counts inches. This pencil is 7 inches long.',
        caption: '7 inches long',
        scene: { kind: 'lengths', items: [{ emoji: '✏️', label: 'pencil', length: 7 }], units: true },
      },
    },
  ],
};

export const MEASURING_LESSONS: Lesson[] = [LINE_UP_THE_ENDS, HEAVIER_OR_LIGHTER, MEASURE_WITH_CUBES, WHICH_TOOL];

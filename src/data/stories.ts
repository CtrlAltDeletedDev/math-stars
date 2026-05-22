export interface StoryPanel {
  art: string;
  text: string;
}

export interface StoryDef {
  id: string;
  categoryId: string;
  title: string;
  coverEmoji: string;
  panels: StoryPanel[];
}

export const STORIES: StoryDef[] = [
  {
    id: 'story-addition',
    categoryId: 'addition',
    title: 'Whiskers and the Apple Tree',
    coverEmoji: '🐱🍎',
    panels: [
      { art: '🌳\n🍎🍎🍎', text: 'Whiskers the cat found a magical apple tree with 3 juicy apples. She wanted to make a pie for her friends!' },
      { art: '🍎🍎\n➕\n🍎🍎🍎', text: 'Then 2 more apples fell from the sky! You helped Whiskers add them all up so none were wasted.' },
      { art: '🐱🥧⭐', text: "Whiskers baked the most delicious pie ever! She says it's all thanks to your amazing adding skills! You're a Math Star! ⭐" },
    ],
  },
  {
    id: 'story-counting',
    categoryId: 'counting',
    title: 'Sparkle Counts the Stars',
    coverEmoji: '🦄⭐',
    panels: [
      { art: '🦄\n🌙✨✨✨✨', text: 'Sparkle the unicorn loves counting stars at night! But there are SO many — she needed a helper. That\'s you!' },
      { art: '⭐⭐⭐⭐⭐\n⭐⭐⭐⭐⭐', text: 'Together you counted every single one — 1, 2, 3... all the way to 20! Each star sparkled brighter when counted.' },
      { art: '🦄💫🌟⭐', text: 'Sparkle now knows exactly how many stars are in her sky! She left a glowing star just for you. You\'re wonderful! 🌟' },
    ],
  },
  {
    id: 'story-shapes',
    categoryId: 'shapes',
    title: "Hopscotch's Shape Kingdom",
    coverEmoji: '🐸🔺',
    panels: [
      { art: '🐸\n🏰🔺🟦⚪', text: "Hopscotch the frog lives in a magical kingdom built entirely from shapes — triangles for roofs, squares for walls, and circles for windows!" },
      { art: '🔷🔺\n🔐→🔓', text: 'The castle gate has a shape lock! Only someone who knows their hexagons, pentagons and octagons can open it. Can you help?' },
      { art: '🐸👑⭐', text: 'You named every shape perfectly and the gate swung open! Hopscotch is now the Shape Queen. She made you royal helper! 👑' },
    ],
  },
  {
    id: 'story-multiplication',
    categoryId: 'multiplication',
    title: "Biscuit's Hopping Adventure",
    coverEmoji: '🐰🌸',
    panels: [
      { art: '🐰\n🌸🌸🌸🌸🌸', text: 'Biscuit the bunny needs to cross a magical flower meadow. She can only hop in a pattern — skipping by 2s, 5s or 10s!' },
      { art: '2️⃣4️⃣6️⃣\n5️⃣10️⃣15️⃣', text: 'You helped Biscuit figure out the skip-counting pattern so she could hop from flower to flower without getting lost!' },
      { art: '🐰🏅🌸⭐', text: "Biscuit made it all the way across! She picked her favourite flowers to give you as a thank-you. You're a Skip-Count Star! 🌸" },
    ],
  },
  {
    id: 'story-time',
    categoryId: 'time',
    title: 'Tick the Time Wizard',
    coverEmoji: '🕐✨',
    panels: [
      { art: '🧙✨\n🕐❓', text: "Tick is a magical wizard whose power comes from knowing the exact time. But his clock got scrambled! All the hands are mixed up." },
      { art: '🌅🕗\n🌙🕙', text: 'Tick needs to get to breakfast at 7 o\'clock, school at 9, and bed at half past 8. You helped him read every single clock!' },
      { art: '🕐🎉⭐', text: "Tick's magic is restored! He can now grant time wishes. His first wish? To say THANK YOU to the best Time Star ever — that's you! ⏰⭐" },
    ],
  },
];

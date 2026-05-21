export interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cost: number;
  type: 'theme';
  value: string;
}

export interface ThemeDef {
  id: string;
  colors: [string, string];
  name: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'sky',      name: 'Sky Blue',     colors: ['#4FC3F7', '#0288D1'] },
  { id: 'sunset',   name: 'Sunset',       colors: ['#FF6B6B', '#FF8E53'] },
  { id: 'forest',   name: 'Forest',       colors: ['#5DD97A', '#2E7D32'] },
  { id: 'candy',    name: 'Candy',        colors: ['#C77DFF', '#7B2FBE'] },
  { id: 'ocean',    name: 'Deep Ocean',   colors: ['#1A237E', '#283593'] },
  { id: 'rainbow',  name: 'Rainbow',      colors: ['#FF6B6B', '#C77DFF'] },
  { id: 'gold',     name: 'Golden',       colors: ['#F9CA24', '#F0932B'] },
  { id: 'midnight', name: 'Midnight',     colors: ['#2C3E50', '#3498DB'] },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme_sunset',
    name: 'Sunset Sky',
    description: 'Warm orange and pink background',
    emoji: '🌅',
    cost: 10,
    type: 'theme',
    value: 'sunset',
  },
  {
    id: 'theme_forest',
    name: 'Magic Forest',
    description: 'Fresh green background',
    emoji: '🌲',
    cost: 10,
    type: 'theme',
    value: 'forest',
  },
  {
    id: 'theme_candy',
    name: 'Candy Land',
    description: 'Dreamy purple background',
    emoji: '🍭',
    cost: 15,
    type: 'theme',
    value: 'candy',
  },
  {
    id: 'theme_ocean',
    name: 'Deep Ocean',
    description: 'Deep blue ocean background',
    emoji: '🌊',
    cost: 20,
    type: 'theme',
    value: 'ocean',
  },
  {
    id: 'theme_rainbow',
    name: 'Rainbow World',
    description: 'Colourful rainbow background',
    emoji: '🌈',
    cost: 25,
    type: 'theme',
    value: 'rainbow',
  },
  {
    id: 'theme_gold',
    name: 'Golden Glow',
    description: 'Shiny golden background',
    emoji: '✨',
    cost: 30,
    type: 'theme',
    value: 'gold',
  },
  {
    id: 'theme_midnight',
    name: 'Midnight Stars',
    description: 'Cool dark night background',
    emoji: '🌙',
    cost: 40,
    type: 'theme',
    value: 'midnight',
  },
];

export function getTheme(themeId: string): ThemeDef {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

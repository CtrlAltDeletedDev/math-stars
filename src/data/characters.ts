export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  levelEmojis: string[];
}

// levelEmojis[0] = 0-24 stars, [1] = 25-74, [2] = 75-149, [3] = 150+
export const CHARACTERS: CharacterDef[] = [
  {
    id: 'cat',
    name: 'Whiskers',
    emoji: '🐱',
    color: '#FF9F43',
    levelEmojis: ['🐱', '😺', '😸', '🦁'],
  },
  {
    id: 'unicorn',
    name: 'Sparkle',
    emoji: '🦄',
    color: '#C77DFF',
    levelEmojis: ['🦄', '🦄', '🌟🦄', '👑🦄'],
  },
  {
    id: 'frog',
    name: 'Hopscotch',
    emoji: '🐸',
    color: '#5DD97A',
    levelEmojis: ['🐸', '🐸', '🐸✨', '🐸👑'],
  },
  {
    id: 'bunny',
    name: 'Biscuit',
    emoji: '🐰',
    color: '#FF6B6B',
    levelEmojis: ['🐰', '🐰', '🐇✨', '🐇👑'],
  },
  {
    id: 'dog',
    name: 'Biscuit',
    emoji: '🐶',
    color: '#4FC3F7',
    levelEmojis: ['🐶', '🐕', '🐕✨', '🐕👑'],
  },
  {
    id: 'bear',
    name: 'Honey',
    emoji: '🐻',
    color: '#F9CA24',
    levelEmojis: ['🐻', '🐻', '🐻✨', '🐻👑'],
  },
];

export function getCharacterEmoji(characterId: string, totalStars: number): string {
  const char = CHARACTERS.find((c) => c.id === characterId);
  if (!char) return '⭐';
  const level = totalStars >= 150 ? 3 : totalStars >= 75 ? 2 : totalStars >= 25 ? 1 : 0;
  return char.levelEmojis[level];
}

export function getCharacter(characterId: string): CharacterDef | undefined {
  return CHARACTERS.find((c) => c.id === characterId);
}

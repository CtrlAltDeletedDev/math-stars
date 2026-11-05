import { CHARACTERS } from '@/data/characters';

/** Their character's face. The old app's evolving-with-stars faces are gone: they are who they picked. */
export function characterEmoji(id: string | null): string {
  return CHARACTERS.find((c) => c.id === id)?.emoji ?? '🐱';
}

export function characterName(id: string | null): string {
  return CHARACTERS.find((c) => c.id === id)?.name ?? 'Whiskers';
}

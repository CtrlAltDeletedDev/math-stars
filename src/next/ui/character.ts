import { CHARACTERS } from '@/data/characters';

/** Her character's face. The old app's evolving-with-stars faces are gone: she is who she picked. */
export function characterEmoji(id: string | null): string {
  return CHARACTERS.find((c) => c.id === id)?.emoji ?? '🐱';
}

export function characterName(id: string | null): string {
  return CHARACTERS.find((c) => c.id === id)?.name ?? 'Whiskers';
}

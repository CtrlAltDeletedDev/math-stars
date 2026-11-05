// The friend who joins their path at each stone, once both halves of it are
// passed. Fixed per stone, so the same friend is always at the same place --
// the path itself is the collection. Used by the path and the end of a walk.
export const FRIENDS = ['🐞', '🐌', '🦋', '🐢', '🐝', '🦜', '🦔', '🐿️', '🦉', '🐇', '🦊', '🐼', '🐳'] as const;

export function friendFor(stone: number): string {
  return FRIENDS[stone % FRIENDS.length];
}

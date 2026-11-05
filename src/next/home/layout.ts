// Where things go on the path, in a drawing 375 units wide that the screen
// scales to fit. Pure numbers, no React.

export const PATH_W = 375;
export const STONE_R = 30;
export const HER_R = 42;
/** A unit's sign: a rounded board on the trail. */
export const SIGN = { w: 112, h: 62 } as const;

/** The pill of progress dots beside her stone. */
export const PEBBLE = { r: 6.5, step: 17, chip: 26, pad: 10, h: 34 } as const;

export function pebblePillWidth(slots: number): number {
  return PEBBLE.pad + PEBBLE.chip + slots * PEBBLE.step + PEBBLE.pad - 4;
}

// A winding line up the page. Never dead centre, so her pebbles always have a
// side with room, and never so close to an edge that a friend falls off.
const XS = [0.3, 0.62, 0.76, 0.55, 0.27, 0.43, 0.72, 0.58, 0.3, 0.64, 0.75, 0.46, 0.26];

const GAP = 96; // between two ordinary stones
const GAP_ABOVE_HERS = 152; // room for her character to stand
const GAP_BELOW_HERS = 106;
const FOG = 170; // trail running on into the cloud above the last stone
const BOTTOM = 78; // grass below the first stone

export type SpotKind = 'lesson' | 'unit' | 'start';

export interface StoneSpot {
  x: number;
  y: number;
  /** Half the height: a stone's radius, or half a sign's height. */
  r: number;
  kind: SpotKind;
}

export interface PathLayout {
  height: number;
  spots: StoneSpot[];
  /** The top of the last thing drawn: where the fog starts thinning out. */
  fogEnd: number;
  /** The trail's points, from below the bottom edge up into the fog. */
  trail: [number, number][];
}

export function layoutPath(kinds: SpotKind[], hers: number): PathLayout {
  const count = kinds.length;
  // Walk up from the first node, then shift everything so the top is y = 0.
  const raw: number[] = [];
  let y = 0;
  for (let i = 0; i < count; i++) {
    if (i > 0) y -= i - 1 === hers ? GAP_ABOVE_HERS : i === hers ? GAP_BELOW_HERS : GAP;
    raw.push(y);
  }
  const top = (raw[count - 1] ?? 0) - FOG;
  const height = -top + BOTTOM;
  const spots = raw.map((ry, i): StoneSpot => ({
    x: Math.round(XS[i % XS.length] * PATH_W),
    y: ry - top,
    r: kinds[i] === 'unit' ? SIGN.h / 2 : i === hers ? HER_R : STONE_R,
    kind: kinds[i],
  }));
  const lastSpot = spots[count - 1] ?? { x: PATH_W / 2, y: height - BOTTOM, r: STONE_R, kind: 'start' };
  const trail: [number, number][] = [
    [PATH_W * 0.16, height + 40],
    ...spots.map((s) => [s.x, s.y] as [number, number]),
    [lastSpot.x > PATH_W / 2 ? PATH_W * 0.42 : PATH_W * 0.58, lastSpot.y - 92],
    [PATH_W * 0.5, lastSpot.y - 170],
  ];
  return { height, spots, fogEnd: lastSpot.y + lastSpot.r, trail };
}

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Which side of a spot has more room. */
export function roomySide(s: StoneSpot): 'left' | 'right' {
  return s.x <= PATH_W / 2 ? 'right' : 'left';
}

/** Friends sit on the outside of the bend, away from the middle of the page. */
export function friendSpot(s: StoneSpot): { x: number; y: number } {
  const off = s.r + 24;
  const x = roomySide(s) === 'right' ? s.x - off : s.x + off;
  return { x: Math.max(20, Math.min(PATH_W - 20, x)), y: s.y + 4 };
}

import { forwardRef } from 'react';
import { TrackId } from '@/core/stages';
import { C, KID_FONT } from '../theme';
import { Half, PathView, StoneView } from './path';
import {
  PATH_W, PEBBLE, PathLayout, StoneSpot, friendSpot, pebblePillWidth, pebbleSide, smoothPath,
} from './layout';

// The path itself, as one SVG in matte cut-paper: flat fills, each shape
// lifted off the page by a darker copy of itself just below it.

const STONE_BASE = '#F1E8D6';
const STONE_SHADOW = '#CDBD9B';
const TRAIL_EDGE = '#DCCBA8';
const TRAIL = '#EADDC2';
const TRAIL_TOP = '#F4ECDB';
const MUTED = '#B9AA8A';

const TRACK_COLOUR: Record<TrackId, { solid: string; soft: string }> = {
  plus: { solid: C.plus, soft: C.plusSoft },
  minus: { solid: C.minus, soft: C.minusSoft },
};
const SIGN: Record<TrackId, string> = { plus: '+', minus: '−' };

interface Props {
  view: PathView;
  layout: PathLayout;
  character: string;
  /** Extra drawing units on each side, so the grass and fog reach the screen's edges. */
  pad?: number;
}

const PathScene = forwardRef<SVGSVGElement, Props>(function PathScene({ view, layout, character, pad = 0 }, ref) {
  const { height, spots, trail, fogEnd } = layout;
  const trailD = smoothPath(trail);
  const her = spots[view.hers];

  return (
    <svg
      ref={ref}
      viewBox={`${-pad} 0 ${PATH_W + 2 * pad} ${height}`}
      width="100%"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
      fontFamily={KID_FONT}
    >
      <defs>
        <linearGradient id="np-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.35" stopColor="#F7FBFB" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F7FBFB" stopOpacity="0" />
        </linearGradient>
        {spots.map((s, i) => (
          <clipPath key={i} id={`np-stone-${i}`}><circle cx={s.x} cy={s.y} r={s.r} /></clipPath>
        ))}
      </defs>

      <Hills height={height} spots={spots} pad={pad} />

      {/* The trail: a paper strip with stepping marks along it. */}
      <path d={trailD} fill="none" stroke={TRAIL_EDGE} strokeWidth={40} strokeLinecap="round" transform="translate(0 4)" />
      <path d={trailD} fill="none" stroke={TRAIL} strokeWidth={38} strokeLinecap="round" />
      <path d={trailD} fill="none" stroke={TRAIL_TOP} strokeWidth={26} strokeLinecap="round" />
      <path d={trailD} fill="none" stroke={TRAIL} strokeWidth={9} strokeLinecap="round" strokeDasharray="1 19" />

      <Flowers spots={spots} />

      {view.stones.map((st) => st.friend && (
        <Friend key={`f${st.index}`} at={friendSpot(spots[st.index])} emoji={st.friend} />
      ))}

      {her && <circle cx={her.x} cy={her.y} r={her.r + 15} fill="#FFF0BC" className="np-glow" />}

      {[...view.stones].reverse().map((st) => <Stone key={st.index} stone={st} spot={spots[st.index]} />)}

      {/* Fog over the far end: the path keeps going, it never ends. */}
      <rect x={-pad - 2} y={0} width={PATH_W + 2 * pad + 4} height={Math.max(0, fogEnd)} fill="url(#np-fog)" pointerEvents="none" />
      <Cloud x={PATH_W * 0.3} y={58} scale={1} />
      <Cloud x={PATH_W * 0.72} y={88} scale={0.8} />

      {her && view.pebbles.map((row, k) => (
        <Pebbles key={row.track} spot={her} track={row.track} filled={row.filled} slots={row.slots}
          dy={view.pebbles.length === 2 ? (k === 0 ? -21 : 21) : 0} />
      ))}

      {her && (
        <text x={her.x} y={her.y - her.r + 2} fontSize={62} textAnchor="middle" className="np-bob">
          {character}
        </text>
      )}
    </svg>
  );
});

export default PathScene;

function halfPath(s: StoneSpot, side: 'left' | 'right') {
  const sweep = side === 'left' ? 0 : 1;
  return `M${s.x} ${s.y - s.r} A${s.r} ${s.r} 0 0 ${sweep} ${s.x} ${s.y + s.r} Z`;
}

function HalfFace({ half, track, spot, index }: { half: Half; track: TrackId; spot: StoneSpot; index: number }) {
  const side = track === 'plus' ? 'left' : 'right';
  const d = halfPath(spot, side);
  const col = TRACK_COLOUR[track];
  switch (half.state) {
    case 'passed':
      return <path d={d} fill={col.solid} />;
    case 'here': {
      // Filling from the bottom as her right answers come in.
      const level = Math.max(0.1, half.fill);
      const h = spot.r * 2 * level;
      const x = side === 'left' ? spot.x - spot.r : spot.x;
      return (
        <g>
          <path d={d} fill={col.soft} />
          <g clipPath={`url(#np-stone-${index})`}>
            <rect x={x} y={spot.y + spot.r - h} width={spot.r} height={h} fill={col.solid} opacity={0.85} />
          </g>
          <path d={d} fill="none" stroke={col.solid} strokeWidth={3.5} strokeLinejoin="round" />
        </g>
      );
    }
    case 'ahead':
      return (
        <g>
          <path d={d} fill={STONE_BASE} />
          <path d={d} fill="none" stroke={col.solid} strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="5 5" />
        </g>
      );
    default:
      return <path d={d} fill={STONE_BASE} />;
  }
}

function Stone({ stone, spot }: { stone: StoneView; spot: StoneSpot }) {
  const { x, y, r } = spot;
  const opacity = stone.ahead === 0 ? 1 : stone.ahead === 1 ? 0.9 : 0.6;
  const big = stone.hers;
  const len = stone.label.length;
  const labelSize = (big ? 30 : 21) * (len >= 3 ? 0.7 : len === 2 ? 0.9 : 1);
  const signSize = big ? 17 : 13;
  const signFill = (h: Half, t: TrackId) =>
    h.state === 'passed' ? '#FFFFFF' : h.state === 'here' ? (h.fill >= 0.6 ? '#FFFFFF' : TRACK_COLOUR[t].solid) : MUTED;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y + 5} r={r} fill={STONE_SHADOW} />
      <circle cx={x} cy={y} r={r} fill={STONE_BASE} />
      <HalfFace half={stone.plus} track="plus" spot={spot} index={stone.index} />
      <HalfFace half={stone.minus} track="minus" spot={spot} index={stone.index} />
      <circle cx={x} cy={y} r={r * 0.6} fill="#FFFFFF" />
      <circle cx={x} cy={y + 1.5} r={r * 0.6} fill="none" stroke="#000" strokeOpacity={0.05} strokeWidth={2} />
      {stone.plus.state !== 'none' && (
        <text x={x - r * 0.8} y={y + signSize * 0.36} fontSize={signSize} fontWeight={700} textAnchor="middle" fill={signFill(stone.plus, 'plus')}>+</text>
      )}
      {stone.minus.state !== 'none' && (
        <text x={x + r * 0.8} y={y + signSize * 0.36} fontSize={signSize} fontWeight={700} textAnchor="middle" fill={signFill(stone.minus, 'minus')}>−</text>
      )}
      <text x={x} y={y + labelSize * 0.36} fontSize={labelSize} fontWeight={600} textAnchor="middle" fill={C.ink}>{stone.label}</text>
    </g>
  );
}

function Pebbles({ spot, track, filled, slots, dy }: { spot: StoneSpot; track: TrackId; filled: number; slots: number; dy: number }) {
  const w = pebblePillWidth(slots);
  const side = pebbleSide(spot);
  const gap = 12;
  const rawX = side === 'right' ? spot.x + spot.r + gap : spot.x - spot.r - gap - w;
  const x0 = Math.max(4, Math.min(PATH_W - 4 - w, rawX));
  const cy = spot.y + dy;
  const col = TRACK_COLOUR[track].solid;
  const firstDot = x0 + PEBBLE.pad + PEBBLE.chip + PEBBLE.step / 2 - 2;
  return (
    <g>
      <rect x={x0} y={cy - PEBBLE.h / 2 + 3} width={w} height={PEBBLE.h} rx={PEBBLE.h / 2} fill="#000" opacity={0.06} />
      <rect x={x0} y={cy - PEBBLE.h / 2} width={w} height={PEBBLE.h} rx={PEBBLE.h / 2} fill="#FFFFFF" opacity={0.95} />
      <circle cx={x0 + PEBBLE.pad + PEBBLE.chip / 2 - 3} cy={cy} r={11} fill={TRACK_COLOUR[track].soft} />
      <text x={x0 + PEBBLE.pad + PEBBLE.chip / 2 - 3} y={cy + 6.5} fontSize={19} fontWeight={700} textAnchor="middle" fill={col}>{SIGN[track]}</text>
      {Array.from({ length: slots }, (_, k) => (
        <circle key={k} cx={firstDot + k * PEBBLE.step} cy={cy} r={PEBBLE.r}
          fill={k < filled ? col : '#FFFFFF'} stroke={col} strokeWidth={2.5} />
      ))}
    </g>
  );
}

function Friend({ at, emoji }: { at: { x: number; y: number }; emoji: string }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y + 8} rx={16} ry={5} fill="#000" opacity={0.08} />
      <text x={at.x} y={at.y + 6} fontSize={28} textAnchor="middle">{emoji}</text>
    </g>
  );
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  const parts: [number, number, number][] = [[-46, 6, 26], [-14, -8, 32], [22, -2, 28], [50, 8, 20]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform="translate(0 6)" fill="#DCE9EE">
        {parts.map(([dx, dy, r], i) => <circle key={i} cx={dx} cy={dy} r={r} />)}
        <rect x={-72} y={4} width={142} height={30} rx={15} />
      </g>
      <g fill="#FFFFFF">
        {parts.map(([dx, dy, r], i) => <circle key={i} cx={dx} cy={dy} r={r} />)}
        <rect x={-72} y={4} width={142} height={30} rx={15} />
      </g>
    </g>
  );
}

/** Soft paper mounds behind the trail. */
function Hills({ height, spots, pad }: { height: number; spots: StoneSpot[]; pad: number }) {
  const bumps = spots
    .filter((_, i) => i % 3 === 1)
    .map((s) => ({ cx: s.x < PATH_W / 2 ? PATH_W + 10 + pad * 0.6 : -10 - pad * 0.6, cy: s.y + 30 }));
  return (
    <g>
      {bumps.map((b, i) => (
        <g key={i}>
          <ellipse cx={b.cx} cy={b.cy + 5} rx={130} ry={44} fill={C.grassDeep} opacity={0.45} />
          <ellipse cx={b.cx} cy={b.cy} rx={130} ry={44} fill="#C3DFA4" opacity={0.75} />
        </g>
      ))}
      <ellipse cx={40 - pad} cy={height + 4} rx={170 + pad} ry={56} fill={C.grassDeep} opacity={0.5} />
      <ellipse cx={40 - pad} cy={height} rx={170 + pad} ry={56} fill="#C3DFA4" />
      <ellipse cx={PATH_W - 10 + pad} cy={height + 18} rx={150 + pad} ry={50} fill={C.grassDeep} opacity={0.6} />
    </g>
  );
}

/** A few flowers in the grass, on the side the trail is not. */
function Flowers({ spots }: { spots: StoneSpot[] }) {
  const out: { x: number; y: number; e: string }[] = [];
  for (let i = 0; i < spots.length - 1; i += 2) {
    const a = spots[i];
    const b = spots[i + 1];
    const mid = (a.x + b.x) / 2;
    out.push({ x: mid < PATH_W / 2 ? PATH_W - 36 : 30, y: (a.y + b.y) / 2 + 6, e: i % 4 === 0 ? '🌼' : '🌷' });
  }
  return (
    <g>
      {out.map((f, i) => <text key={i} x={f.x} y={f.y} fontSize={18} textAnchor="middle" opacity={0.95}>{f.e}</text>)}
    </g>
  );
}

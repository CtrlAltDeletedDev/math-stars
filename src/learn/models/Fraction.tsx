import { ModelProps } from './types';
import { C } from '@/next/theme';
import { ModelStyles, svgBox, tapProps } from './b-shared';
import { partWeights, shadedCount, shadedOf, toggleShade } from './logic-b';

// A circle cut like a pizza, or a bar cut into columns. Equal parts are
// exactly equal; `unequal` cuts are clearly not, so "is this cut in halves?"
// is something they can see. Shaded parts fill warm orange.

const SHADE = '#F6A43C';
const SHADE_EDGE = '#C9781A';
const EMPTY = '#FFFFFF';
const EDGE = '#3A3F4B';

function sectors(weights: number[], cx: number, cy: number, r: number): string[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 1) return [`M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`];
  let a0 = -Math.PI / 2;
  return weights.map((w) => {
    const a1 = a0 + (w / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${cx},${cy}L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}A${r},${r} 0 ${large},1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}Z`;
    a0 = a1;
    return d;
  });
}

function columns(weights: number[], x: number, y: number, w: number, h: number): string[] {
  const total = weights.reduce((a, b) => a + b, 0);
  let x0 = x;
  return weights.map((wt) => {
    const cw = (wt / total) * w;
    const d = `M${x0},${y}h${cw}v${h}h${-cw}Z`;
    x0 += cw;
    return d;
  });
}

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

export default function Fraction({ state, onChange, size = 'big' }: ModelProps<'fraction'>) {
  const live = !!onChange;
  const parts = Math.max(1, state.parts);
  const shaded = shadedOf({ ...state, parts });
  const weights = partWeights(parts, state.unequal);
  const circle = state.shape === 'circle';

  const vbW = circle ? 240 : Math.max(320, parts * 62) + 20;
  const vbH = circle ? 240 : 170;
  const paths = circle ? sectors(weights, 120, 120, 106) : columns(weights, 10, 10, vbW - 20, 150);
  const outline = circle
    ? <circle cx={120} cy={120} r={106} fill="none" stroke={EDGE} strokeWidth={5} />
    : <rect x={10} y={10} width={vbW - 20} height={150} rx={6} fill="none" stroke={EDGE} strokeWidth={5} />;

  const n = shadedCount({ ...state, parts });
  const label = `A ${circle ? 'circle' : 'rectangle'} cut into ${parts} ${state.unequal ? 'parts that are not equal' : 'equal parts'}, ${n} shaded`;
  const scale = size === 'small' ? (circle ? 0.56 : 0.42) : circle ? 1.2 : 1.05;

  return (
    <div style={{ maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      <svg viewBox={`0 0 ${vbW} ${vbH}`} {...svgBox(vbW, vbH, scale)} role={live ? 'group' : 'img'} aria-label={label}>
        {circle ? <ellipse cx={122} cy={126} rx={106} ry={106} fill="#000" opacity={0.07} /> : <rect x={12} y={15} width={vbW - 20} height={150} rx={6} fill="#000" opacity={0.07} />}
        {paths.map((d, i) => (
          <path key={i} d={d} className="mb-anim"
            fill={shaded[i] ? SHADE : EMPTY} stroke={EDGE} strokeWidth={3.5} strokeLinejoin="round"
            style={{ transition: 'fill .3s ease' }}
            {...(live ? tapProps(`${ORDINAL[i] ?? i + 1} part, ${shaded[i] ? 'shaded' : 'not shaded'}`, () => onChange!(toggleShade(state, i))) : {})} />
        ))}
        {/* Hatching on the shaded parts as well as colour, so shaded reads even in grey or for colour-blind eyes. */}
        <defs>
          <pattern id={`hatch-${parts}-${circle ? 'c' : 'r'}`} width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={12} stroke={SHADE_EDGE} strokeWidth={3} strokeOpacity={0.35} />
          </pattern>
        </defs>
        {paths.map((d, i) => (
          <path key={`h${i}`} d={d} fill={`url(#hatch-${parts}-${circle ? 'c' : 'r'})`} pointerEvents="none" className="mb-anim"
            style={{ opacity: shaded[i] ? 1 : 0, transition: 'opacity .3s ease' }} />
        ))}
        {outline}
      </svg>
    </div>
  );
}

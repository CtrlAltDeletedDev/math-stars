import { useId } from 'react';
import { ModelProps } from './types';
import { ShapeName } from '../types';
import { C } from '@/next/theme';
import { ModelStyles } from './b-shared';
import { togglePick } from './logic-b';

// Flat shapes in pattern-block colours with a crisp outline; solid shapes
// shaded light-to-dark with their hidden edges dashed, the way a first-grade
// book draws them. In "do" she taps shapes to pick them (to sort, or to find
// all the triangles); a picked shape gets a navy ring.

const INK = '#3A3F4B';
const DASH = { stroke: INK, strokeWidth: 2.2, strokeDasharray: '5 4', strokeOpacity: 0.55, fill: 'none', strokeLinecap: 'round' as const };

const FLAT: Record<string, { fill: string; edge: string }> = {
  circle: { fill: '#8FD3F5', edge: '#3E8FBF' },
  triangle: { fill: '#8FD18A', edge: '#4E9A49' },
  square: { fill: '#6CD4C3', edge: '#2E9C8A' },
  rectangle: { fill: '#F5A6C8', edge: '#C0628C' },
  hexagon: { fill: '#FFD45C', edge: '#C99A16' },
  trapezoid: { fill: '#F7A65A', edge: '#C26F22' },
  rhombus: { fill: '#8EA4F2', edge: '#4F66C2' },
};

const SOLID: Record<string, [string, string, string]> = {
  // light, mid, dark
  cube: ['#FFD7AE', '#F7A65A', '#C9772C'],
  'rectangular prism': ['#DCCDF8', '#B79BEA', '#8466C2'],
  sphere: ['#E3F4FD', '#7CC4F2', '#3A86B8'],
  cone: ['#FFF0BC', '#FFD45C', '#C99A16'],
  cylinder: ['#D9F2D4', '#8FD18A', '#4E9A49'],
};

function poly(points: [number, number][]) {
  return points.map((p) => p.join(',')).join(' ');
}

/** One shape in a 100 x 100 box. */
export function ShapeArt({ name }: { name: ShapeName }) {
  const uid = useId().replace(/:/g, '');
  const flat = FLAT[name];
  if (flat) {
    const common = { fill: flat.fill, stroke: flat.edge, strokeWidth: 3.5, strokeLinejoin: 'round' as const };
    const shadow = { fill: '#000', opacity: 0.08, transform: 'translate(2 4)' };
    let el: (p: Record<string, unknown>) => React.ReactNode;
    switch (name) {
      case 'circle': el = (p) => <circle cx={50} cy={50} r={38} {...p} />; break;
      case 'triangle': el = (p) => <polygon points={poly([[50, 12], [90, 82], [10, 82]])} {...p} />; break;
      case 'square': el = (p) => <rect x={17} y={17} width={66} height={66} rx={2} {...p} />; break;
      case 'rectangle': el = (p) => <rect x={6} y={27} width={88} height={46} rx={2} {...p} />; break;
      case 'hexagon': el = (p) => <polygon points={poly(Array.from({ length: 6 }, (_, i) => [50 + 42 * Math.cos((i * Math.PI) / 3), 50 + 42 * Math.sin((i * Math.PI) / 3)] as [number, number]))} {...p} />; break;
      case 'trapezoid': el = (p) => <polygon points={poly([[30, 28], [70, 28], [93, 74], [7, 74]])} {...p} />; break;
      default: el = (p) => <polygon points={poly([[34, 22], [92, 22], [66, 78], [8, 78]])} {...p} />; // rhombus
    }
    return <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden style={{ display: 'block', overflow: 'visible' }}>{el(shadow)}{el(common)}</svg>;
  }

  const [light, mid, dark] = SOLID[name] ?? SOLID.cube;
  const edge = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  const lin = `l${uid}`, rad = `r${uid}`;
  const defs = (
    <defs>
      <linearGradient id={lin} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={mid} /><stop offset=".35" stopColor={light} /><stop offset="1" stopColor={dark} />
      </linearGradient>
      <radialGradient id={rad} cx=".36" cy=".32" r=".75">
        <stop offset="0" stopColor="#fff" /><stop offset=".25" stopColor={light} /><stop offset=".7" stopColor={mid} /><stop offset="1" stopColor={dark} />
      </radialGradient>
    </defs>
  );
  let body: React.ReactNode;
  switch (name) {
    case 'cube':
    case 'rectangular prism': {
      // Front face, then a top and right side pushed back by (dx, -dy).
      const [x, y, w, h, dx, dy] = name === 'cube' ? [14, 36, 50, 50, 22, 20] : [6, 44, 64, 38, 22, 18];
      body = (
        <>
          <polygon points={poly([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]])} fill={light} {...edge} />
          <polygon points={poly([[x + w, y], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]])} fill={dark} {...edge} />
          <rect x={x} y={y} width={w} height={h} fill={mid} {...edge} />
          {/* The hidden back corner. */}
          <polyline points={poly([[x, y + h], [x + dx, y + h - dy], [x + w + dx, y + h - dy]])} {...DASH} />
          <line x1={x + dx} y1={y + h - dy} x2={x + dx} y2={y - dy} {...DASH} />
        </>
      );
      break;
    }
    case 'sphere':
      body = (
        <>
          <ellipse cx={52} cy={90} rx={28} ry={5} fill="#000" opacity={0.08} />
          <circle cx={50} cy={50} r={38} fill={`url(#${rad})`} {...edge} />
          <path d="M12,50 A38,10 0 0,0 88,50" fill="none" stroke={INK} strokeWidth={2} strokeOpacity={0.6} />
          <path d="M12,50 A38,10 0 0,1 88,50" {...DASH} />
        </>
      );
      break;
    case 'cone':
      body = (
        <>
          <path d="M50,10 L15,80 A35,10 0 0,0 85,80 Z" fill={`url(#${lin})`} {...edge} />
          <path d="M15,80 A35,10 0 0,1 85,80" {...DASH} />
        </>
      );
      break;
    default: // cylinder
      body = (
        <>
          <path d="M18,22 L18,80 A32,10 0 0,0 82,80 L82,22 Z" fill={`url(#${lin})`} {...edge} />
          <ellipse cx={50} cy={22} rx={32} ry={10} fill={light} {...edge} />
          <path d="M18,80 A32,10 0 0,1 82,80" {...DASH} />
        </>
      );
  }
  return <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden style={{ display: 'block', overflow: 'visible' }}>{defs}{body}</svg>;
}

function cols(n: number, small: boolean) {
  if (small) return Math.min(n, 3);
  if (n <= 4) return n;
  if (n <= 6) return 3;
  return 4;
}

export default function Shapes({ state, onChange, size = 'big' }: ModelProps<'shapes'>) {
  const live = !!onChange;
  const small = size === 'small';
  const n = state.items.length;
  const c = cols(n, small);
  const cell = small ? 44 : 104;
  const gap = small ? 5 : 12;
  const picked = new Set(state.picked);
  const label = `Shapes: ${state.items.map((s, i) => (picked.has(i) ? `${s} (picked)` : s)).join(', ')}`;

  return (
    <div role={live ? 'group' : 'img'} aria-label={label}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${c}, minmax(0, ${cell}px))`, gap, justifyContent: 'center', maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      {state.items.map((name, i) => {
        const on = picked.has(i);
        const box: React.CSSProperties = {
          position: 'relative', aspectRatio: '1', boxSizing: 'border-box', padding: small ? 4 : 12,
          borderRadius: small ? 10 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: on ? '#E6ECFF' : live ? C.card : 'transparent',
          border: live || on ? `${small ? 2 : 3}px solid ${on ? C.navy : C.line}` : '3px solid transparent',
          boxShadow: live && !on ? `0 4px 0 ${C.line}` : on ? `0 0 0 ${small ? 2 : 4}px ${C.navy}33` : 'none',
          transition: 'background .2s, border-color .2s, box-shadow .2s, transform .15s',
          transform: on && live ? 'translateY(2px)' : 'none',
        };
        const art = <div key={`${name}-${on}`} className={on ? 'mb-pop' : undefined} style={{ width: '100%', height: '100%' }}><ShapeArt name={name} /></div>;
        if (!live) return <div key={i} style={box}>{art}</div>;
        return (
          <button key={i} className="mb-tap" aria-label={`${name}${on ? ', picked' : ''}`} aria-pressed={on}
            onClick={() => onChange!(togglePick(state, i))} style={{ ...box, minWidth: 48, minHeight: 48, cursor: 'pointer', fontSize: 0 }}>
            {art}
          </button>
        );
      })}
    </div>
  );
}

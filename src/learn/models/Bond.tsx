import { ModelProps } from './types';
import { KID_FONT } from '@/next/theme';
import { COL, MotionStyles, tap } from './a-shared';
import { bondLabel, bondSplit, moveSplit } from './logic-a';

// A number bond: the whole on top, two parts below, joined by lines. The
// left part is teal (the first number), the right navy (the second). A
// missing number is a dashed amber circle with a "?".
//
// With `counters`, the parts are two big circles holding the whole's
// counters, `split` of them on the left. In "do", a tap on a counter (or
// anywhere in its circle: the circle is the hit area) slides one counter
// across to the other part. `split` and `parts` move together (moveSplit).

type Kind = 'whole' | 'a' | 'b';

const STYLE: Record<Kind, { fill: string; stroke: string; ink: string }> = {
  whole: { fill: '#fff', stroke: COL.ink, ink: COL.ink },
  a: { fill: COL.aSoft, stroke: COL.a, ink: '#137A6B' },
  b: { fill: COL.bSoft, stroke: COL.b, ink: COL.b },
};

function NumberCircle({ cx, cy, r, value, kind, font }: { cx: number; cy: number; r: number; value: number | null; kind: Kind; font: number }) {
  const unknown = value === null;
  const st = STYLE[kind];
  const text = unknown ? '?' : String(value);
  const fs = text.length >= 3 ? font * 0.72 : font;
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r}
        fill={unknown ? COL.unknownSoft : st.fill}
        stroke={unknown ? COL.unknown : st.stroke}
        strokeWidth={4}
        strokeDasharray={unknown ? '9 7' : undefined}
        style={{ transition: 'fill .3s ease, stroke .3s ease' }}
      />
      <text
        key={text}
        className="ma-pop"
        x={cx} y={cy} dy="0.35em" textAnchor="middle"
        style={{ fontFamily: KID_FONT, fontWeight: 600, fontSize: fs, fill: unknown ? COL.unknownInk : st.ink, transformBox: 'fill-box', transformOrigin: 'center' }}
      >{text}</text>
    </g>
  );
}

export default function Bond({ state, onChange, size = 'big' }: ModelProps<'bond'>) {
  const withCounters = !!state.counters && state.whole !== null && state.whole > 0;
  return (
    <div
      className="ma-m"
      role={onChange && withCounters ? 'group' : 'img'}
      aria-label={bondLabel(state)}
      style={{ display: 'flex', justifyContent: 'center', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <MotionStyles />
      {withCounters ? <CounterBond state={state} onChange={onChange} size={size} /> : <PlainBond state={state} size={size} />}
    </div>
  );
}

function PlainBond({ state, size }: ModelProps<'bond'>) {
  const width = size === 'small' ? 150 : 320;
  const [p, q] = state.parts;
  return (
    <svg viewBox="0 0 300 236" aria-hidden style={{ width, maxWidth: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <line x1={150} y1={60} x2={68} y2={178} stroke={COL.soft} strokeWidth={5} strokeLinecap="round" />
      <line x1={150} y1={60} x2={232} y2={178} stroke={COL.soft} strokeWidth={5} strokeLinecap="round" />
      <NumberCircle cx={150} cy={58} r={50} value={state.whole} kind="whole" font={50} />
      <NumberCircle cx={68} cy={178} r={50} value={p} kind="a" font={50} />
      <NumberCircle cx={232} cy={178} r={50} value={q} kind="b" font={50} />
    </svg>
  );
}

const POD = { r: 78, y: 222, xs: [86, 254] as const };

/** Where n counters sit in a part circle, centred, as offsets from its middle. */
function podLayout(n: number): { x: number; y: number; r: number }[] {
  if (n <= 0) return [];
  const cols = n <= 3 ? n : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  let sp = 34;
  while (sp > 12 && Math.hypot((cols - 1) * sp / 2, (rows - 1) * sp / 2) + sp * 0.42 > 60) sp -= 1;
  const r = Math.min(13, sp * 0.42);
  const out: { x: number; y: number; r: number }[] = [];
  for (let k = 0; k < n; k++) {
    const row = Math.floor(k / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols;
    const col = k - row * cols;
    out.push({ x: (col - (inRow - 1) / 2) * sp, y: (row - (rows - 1) / 2) * sp + 10, r });
  }
  return out;
}

function CounterBond({ state, onChange, size }: ModelProps<'bond'>) {
  const whole = state.whole ?? 0;
  const split = bondSplit(state);
  const left = podLayout(split);
  const right = podLayout(whole - split);
  const width = size === 'small' ? 170 : 380;
  const live = !!onChange;
  const tagY = POD.y - POD.r;

  return (
    <svg viewBox="0 0 340 304" style={{ width, maxWidth: '100%', height: 'auto', display: 'block', overflow: 'visible', touchAction: 'manipulation' }}>
      {POD.xs.map((px) => (
        <line key={px} x1={170} y1={48} x2={px} y2={tagY} stroke={COL.soft} strokeWidth={5} strokeLinecap="round" />
      ))}
      {POD.xs.map((px, side) => {
        const kind = side === 0 ? 'a' : 'b';
        const n = side === 0 ? split : whole - split;
        const p = {
          cx: px, cy: POD.y, r: POD.r,
          fill: STYLE[kind].fill, stroke: STYLE[kind].stroke, strokeWidth: 3.5,
        };
        if (!live) return <circle key={px} {...p} />;
        return (
          <circle
            key={px} {...p}
            role="button"
            tabIndex={0}
            aria-label={`${side === 0 ? 'Left' : 'Right'} part, ${n} counters. Move one across.`}
            aria-disabled={n === 0}
            className="ma-tap"
            {...tap(() => {
              const next = moveSplit(state, side as 0 | 1);
              if (next !== state) onChange!(next);
            }, true)}
            style={{ cursor: n ? 'pointer' : 'default' }}
          />
        );
      })}
      {/* Every counter keeps its identity, so the one that moves slides across. */}
      {Array.from({ length: whole }, (_, k) => {
        const onLeft = k < split;
        const slot = onLeft ? left[k] : right[whole - 1 - k];
        const cx = POD.xs[onLeft ? 0 : 1] + slot.x;
        const cy = POD.y + slot.y;
        return (
          <g key={k} aria-hidden style={{ transform: `translate(${cx}px, ${cy}px)`, transition: 'transform .45s cubic-bezier(.4,1.25,.55,1)', pointerEvents: 'none' }}>
            {/* A darker rim along the bottom, like the ten frame's counters. */}
            <circle r={slot.r} fill={onLeft ? '#167567' : '#252F6B'} style={{ transition: 'fill .35s ease .1s' }} />
            <circle cy={-slot.r * 0.12} r={slot.r * 0.9} fill={onLeft ? COL.a : COL.b} style={{ transition: 'fill .35s ease .1s' }} />
          </g>
        );
      })}
      <g style={{ pointerEvents: 'none' }}>
        <NumberCircle cx={170} cy={46} r={40} value={whole} kind="whole" font={42} />
        <NumberCircle cx={POD.xs[0]} cy={tagY} r={26} value={state.parts[0]} kind="a" font={30} />
        <NumberCircle cx={POD.xs[1]} cy={tagY} r={26} value={state.parts[1]} kind="b" font={30} />
      </g>
    </svg>
  );
}

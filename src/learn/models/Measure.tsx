import { ModelProps } from './types';
import { C, KID_FONT } from '@/next/theme';
import { ModelStyles, svgBox, tapProps, useLeaving } from './b-shared';
import { badOffset, maxPlacedOf, placeUnit, removeUnit } from './logic-b';

// Measuring with units: an object exactly `length` units long, and units laid
// end to end under it. Common objects are drawn (a pencil, a crayon, a
// ribbon, a caterpillar) so their ends are exact; anything else is its emoji
// stretched to length. Dashed lines drop from both ends of the object, so
// "start at the edge, stop at the end" is visible. With `gaps` the units are
// laid badly -- gaps and an overlap -- to spot why that gives a wrong count.

const U = 44;      // one unit
const PAD = 16;
const OBJ_Y = 18;  // top of the object row
const OBJ_H = 40;
const UNIT_Y = OBJ_Y + OBJ_H + 18;
const UNIT_H = U;

const OBJECT_NAMES: Record<string, string> = { '✏️': 'pencil', '✏': 'pencil', '🖍️': 'crayon', '🖍': 'crayon', '🎀': 'ribbon', '🐛': 'caterpillar' };
const CUBE_COLOURS: Record<string, string> = {
  '🟩': '#6CC46A', '🟦': '#5B9BE8', '🟧': '#F39A45', '🟨': '#F6CB3E', '🟪': '#A981E0', '🟫': '#B07A4A', '⬜': '#E9ECF0', '🟥': '#F08A5D', cube: '#5B9BE8',
};

function objectName(e: string) { return OBJECT_NAMES[e] ?? 'object'; }
function unitName(u: string) { return u === '📎' ? 'paper clip' : CUBE_COLOURS[u] ? 'cube' : 'unit'; }

/** The object, its left end at x, exactly w wide, centred on cy. */
function ObjectArt({ emoji, x, w, cy }: { emoji: string; x: number; w: number; cy: number }) {
  const name = OBJECT_NAMES[emoji];
  if (name === 'pencil') {
    const h = 26, t = cy - h / 2;
    return (
      <g strokeLinejoin="round">
        <path d={`M${x + 8},${t} h10 v${h} h-10 a8,8 0 0,1 -8,-8 v-${h - 16} a8,8 0 0,1 8,-8z`} fill="#F49AB0" stroke="#B85A72" strokeWidth={2} />
        <rect x={x + 18} y={t - 1} width={12} height={h + 2} fill="#C9CED4" stroke="#7D848C" strokeWidth={2} />
        <line x1={x + 22} y1={t} x2={x + 22} y2={t + h} stroke="#7D848C" strokeWidth={1.5} />
        <line x1={x + 26} y1={t} x2={x + 26} y2={t + h} stroke="#7D848C" strokeWidth={1.5} />
        <rect x={x + 30} y={t} width={w - 30 - 30} height={h} fill="#FFC93C" stroke="#C99A16" strokeWidth={2} />
        <rect x={x + 30} y={t + h / 3} width={w - 60} height={h / 3} fill="#FFDB6E" />
        <path d={`M${x + w - 30},${t} L${x + w},${cy} L${x + w - 30},${t + h} Z`} fill="#F2D2A0" stroke="#C49A5E" strokeWidth={2} />
        <path d={`M${x + w - 10},${cy - 4.3} L${x + w},${cy} L${x + w - 10},${cy + 4.3} Z`} fill="#3A3F4B" />
      </g>
    );
  }
  if (name === 'crayon') {
    const h = 26, t = cy - h / 2, body = w - 24;
    return (
      <g strokeLinejoin="round">
        <rect x={x} y={t} width={body} height={h} rx={4} fill="#5B9BE8" stroke="#2F6DB8" strokeWidth={2} />
        <rect x={x + body * 0.18} y={t} width={body * 0.64} height={h} fill="#A9CBF5" stroke="#2F6DB8" strokeWidth={1.5} />
        <path d={`M${x + body * 0.18 + 6},${cy - 4} q6,-5 12,0 t12,0 M${x + body * 0.18 + 6},${cy + 4} q6,-5 12,0 t12,0`} fill="none" stroke="#2F6DB8" strokeWidth={1.5} />
        <path d={`M${x + body},${t + 3} L${x + w - 3},${cy - 3} Q${x + w},${cy} ${x + w - 3},${cy + 3} L${x + body},${t + h - 3} Z`} fill="#5B9BE8" stroke="#2F6DB8" strokeWidth={2} />
      </g>
    );
  }
  if (name === 'ribbon') {
    const h = 22, t = cy - h / 2;
    return (
      <g strokeLinejoin="round">
        <path d={`M${x},${t} H${x + w} L${x + w - 10},${cy} L${x + w},${t + h} H${x} L${x + 10},${cy} Z`} fill="#EE7FB3" stroke="#B94A80" strokeWidth={2} />
        <line x1={x + 10} y1={t + 5} x2={x + w - 10} y2={t + 5} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 5" />
        <line x1={x + 10} y1={t + h - 5} x2={x + w - 10} y2={t + h - 5} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 5" />
      </g>
    );
  }
  if (name === 'caterpillar') {
    const r = 15, n = Math.max(2, Math.round((w - 2 * r) / (r * 1.2)) + 1);
    const step = (w - 2 * r) / (n - 1);
    return (
      <g>
        {Array.from({ length: n }, (_, i) => {
          const cx = x + r + i * step, head = i === n - 1;
          return (
            <g key={i}>
              {!head && <line x1={cx} y1={cy + r - 2} x2={cx} y2={cy + r + 3} stroke="#4E9A49" strokeWidth={3} strokeLinecap="round" />}
              <circle cx={cx} cy={cy + (i % 2 ? 1.5 : -1.5)} r={r} fill={head ? '#A8DB6A' : i % 2 ? '#8FD18A' : '#7CC36F'} stroke="#4E9A49" strokeWidth={2} />
              {head && <>
                <circle cx={cx + 4} cy={cy - 5} r={3} fill={C.ink} /><circle cx={cx + 5} cy={cy - 6} r={1} fill="#fff" />
                <path d={`M${cx + 1},${cy + 5} q4,4 9,0`} fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
                <line x1={cx - 3} y1={cy - r + 1} x2={cx - 7} y2={cy - r - 7} stroke="#4E9A49" strokeWidth={2} strokeLinecap="round" />
              </>}
            </g>
          );
        })}
      </g>
    );
  }
  // Any other object: its emoji, stretched to exactly w.
  return (
    <text x={x} y={cy} dominantBaseline="central" textLength={w} lengthAdjust="spacingAndGlyphs" style={{ fontSize: 38 }}>{emoji}</text>
  );
}

function UnitArt({ unit, x, y }: { unit: string; x: number; y: number }) {
  if (unit === '📎') {
    const cy = y + UNIT_H / 2;
    // A paper clip lying flat: an outer loop, an inner loop, end to end in one unit.
    return (
      <path d={`M${x + 12},${cy + 7} H${x + U - 8} a7,7 0 0,0 0,-14 H${x + 7} a5.5,5.5 0 0,0 0,11 H${x + U - 10} a3.5,3.5 0 0,0 0,-7 H${x + 14}`}
        fill="none" stroke="#7D8794" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    );
  }
  const colour = CUBE_COLOURS[unit];
  if (colour) {
    const s = U - 2;
    return (
      <g>
        <rect x={x + 1} y={y + 1} width={s} height={s} rx={5} fill={colour} stroke="#00000055" strokeWidth={2} />
        <rect x={x + 9} y={y + 9} width={s - 16} height={s - 16} rx={3} fill="#fff" opacity={0.28} />
      </g>
    );
  }
  return <text x={x + U / 2} y={y + UNIT_H / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: U * 0.78 }}>{unit}</text>;
}

export default function Measure({ state, onChange, size = 'big' }: ModelProps<'measure'>) {
  const live = !!onChange;
  const { length, placed, unit, object, gaps } = state;
  const shown = useLeaving(placed);
  const at = (i: number) => PAD + (gaps ? badOffset(i) : i) * U;

  const reach = gaps ? badOffset(Math.max(placed, 1) - 1) + 1 : placed;
  const slots = Math.max(length, Math.ceil(reach), live ? maxPlacedOf(state) : 0);
  const vbW = PAD * 2 + slots * U;
  const vbH = UNIT_Y + UNIT_H + 14;
  const objW = length * U;
  const canAdd = live && placed < maxPlacedOf(state);

  const label = `A ${objectName(object)} ${length} units long, with ${placed} ${unitName(unit)}${placed === 1 ? '' : 's'} laid under it${gaps ? ', with gaps' : ''}`;

  return (
    <div style={{ maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      <svg viewBox={`0 0 ${vbW} ${vbH}`} {...svgBox(vbW, vbH, size === 'small' ? Math.min(0.5, 150 / vbW) : 1.12)} role={live ? 'group' : 'img'} aria-label={label}>
        {/* A table edge to rest on. */}
        <rect x={4} y={UNIT_Y - 6} width={vbW - 8} height={UNIT_H + 12} rx={10} fill={C.paperDeep} />
        {[PAD, PAD + objW].map((gx) => (
          <line key={gx} x1={gx} y1={OBJ_Y - 6} x2={gx} y2={UNIT_Y + UNIT_H + 4} stroke={C.inkSoft} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 4" />
        ))}
        <ObjectArt emoji={object} x={PAD} w={objW} cy={OBJ_Y + OBJ_H / 2} />

        {Array.from({ length: shown }, (_, i) => (
          <g key={i} className={i >= placed ? 'mb-out' : 'mb-drop'} style={{ animationDelay: live ? '0s' : `${Math.min(i, 12) * 0.06}s` }}>
            <UnitArt unit={unit} x={at(i)} y={UNIT_Y} />
          </g>
        ))}

        {canAdd && (
          <g pointerEvents="none">
            <rect className="mb-glow" x={at(placed) + 3} y={UNIT_Y + 3} width={U - 6} height={UNIT_H - 6} rx={8} fill="#fff" stroke={C.navy} strokeWidth={2.5} strokeDasharray="5 4" />
            <text x={at(placed) + U / 2} y={UNIT_Y + UNIT_H / 2 + 1} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: KID_FONT, fontWeight: 700, fontSize: 28, fill: C.navy }}>+</text>
          </g>
        )}
        {/* Tap targets: anywhere past the last unit lays one; the last unit takes it back. Taller than the unit, for small fingers. */}
        {canAdd && (
          <rect x={at(placed)} y={UNIT_Y - 14} width={vbW - at(placed)} height={UNIT_H + 28} fill="transparent" {...tapProps('Lay another', () => onChange!(placeUnit(state)))} />
        )}
        {live && placed > 0 && (
          <rect x={at(placed - 1) - 4} y={UNIT_Y - 14} width={U + 4} height={UNIT_H + 28} fill="transparent" {...tapProps('Take the last one back', () => onChange!(removeUnit(state)))} />
        )}
      </svg>
    </div>
  );
}

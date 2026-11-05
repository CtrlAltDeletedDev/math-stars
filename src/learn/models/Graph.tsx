import { ModelProps } from './types';
import { C, KID_FONT } from '@/next/theme';
import { ModelStyles, svgBox, tapProps, useLeaving } from './b-shared';
import { addToRow, graphCap, graphColumns, removeFromRow } from './logic-b';

// A picture graph: one row per thing, its picture and name on the left, then
// one picture per vote in a light grid, every picture in its own column so
// the rows can be compared by length. Column numbers run along the bottom.
// In "do" she taps the end of a row to add one, or the last picture to take
// it back.

const LABEL_W = 92;
const CELL = 52;
const ROW_H = 62;
const TOP = 8;
const AXIS_H = 30;
const RIGHT = 10;

type Row = { emoji: string; label: string; count: number };

function GraphRow({ row, cols, y, canAdd, onAdd, onRemove }: {
  row: Row; cols: number; y: number; canAdd: boolean; onAdd?: () => void; onRemove?: () => void;
}) {
  const shown = useLeaving(row.count);
  const cx = (i: number) => LABEL_W + i * CELL + CELL / 2;
  const cy = y + ROW_H / 2;
  const fontSize = row.label.length > 8 ? 12 : 14;
  return (
    <g>
      <text x={LABEL_W / 2} y={y + 25} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 30 }}>{row.emoji}</text>
      <text x={LABEL_W / 2} y={y + 51} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: KID_FONT, fontWeight: 600, fontSize, fill: C.inkSoft }}>{row.label}</text>
      {Array.from({ length: shown }, (_, i) => (
        <text key={i} className={i >= row.count ? 'mb-out' : 'mb-drop'} x={cx(i)} y={cy + 1} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 34 }}>
          {row.emoji}
        </text>
      ))}
      {canAdd && row.count < cols && (
        <g pointerEvents="none" className="mb-glow">
          <rect x={cx(row.count) - CELL / 2 + 6} y={y + 7} width={CELL - 12} height={ROW_H - 14} rx={10} fill="#fff" stroke={C.navy} strokeWidth={2.5} strokeDasharray="5 4" />
          <text x={cx(row.count)} y={cy + 1} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: KID_FONT, fontWeight: 700, fontSize: 28, fill: C.navy }}>+</text>
        </g>
      )}
      {onAdd && canAdd && row.count < cols && (
        <rect x={LABEL_W + row.count * CELL} y={y} width={(cols - row.count) * CELL + RIGHT} height={ROW_H} fill="transparent"
          {...tapProps(`Add a ${row.label}`, onAdd)} />
      )}
      {onRemove && row.count > 0 && (
        <rect x={LABEL_W + (row.count - 1) * CELL - 4} y={y} width={CELL + 4} height={ROW_H} fill="transparent"
          {...tapProps(`Take away a ${row.label}`, onRemove)} />
      )}
    </g>
  );
}

export default function Graph({ state, onChange, size = 'big' }: ModelProps<'graph'>) {
  const live = !!onChange;
  const cap = graphCap(state);
  // In "do" with no `max`, keep one spare column so there is always a next spot.
  const cols = live && state.max == null
    ? Math.min(cap, Math.max(graphColumns(state), ...state.rows.map((r) => r.count + 1)))
    : graphColumns(state);
  const rows = state.rows;
  const vbW = LABEL_W + cols * CELL + RIGHT;
  const plotH = rows.length * ROW_H;
  const vbH = TOP + plotH + AXIS_H;
  const label = `Picture graph: ${rows.map((r) => `${r.label} ${r.count}`).join(', ')}`;
  const scale = size === 'small' ? Math.min(0.42, 150 / vbW) : 1.1;

  return (
    <div style={{ maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      <svg viewBox={`0 0 ${vbW} ${vbH}`} {...svgBox(vbW, vbH, scale)} role={live ? 'group' : 'img'} aria-label={label}>
        <rect x={LABEL_W} y={TOP} width={cols * CELL} height={plotH} rx={6} fill="#fff" stroke={C.line} strokeWidth={2} />
        {rows.map((_, r) => r % 2 === 1 && (
          <rect key={`band${r}`} x={LABEL_W + 1} y={TOP + r * ROW_H} width={cols * CELL - 2} height={ROW_H} fill={C.paper} />
        ))}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`v${i}`} x1={LABEL_W + (i + 1) * CELL} y1={TOP} x2={LABEL_W + (i + 1) * CELL} y2={TOP + plotH} stroke={C.line} strokeWidth={1.5} />
        ))}
        {rows.map((_, r) => r > 0 && (
          <line key={`h${r}`} x1={6} y1={TOP + r * ROW_H} x2={LABEL_W + cols * CELL} y2={TOP + r * ROW_H} stroke={C.line} strokeWidth={1.5} />
        ))}
        <line x1={LABEL_W} y1={TOP} x2={LABEL_W} y2={TOP + plotH} stroke={C.inkSoft} strokeOpacity={0.6} strokeWidth={3} />
        {Array.from({ length: cols }, (_, i) => (
          <text key={`n${i}`} x={LABEL_W + i * CELL + CELL / 2} y={TOP + plotH + AXIS_H / 2 + 2} textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: KID_FONT, fontWeight: 600, fontSize: 16, fill: C.inkSoft }}>{i + 1}</text>
        ))}
        {rows.map((row, r) => (
          <GraphRow key={r} row={row} cols={cols} y={TOP + r * ROW_H} canAdd={live && row.count < cap}
            onAdd={live ? () => onChange!(addToRow(state, r)) : undefined}
            onRemove={live ? () => onChange!(removeFromRow(state, r)) : undefined} />
        ))}
      </svg>
    </div>
  );
}

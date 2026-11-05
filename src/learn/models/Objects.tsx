import { CSSProperties } from 'react';
import { ModelProps } from './types';
import { KID_FONT } from '@/next/theme';
import { COL, CrossX, MotionStyles, tap } from './a-shared';
import { countObject, objectsLabel, scatterGrid, scatterPositions } from './logic-a';

// Things to count: in rows of five (so 7 is "a row and 2"), or `scattered`
// in a heap that is the same every time for the same count. Crossed-out
// things fade behind an orange X and are not counted.
//
// In "do", each tap on an uncounted thing gives it the next number, in a
// badge (1, 2, 3...). Tapping the last one counted takes its number back, so
// a slip is undone the way she made it.

const SIZES = {
  big: { cell: 72, box: 400, badge: 0.34 },
  small: { cell: 34, box: 180, badge: 0.4 },
};

export default function Objects({ state, onChange, size = 'big' }: ModelProps<'objects'>) {
  const S = SIZES[size];
  const count = Math.max(0, state.count);
  const crossed = new Set(state.crossed ?? []);
  const order = new Map(state.counted.map((i, k) => [i, k + 1]));
  const live = !!onChange;
  const last = state.counted[state.counted.length - 1];

  const item = (i: number, style: CSSProperties, emojiPx: string) => {
    const n = order.get(i);
    const isCrossed = crossed.has(i);
    const tappable = live && !isCrossed && (n === undefined || i === last);
    const inner = (
      <>
        <span
          aria-hidden
          style={{
            fontSize: emojiPx, lineHeight: 1, display: 'block',
            opacity: isCrossed ? 0.32 : 1,
            transform: n !== undefined ? 'scale(1.06)' : 'scale(1)',
            transition: 'opacity .35s ease, transform .25s ease',
          }}
        >{state.emoji}</span>
        {isCrossed && <span aria-hidden className="ma-fade" style={{ position: 'absolute', inset: '8%' }}><CrossX width={10} /></span>}
        {n !== undefined && (
          <span
            key={n}
            aria-hidden
            className="ma-pop"
            style={{
              position: 'absolute', right: '-4%', top: '-6%',
              minWidth: `${S.badge * 100}%`, height: `${S.badge * 100}%`, padding: '0 3px', boxSizing: 'border-box',
              borderRadius: 999, background: COL.b, color: '#fff',
              fontFamily: KID_FONT, fontWeight: 600, fontSize: `calc(${emojiPx} * 0.42)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 0 rgba(0,0,0,0.15)',
            }}
          >{n}</span>
        )}
      </>
    );
    const base: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style };
    if (!live) return <div key={i} style={base}>{inner}</div>;
    const what = isCrossed ? 'crossed out' : n !== undefined ? `counted ${n}` : 'not counted';
    return (
      <button
        key={i}
        type="button"
        className="ma-btn"
        aria-label={`${state.emoji} ${i + 1}, ${what}`}
        aria-disabled={!tappable}
        {...tap(() => {
          const next = countObject(state, i);
          if (next !== state) onChange!(next);
        })}
        style={{ ...base, borderRadius: 14, cursor: tappable ? 'pointer' : 'default' }}
      >{inner}</button>
    );
  };

  const wrap: CSSProperties = { display: 'flex', justifyContent: 'center', userSelect: 'none', WebkitUserSelect: 'none' };

  if (state.scattered) {
    const pos = scatterPositions(count);
    const { cols, rows } = scatterGrid(count);
    // Each thing gets the space of one cell of the loose grid; the heap is 4:3.
    const cellW = Math.min(1 / cols, 0.75 / rows); // as a fraction of the width
    const boxPx = Math.min(S.box, S.cell * 5);
    return (
      <div className="ma-m" role={live ? 'group' : 'img'} aria-label={objectsLabel(state)} style={wrap}>
        <MotionStyles />
        {/* A one-track grid gives the heap a natural width that can still shrink. */}
        <div style={{ display: 'grid', gridTemplateColumns: `minmax(0, ${boxPx}px)` }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', containerType: 'inline-size' }}>
          {pos.map((p, i) => item(i, {
            position: 'absolute',
            left: `${(p.x - cellW / 2) * 100}%`,
            top: `${((p.y * 0.75 - cellW / 2) / 0.75) * 100}%`,
            width: `${cellW * 100}%`,
            aspectRatio: '1',
          }, `${cellW * 100 * 0.62}cqw`))}
        </div>
        </div>
      </div>
    );
  }

  const cols = Math.max(1, Math.min(5, count));
  return (
    <div className="ma-m" role={live ? 'group' : 'img'} aria-label={objectsLabel(state)} style={wrap}>
      <MotionStyles />
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, ${S.cell}px))`,
        rowGap: size === 'big' ? 6 : 2,
        containerType: 'inline-size',
      }}>
        {Array.from({ length: count }, (_, i) => item(i, { aspectRatio: '1 / 0.9', width: '100%' }, `${(100 / cols) * 0.6}cqw`))}
      </div>
    </div>
  );
}

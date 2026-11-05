import { CSSProperties } from 'react';
import { ModelProps } from './types';
import { CounterColour } from '../types';
import { COL, CrossX, MotionStyles, tap, usePrevious } from './a-shared';
import { tapTenFrameCell, tenFrameCells, tenFrameLabel, nextTrayCounter } from './logic-a';

// One or two ten frames: the picture first-grade classes use for every fact
// within 20. Counters are teal for the first number and navy for the second;
// taken-away counters fade behind a dashed orange ring and an X.
//
// In "do" (onChange given) every cell is a big button:
//   empty cell        -> the next tray counter goes there ('a' first, then 'b').
//                        It lands where they tapped: no snapping to the first
//                        empty cell, so the frame shows what they did.
//   counter           -> back to the tray, or with `takeAway`, crossed out
//                        (tap again to un-cross).
// See logic-a.ts for the rules, including the endless supply when there is no tray.

const SIZES = {
  big: { frame: 360, tray: 30, gap: 14, rule: 4 },
  small: { frame: 168, tray: 14, gap: 8, rule: 2 },
};

export default function TenFrame({ state, onChange, size = 'big' }: ModelProps<'tenFrame'>) {
  const S = SIZES[size];
  const cells = tenFrameCells(state);
  const prev = usePrevious(cells);
  const crossed = new Set(state.crossed ?? []);
  const live = !!onChange;

  // When several counters arrive at once (a show step), they pop in one after
  // another in reading order, so they can see "and 4 more" arrive.
  const arriving = cells.map((c, i) => c !== null && prev !== undefined && prev[i] !== c);
  const rank: number[] = [];
  let k = 0;
  arriving.forEach((a, i) => { rank[i] = a ? k++ : 0; });
  const stagger = k > 1 ? Math.min(110, 900 / k) : 0;

  const frames = Array.from({ length: state.frames }, (_, f) => f);
  const label = tenFrameLabel(state);

  return (
    <div
      className="ma-m"
      role={live ? 'group' : 'img'}
      aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: S.gap, userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <MotionStyles />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: S.gap, maxWidth: '100%' }}>
        {frames.map((f) => (
          <div
            key={f}
            style={{
              display: 'grid',
              // Tracks of minmax(0, cell): the frame's natural width is S.frame,
              // but it can always shrink to fit, even inside a shrink-to-fit parent.
              gridTemplateColumns: `repeat(5, minmax(0, ${(S.frame - 5 * S.rule) / 5}px))`,
              gap: S.rule,
              padding: S.rule,
              background: COL.frame,
              borderRadius: size === 'big' ? 14 : 8,
              boxShadow: size === 'big' ? '0 4px 0 rgba(34,37,43,0.12)' : undefined,
              boxSizing: 'border-box',
            }}
          >
            {cells.slice(f * 10, f * 10 + 10).map((c, j) => {
              const i = f * 10 + j;
              return (
                <Cell
                  key={i}
                  index={i}
                  colour={c}
                  lastColour={c ?? prev?.[i] ?? 'a'}
                  crossed={c !== null && crossed.has(i)}
                  delay={arriving[i] ? rank[i] * stagger : 0}
                  size={size}
                  onTap={live ? () => {
                    const next = tapTenFrameCell(state, i);
                    if (next !== state) onChange!(next);
                  } : undefined}
                  canPlace={live && nextTrayCounter(state) !== null}
                />
              );
            })}
          </div>
        ))}
      </div>
      {state.tray && <Tray a={state.tray.a} b={state.tray.b} px={S.tray} size={size} />}
    </div>
  );
}

function Cell({ index, colour, lastColour, crossed, delay, size, onTap, canPlace }: {
  index: number;
  colour: CounterColour | null;
  lastColour: CounterColour;
  crossed: boolean;
  delay: number;
  size: 'big' | 'small';
  onTap?: () => void;
  canPlace: boolean;
}) {
  const filled = colour !== null;
  const fill = COL[lastColour];
  const box: CSSProperties = {
    position: 'relative',
    aspectRatio: '1',
    background: COL.cellBg,
    borderRadius: size === 'big' ? 10 : 5,
    display: 'block',
    width: '100%',
  };
  const counter = (
    <>
      {/* Always drawn, scaled away when empty, so placing and removing both move. */}
      <span
        aria-hidden
        style={{
          position: 'absolute', left: '12%', top: '12%', width: '76%', height: '76%',
          borderRadius: '50%',
          background: fill,
          boxShadow: `inset 0 -${size === 'big' ? 4 : 2}px 0 rgba(0,0,0,0.16)`,
          transform: filled ? 'scale(1)' : 'scale(0)',
          opacity: filled ? (crossed ? 0.32 : 1) : 0,
          transition: `transform .34s cubic-bezier(.34,1.56,.64,1) ${delay}ms, opacity .3s ease ${filled ? delay : 0}ms`,
        }}
      />
      {crossed && (
        <span aria-hidden className="ma-fade" style={{ position: 'absolute', inset: '6%' }}>
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `${size === 'big' ? 3 : 2}px dashed ${COL.cross}`,
          }} />
          <span style={{ position: 'absolute', inset: '14%' }}><CrossX width={size === 'big' ? 11 : 13} /></span>
        </span>
      )}
    </>
  );

  if (!onTap) return <div style={box}>{counter}</div>;
  const what = !filled ? 'empty' : crossed ? 'crossed out counter' : 'counter';
  return (
    <button
      type="button"
      className="ma-btn"
      aria-label={`Square ${index + 1}, ${what}`}
      disabled={!filled && !canPlace}
      {...tap(onTap)}
      style={{ ...box, cursor: !filled && !canPlace ? 'default' : 'pointer' }}
    >
      {counter}
    </button>
  );
}

/** The counters waiting below the frame: first-number ones, then second-number ones. */
function Tray({ a, b, px, size }: { a: number; b: number; px: number; size: 'big' | 'small' }) {
  const all: CounterColour[] = [...Array<CounterColour>(Math.max(0, a)).fill('a'), ...Array<CounterColour>(Math.max(0, b)).fill('b')];
  const gap = size === 'big' ? 8 : 4;
  return (
    <div
      aria-hidden
      style={{
        minHeight: px + gap * 2,
        minWidth: size === 'big' ? 120 : 60,
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: gap,
        borderRadius: 999,
        background: all.length ? '#EFE6D2' : 'transparent',
        border: all.length ? '2px solid transparent' : `2px dashed ${COL.frame}33`,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap,
        transition: 'background .3s ease',
      }}
    >
      {all.map((c, i) => (
        <span
          key={`${c}${c === 'a' ? i : i - a}`}
          className="ma-pop"
          style={{
            width: px, height: px, borderRadius: '50%', background: COL[c], flexShrink: 0,
            boxShadow: `inset 0 -${size === 'big' ? 3 : 2}px 0 rgba(0,0,0,0.16)`,
          }}
        />
      ))}
    </div>
  );
}

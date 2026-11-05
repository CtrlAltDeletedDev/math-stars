import { useCallback, useEffect, useRef, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { ModelProps } from './types';
import { ICON_STROKE } from '@/components/ui/icons';
import { KID_FONT } from '@/next/theme';
import { COL, MotionStyles, tap, usePrevious, useWidth } from './a-shared';
import { hereOf, hop, hopsOf, numberLineLabel, numberLineWindow, tapNumberLine, undoHop } from './logic-a';

// A number line she can hop along. Forward hops arc in green, back hops in
// orange, and each hop is numbered, because counting the hops is the skill.
//
// The line is drawn at the width it is given and never shrinks the numbers
// below what a six-year-old can read: if the whole of min..max does not fit,
// it shows a window around the start and the hops (logic-a numberLineWindow).
// With `jumps` the ticks are that far apart (0–100 by tens), with small ticks
// for the ones in between where there is room.
//
// In "do": the first tap on the line sets the start; each later tap hops, one
// hop at a time, to the number tapped (the whole height of the line is the
// hit area). Below it: undo, and a hop-back / hop-forward pair, so a finger
// that cannot hit "13" exactly can still make every hop.

const DIM = {
  big: { h: 156, lineY: 106, pad: 24, minUnit: 27, ideal: 48, maxW: 760, font: 20, hopFont: 15, lift: 32, guess: 360, btn: 56 },
  small: { h: 90, lineY: 62, pad: 14, minUnit: 21, ideal: 28, maxW: 340, font: 13, hopFont: 10, lift: 20, guess: 180, btn: 44 },
};
const HOP_MS = 380;

export default function NumberLine({ state, onChange, size = 'big' }: ModelProps<'numberLine'>) {
  const D = DIM[size];
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = Math.max(120, useWidth(scrollRef, D.guess));
  // A start the lesson gave is not hers to undo.
  const givenStart = useRef(state.start);
  const keepStart = state.start !== null && state.start === givenStart.current;
  const live = !!onChange;

  const step = state.jumps && state.jumps > 0 ? state.jumps : 1;
  const allTicks = Math.floor((state.max - state.min) / step) + 1;
  const room = Math.floor((visible - 2 * D.pad) / D.minUnit) + 1;
  // Too long to fit at a readable size: a picture shows a window around the
  // hops; her own line keeps every number and scrolls sideways instead, so
  // she can still start anywhere (it follows her as she hops).
  const scroll = live && allTicks > room && allTicks <= 61;
  const win = numberLineWindow(state, scroll ? allTicks : room);
  const ticks = Math.round((win.hi - win.lo) / win.step);
  const W = scroll ? 2 * D.pad + ticks * D.minUnit : visible;
  const unit = (W - 2 * D.pad) / Math.max(1, ticks); // px per tick
  // How wide she would like to be: roomy, not stretched.
  const natural = Math.min(D.maxW, Math.max(size === 'big' ? 280 : 160, 2 * D.pad + (allTicks - 1) * D.ideal));
  const perOne = unit / win.step;
  const x = (n: number) => D.pad + (n - win.lo) * perOne;

  const hops = hopsOf(state);
  const here = hereOf(state);
  const prevLen = usePrevious(state.path.length) ?? state.path.length;
  const firstNew = Math.min(prevLen, hops.length);
  const lastHop = hops[hops.length - 1];
  const hereColour = !lastHop ? COL.ink : lastHop.to > lastHop.from ? COL.forward : COL.back;
  // The dot moves when the last new hop has been drawn.
  const dotDelay = Math.max(0, hops.length - firstNew - 1) * HOP_MS + 220;

  const L = D.lineY;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => win.lo + i * win.step);
  const minor: number[] = [];
  if (win.step > 1 && perOne >= 5) {
    for (let n = win.lo; n <= win.hi; n++) if ((n - win.lo) % win.step !== 0) minor.push(n);
  }
  // Numbers off the tick grid she started on or landed on get a label of their own.
  const extraLabels = [state.start, here].filter((n): n is number =>
    n !== null && (n - win.lo) % win.step !== 0 && n >= win.lo && n <= win.hi);
  const fontFor = (n: number) => Math.min(D.font, String(n).length >= 3 ? unit * 0.42 : unit * 0.6);

  function onLineTap(e: { clientX: number; currentTarget: Element }) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const n = Math.round(win.lo + (px - D.pad) / perOne);
    const next = tapNumberLine(state, Math.max(state.min, Math.min(state.max, n)));
    if (next !== state) onChange!(next);
  }

  const canBack = here !== null && hop(state, -1) !== state;
  const canFwd = here !== null && hop(state, 1) !== state;
  const canUndo = undoHop(state, keepStart) !== state;

  // On a line that scrolls, the edge that has more beyond it fades out, so
  // the cut reads as "keeps going" rather than clipped.
  const [edges, setEdges] = useState({ l: false, r: false });
  const readEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !scroll) { setEdges((e) => (e.l || e.r ? { l: false, r: false } : e)); return; }
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((e) => (e.l === l && e.r === r ? e : { l, r }));
  }, [scroll]);
  useEffect(readEdges, [readEdges, W, visible]);
  const fade = 28;
  const mask = scroll && (edges.l || edges.r)
    ? `linear-gradient(to right, ${edges.l ? 'transparent' : '#000'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edges.r ? 'transparent' : '#000'} 100%)`
    : undefined;

  // Keep where she is in view on a line that scrolls.
  const hereX = here === null ? null : x(here);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || hereX === null) return;
    const margin = unit * 2.5;
    let to = el.scrollLeft;
    if (hereX - margin < el.scrollLeft) to = hereX - margin;
    else if (hereX + margin > el.scrollLeft + el.clientWidth) to = hereX + margin - el.clientWidth;
    if (to !== el.scrollLeft) el.scrollTo?.({ left: Math.max(0, to), behavior: 'smooth' });
  }, [hereX, unit]);

  // A hop over the same step as an earlier one (back over a forward hop)
  // arcs higher, so the two never sit on top of each other.
  const levels: number[] = [];
  hops.forEach((h, i) => {
    const key = (o: { from: number; to: number }) => `${Math.min(o.from, o.to)}:${Math.max(o.from, o.to)}`;
    levels[i] = hops.slice(0, i).filter((o) => key(o) === key(h)).length;
  });

  return (
    <div
      className="ma-m"
      role={live ? 'group' : 'img'}
      aria-label={numberLineLabel(state)}
      style={{
        // One track of minmax(0, natural): roomy when there is room, never wider than its parent.
        display: 'grid', gridTemplateColumns: `minmax(0, ${natural}px)`, justifyContent: 'center', justifyItems: 'center',
        rowGap: 8, userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      <MotionStyles />
      <div
        ref={scrollRef}
        data-scrolls={scroll ? '' : undefined}
        onScroll={scroll ? readEdges : undefined}
        style={scroll ? {
          width: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', overscrollBehaviorX: 'contain',
          maskImage: mask, WebkitMaskImage: mask,
        } : { width: '100%' }}
      >
      <svg
        viewBox={`0 0 ${W} ${D.h}`}
        width={W}
        height={D.h}
        aria-hidden
        className={live ? 'ma-tap' : undefined}
        {...(live ? tap(onLineTap) : {})}
        style={{ display: 'block', maxWidth: scroll ? 'none' : '100%', height: 'auto', overflow: 'hidden', touchAction: 'manipulation', fontFamily: KID_FONT }}
      >
        {/* The whole height is the hit area: she taps near a number, not on a 2px tick. */}
        <rect x="0" y="0" width={W} height={D.h} fill="transparent" />

        <g>

          <line x1={4} y1={L} x2={W - 4} y2={L} stroke={COL.ink} strokeWidth={size === 'big' ? 3 : 2} strokeLinecap="round" />
          {/* Arrow ends: the line keeps going. */}
          {[[4, -1], [W - 4, 1]].map(([ex, d]) => (
            <path key={ex} d={`M ${ex - d * 9} ${L - 6} L ${ex} ${L} L ${ex - d * 9} ${L + 6}`} fill="none" stroke={COL.ink} strokeWidth={size === 'big' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {minor.map((n) => (
            <line key={`m${n}`} x1={x(n)} y1={L - 5} x2={x(n)} y2={L + 5} stroke={COL.soft} strokeOpacity={0.55} strokeWidth={1.5} />
          ))}
          {tickValues.map((n) => {
            const big = n % (win.step * 5) === 0;
            const isHere = n === here && hops.length > 0;
            return (
              <g key={n}>
                <line x1={x(n)} y1={L - (big ? 11 : 8)} x2={x(n)} y2={L + (big ? 11 : 8)} stroke={COL.ink} strokeWidth={big ? 3 : 2} strokeLinecap="round" />
                <text
                  x={x(n)} y={L + D.font + (size === 'big' ? 14 : 8)}
                  textAnchor="middle"
                  style={{
                    fontWeight: n === state.start || isHere ? 700 : 500,
                    fontSize: fontFor(n),
                    fill: isHere ? hereColour : COL.ink,
                    transition: `fill .2s ease ${isHere ? dotDelay : 0}ms`,
                  }}
                >{n}</text>
              </g>
            );
          })}
          {extraLabels.map((n) => (
            <g key={`x${n}`}>
              <line x1={x(n)} y1={L - 8} x2={x(n)} y2={L + 8} stroke={COL.ink} strokeWidth={2} />
              <text x={x(n)} y={L + D.font + (size === 'big' ? 14 : 8)} textAnchor="middle"
                style={{ fontWeight: 700, fontSize: fontFor(n), fill: n === here && hops.length ? hereColour : COL.ink }}>{n}</text>
            </g>
          ))}

          {state.start !== null && (
            <circle
              key={`start${state.start}`}
              className="ma-pop"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              cx={x(state.start)} cy={L + D.font * 0.62 + (size === 'big' ? 14 : 8)}
              r={Math.min(unit * 0.52, Math.max(D.font * 0.95, String(state.start).length * D.font * 0.42))}
              fill="none" stroke={COL.b} strokeWidth={size === 'big' ? 3 : 2}
            />
          )}
          {/* Where she is: on the line, under the arcs, so the last arrowhead stays crisp. */}
          {here !== null && (
            <g style={{ transform: `translateX(${x(here)}px)`, transition: `transform .3s ease ${hops.length > firstNew ? dotDelay - 220 : 0}ms` }}>
              <circle cx={0} cy={L} r={size === 'big' ? 9 : 5.5} fill={hereColour} stroke="#fff" strokeWidth={size === 'big' ? 3 : 2}
                style={{ transition: `fill .2s ease ${dotDelay}ms` }} />
            </g>
          )}
          {hops.map((h, i) => {
            const x1 = x(h.from), x2 = x(h.to);
            const span = Math.abs(x2 - x1);
            const lift = Math.min(span * 0.55 + D.lift * 0.4, L - D.hopFont * 2.2) + levels[i] * D.lift;
            const peakY = Math.max(D.hopFont + 6, L - 4 - lift);
            const mid = (x1 + x2) / 2;
            const fwd = h.to > h.from;
            const colour = fwd ? COL.forward : COL.back;
            const isNew = i >= firstNew;
            const delay = isNew ? (i - firstNew) * HOP_MS : 0;
            // The arrowhead follows the curve's own direction where she lands.
            const cy = 2 * peakY - (L - 4);
            const tx = x2 - mid, ty = (L - 4) - cy;
            const tl = Math.hypot(tx, ty) || 1;
            const ux = tx / tl, uy = ty / tl;
            const head = size === 'big' ? 10 : 6;
            const wing = (a: number) => {
              const c = Math.cos(a), sn = Math.sin(a);
              return `${x2 - head * (ux * c - uy * sn)} ${L - 4 - head * (ux * sn + uy * c)}`;
            };
            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${L - 4} Q ${mid} ${2 * peakY - (L - 4)} ${x2} ${L - 4}`}
                  pathLength={1}
                  strokeDasharray="1"
                  className={isNew ? 'ma-draw' : undefined}
                  style={{ animationDelay: `${delay}ms` }}
                  fill="none" stroke={colour} strokeWidth={size === 'big' ? 4 : 2.5} strokeLinecap="round"
                />
                {/* Arrowhead where she lands. */}
                <path
                  d={`M ${wing(0.5)} L ${x2} ${L - 4} L ${wing(-0.5)}`}
                  className={isNew ? 'ma-fade' : undefined}
                  style={{ animationDelay: `${delay + HOP_MS * 0.7}ms` }}
                  fill="none" stroke={colour} strokeWidth={size === 'big' ? 4 : 2.5} strokeLinecap="round" strokeLinejoin="round"
                />
                <text
                  x={mid} y={peakY - (size === 'big' ? 7 : 4)}
                  textAnchor="middle"
                  className={isNew ? 'ma-fade' : undefined}
                  style={{ animationDelay: `${delay + HOP_MS * 0.5}ms`, fontWeight: 600, fontSize: D.hopFont, fill: colour }}
                >{i + 1}</text>
              </g>
            );
          })}
        </g>
      </svg>
      </div>

      {live && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size === 'big' ? 18 : 10, width: '100%' }}>
          <RoundButton label="Undo" size={D.btn} disabled={!canUndo} onTap={() => onChange!(undoHop(state, keepStart))}>
            <Undo2 size={D.btn * 0.46} strokeWidth={ICON_STROKE} color={COL.soft} aria-hidden />
          </RoundButton>
          <span style={{ width: size === 'big' ? 10 : 4 }} />
          <RoundButton label="Hop back" size={D.btn} disabled={!canBack} tint={COL.back} onTap={() => onChange!(hop(state, -1))}>
            <HopIcon dir={-1} px={D.btn * 0.62} />
          </RoundButton>
          <RoundButton label="Hop forward" size={D.btn} disabled={!canFwd} tint={COL.forward} onTap={() => onChange!(hop(state, 1))}>
            <HopIcon dir={1} px={D.btn * 0.62} />
          </RoundButton>
        </div>
      )}
    </div>
  );
}

function RoundButton({ label, size, disabled, tint, onTap, children }: {
  label: string; size: number; disabled: boolean; tint?: string; onTap: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="ma-btn"
      aria-label={label}
      disabled={disabled}
      {...tap(onTap)}
      style={{
        width: size, height: size, borderRadius: size / 2.6, flexShrink: 0,
        background: '#fff',
        boxShadow: `0 3px 0 ${tint ? tint + '55' : '#E4DAC6'}, inset 0 0 0 2px ${tint ? tint + '40' : '#E4DAC6'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity .2s ease',
      }}
    >
      {children}
    </button>
  );
}

/** A little hop: the same arc as on the line, in its colour. */
function HopIcon({ dir, px }: { dir: 1 | -1; px: number }) {
  const colour = dir === 1 ? COL.forward : COL.back;
  const [a, b] = dir === 1 ? [6, 34] : [34, 6];
  return (
    <svg viewBox="0 0 40 30" width={px} height={px * 0.75} aria-hidden>
      <path d={`M ${a} 25 Q 20 -6 ${b} 25`} fill="none" stroke={colour} strokeWidth="4.5" strokeLinecap="round" />
      <path d={`M ${b - dir * 1} 14 L ${b} 25 L ${b - dir * 10} 22`} fill="none" stroke={colour} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="27.5" x2="38" y2="27.5" stroke="#5B6270" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

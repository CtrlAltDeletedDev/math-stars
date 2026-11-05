import { PointerEvent as RPointerEvent, useRef, useState } from 'react';
import { ModelProps } from './types';
import { C } from '@/next/theme';
import { ModelStyles, NUM_FONT, bigButton, svgBox } from './b-shared';
import {
  angleDelta, clockToMinutes, clockWords, hourHandAngle, minuteHandAngle, setHourFromAngle, snapOf, snapTime, stepHour, stepMinute,
} from './logic-b';

// A real analogue clock: a blue case, a cream face, 1-12 in big round
// numerals, sixty minute marks. The hour hand is short, thick and navy; the
// minute hand long, thin and orange, so "which hand is which" is something
// they can see. The hour hand creeps toward the next hour as the minutes pass
// (halfway at half past), exactly as a real clock does.

const VB = 260;
const CX = VB / 2;
const R_CASE = 124;
const R_FACE = 110;
const HOUR_LEN = 56;
const MIN_LEN = 94;
/** Grab zones along the hands: nearer the middle than this is the hour hand, further out the minute hand. */
const HOUR_SPLIT = HOUR_LEN + 6;
export const HOUR_COLOUR = C.navy;
export const MINUTE_COLOUR = '#EC8526';

/** Rotate to the nearest equivalent angle, so a hand never spins the long way round. */
function useUnwrapped(angle: number): number {
  const [st, setSt] = useState({ raw: angle, out: angle });
  if (st.raw !== angle) {
    const out = st.out + angleDelta(st.raw, angle);
    setSt({ raw: angle, out });
    return out;
  }
  return st.out;
}

function HourHand() {
  return <path d={`M${CX - 7.5},${CX + 12} L${CX - 6},${CX - HOUR_LEN + 10} Q${CX},${CX - HOUR_LEN - 4} ${CX + 6},${CX - HOUR_LEN + 10} L${CX + 7.5},${CX + 12} Z`}
    fill={HOUR_COLOUR} stroke="#FFFDF6" strokeWidth={1.6} paintOrder="stroke" pointerEvents="none" />;
}

function MinuteHand() {
  // Thin, with a white edge, so a number it crosses still reads either side of it.
  return <path d={`M${CX - 3.6},${CX + 16} L${CX - 1.8},${CX - MIN_LEN + 6} Q${CX},${CX - MIN_LEN - 3} ${CX + 1.8},${CX - MIN_LEN + 6} L${CX + 3.6},${CX + 16} Z`}
    fill={MINUTE_COLOUR} stroke="#FFFDF6" strokeWidth={1.6} paintOrder="stroke" pointerEvents="none" />;
}

/** The face, numbers and marks: everything but the hands. */
function Face({ small }: { small?: boolean }) {
  return (
    <g>
      <circle cx={CX} cy={CX + 3} r={R_CASE} fill="#000" opacity={0.08} />
      <circle cx={CX} cy={CX} r={R_CASE} fill="#4FA3D9" />
      <circle cx={CX} cy={CX} r={R_CASE - 3} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <circle cx={CX} cy={CX} r={R_FACE} fill="#FFFDF6" stroke="#2F7DB3" strokeWidth={3} />
      {Array.from({ length: 60 }, (_, i) => {
        const hour = i % 5 === 0;
        const a = (i * 6 * Math.PI) / 180;
        const r1 = R_FACE - (hour ? 13 : 7), r2 = R_FACE - 3;
        return (
          <line key={i} x1={CX + r1 * Math.sin(a)} y1={CX - r1 * Math.cos(a)} x2={CX + r2 * Math.sin(a)} y2={CX - r2 * Math.cos(a)}
            stroke={C.ink} strokeOpacity={hour ? 0.85 : 0.35} strokeWidth={hour ? 3.5 : 1.6} strokeLinecap="round" />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        const r = R_FACE - 32;
        return (
          <text key={n} x={CX + r * Math.sin(a)} y={CX - r * Math.cos(a)} textAnchor="middle" dominantBaseline="central"
            style={{ ...NUM_FONT, fontSize: small ? 30 : 28, fill: C.ink }}>{n}</text>
        );
      })}
    </g>
  );
}

type Drag = { hand: 'hour' | 'minute'; last: number; total: number };

export default function Clock({ state, onChange, size = 'big' }: ModelProps<'clock'>) {
  const live = !!onChange;
  const { hour, minute } = state;
  const snap = snapOf(state);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null);

  const hourAngle = useUnwrapped(hourHandAngle(hour, minute));
  const minAngle = useUnwrapped(minuteHandAngle(minute));
  const label = `Clock showing ${clockWords(hour, minute)}`;

  function pointerAngle(e: RPointerEvent): number {
    const r = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  }

  function moveTo(a: number) {
    const d = drag.current;
    if (!d || !onChange) return;
    if (d.hand === 'hour') {
      const next = setHourFromAngle(state, a);
      if (next !== state) onChange(next);
      return;
    }
    d.total += angleDelta(d.last, a) / 6;
    d.last = a;
    const t = snapTime(d.total, snap);
    if (t.hour !== hour || t.minute !== minute) onChange({ ...state, ...t });
  }

  function grab(hand: 'hour' | 'minute') {
    return (e: RPointerEvent) => {
      if (!onChange) return;
      e.preventDefault();
      svgRef.current?.setPointerCapture(e.pointerId);
      const a = pointerAngle(e);
      // The minute hand jumps to their finger: start from where it points now.
      drag.current = { hand, last: minuteHandAngle(minute), total: clockToMinutes(hour, minute) };
      setDragging(hand);
      moveTo(a);
    };
  }

  function release() {
    drag.current = null;
    setDragging(null);
  }

  const handStyle = (deg: number, which: 'hour' | 'minute') => ({
    transform: `rotate(${deg}deg)`,
    transformOrigin: `${CX}px ${CX}px`,
    transition: dragging === which ? 'transform .06s linear' : 'transform .7s cubic-bezier(.35,1.25,.5,1)',
  });

  const scale = size === 'small' ? 0.55 : 1.3;
  const face = (
    <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} {...svgBox(VB, VB, scale)} role="img" aria-label={label}
      style={{ ...svgBox(VB, VB, scale).style, touchAction: live ? 'none' : undefined }}
      onPointerMove={(e) => { if (drag.current) moveTo(pointerAngle(e)); }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <Face small={size === 'small'} />
      <g className="mb-anim" style={handStyle(hourAngle, 'hour')}>
        <HourHand />
        {live && <line x1={CX} y1={CX + 14} x2={CX} y2={CX - HOUR_SPLIT} stroke="transparent" strokeWidth={46}
          style={{ cursor: 'grab' }} onPointerDown={grab('hour')} aria-hidden />}
      </g>
      <g className="mb-anim" style={handStyle(minAngle, 'minute')}>
        <MinuteHand />
        {/* On an o'clock-only clock the minute hand stays on 12, so grabbing it sets the hour instead. */}
        {live && <line x1={CX} y1={CX - HOUR_SPLIT} x2={CX} y2={CX - MIN_LEN - 14} stroke="transparent" strokeWidth={46}
          style={{ cursor: 'grab' }} onPointerDown={grab(snap === 60 ? 'hour' : 'minute')} aria-hidden />}
      </g>
      <circle cx={CX} cy={CX} r={10} fill={C.ink} pointerEvents="none" />
      <circle cx={CX} cy={CX} r={3.5} fill="#FFFDF6" pointerEvents="none" />
    </svg>
  );

  if (!live) return <div style={{ maxWidth: '100%' }}><ModelStyles />{face}</div>;

  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: '100%' }}>
      <ModelStyles />
      {face}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Stepper hand="hour" onStep={(by) => onChange!(stepHour(state, by))} />
        {snap !== 60 && <Stepper hand="minute" onStep={(by) => onChange!(stepMinute(state, by))} />}
      </div>
    </div>
  );
}

/** − [the hand] + : steps one hand, with a little clock showing only that hand so they know which. */
function Stepper({ hand, onStep }: { hand: 'hour' | 'minute'; onStep: (by: number) => void }) {
  const colour = hand === 'hour' ? HOUR_COLOUR : MINUTE_COLOUR;
  const soft = hand === 'hour' ? '#E3E7F7' : '#FDE8D4';
  const btn = { ...bigButton(54), fontSize: 34, color: colour, borderColor: colour + '55', boxShadow: `0 4px 0 ${colour}40` };
  const name = hand === 'hour' ? 'hour hand' : 'minute hand';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 5, borderRadius: 26, background: soft }}>
      <button className="mb-btn" style={btn} aria-label={`Move the ${name} back`} onClick={() => onStep(-1)}>−</button>
      <svg width={40} height={40} viewBox="0 0 44 44" aria-hidden>
        <circle cx={22} cy={22} r={20} fill="#FFFDF6" stroke="#4FA3D9" strokeWidth={3} />
        {hand === 'hour'
          ? <path d="M18.5,24 L19,13 Q22,9 25,13 L25.5,24 Z" fill={colour} transform="rotate(60 22 22)" />
          : <path d="M20.5,26 L21,7 Q22,4.5 23,7 L23.5,26 Z" fill={colour} />}
        <circle cx={22} cy={22} r={3} fill={C.ink} />
      </svg>
      <button className="mb-btn" style={btn} aria-label={`Move the ${name} on`} onClick={() => onStep(1)}>+</button>
    </div>
  );
}

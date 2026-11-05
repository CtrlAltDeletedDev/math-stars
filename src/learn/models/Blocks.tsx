import { useEffect, useState } from 'react';
import { ModelProps } from './types';
import { C } from '@/next/theme';
import { ModelStyles, bigButton, svgBox, tapProps, useLeaving } from './b-shared';
import { addOne, addTen, canTradeNow, maxOnesOf, maxTensOf, removeOne, removeTen, trade } from './logic-b';

// Base-ten blocks on a place-value mat: rods (ten joined cubes) on the left,
// loose unit cubes on the right in pairs, five rows high (2 x 5), a second
// 2 x 5 beside it for 11-20. Flat 3-D: a front face, a lighter top and a
// darker side, the look of the plastic blocks in every first-grade classroom.

const U = 20;       // cube face
const D = 7;        // depth of the top / side faces
const ROD_PITCH = U + D + 6;
const ONE_PITCH = U + D + 4;
const GROUP_W = ONE_PITCH + U + D;
const GROUP_GAP = 14;
const P = 12;       // outer padding
const MAT_PAD = 14;
const MAT_H = 10 * U + D + MAT_PAD * 2;
const MAT_GAP = 12;

const FACE = { front: '#7CC0EE', top: '#BFE3FA', side: '#4C98D0', edge: '#2B6C9C' };

/** One block, its front face at (x, y), `n` cubes tall. */
export function Block({ x, y, n }: { x: number; y: number; n: number }) {
  const h = n * U;
  return (
    <g strokeLinejoin="round">
      <path d={`M${x + U},${y} l${D},${-D} v${h} l${-D},${D} z`} fill={FACE.side} stroke={FACE.edge} strokeWidth={1.5} />
      <path d={`M${x},${y} l${D},${-D} h${U} l${-D},${D} z`} fill={FACE.top} stroke={FACE.edge} strokeWidth={1.5} />
      <rect x={x} y={y} width={U} height={h} fill={FACE.front} stroke={FACE.edge} strokeWidth={1.5} />
      {/* A highlight down the front edge, so it reads as plastic, not paper. */}
      <rect x={x + 2.5} y={y + 2.5} width={3} height={h - 5} rx={1.5} fill="#fff" opacity={0.35} />
      {Array.from({ length: n - 1 }, (_, k) => (
        <g key={k} stroke={FACE.edge} strokeWidth={1.2} opacity={0.65}>
          <line x1={x} y1={y + (k + 1) * U} x2={x + U} y2={y + (k + 1) * U} />
          <line x1={x + U} y1={y + (k + 1) * U} x2={x + U + D} y2={y + (k + 1) * U - D} />
        </g>
      ))}
    </g>
  );
}

function layout(tensSlots: number, groups: number) {
  const tensW = MAT_PAD * 2 + tensSlots * ROD_PITCH - 6;
  const onesW = MAT_PAD * 2 + groups * GROUP_W + (groups - 1) * GROUP_GAP;
  const onesX = P + tensW + MAT_GAP;
  const floor = P + MAT_PAD + D + 10 * U; // bottom of every block
  return {
    tensW, onesW, onesX, floor,
    vbW: onesX + onesW + P,
    vbH: P * 2 + MAT_H,
    rod: (i: number) => ({ x: P + MAT_PAD + i * ROD_PITCH, y: P + MAT_PAD + D }),
    // Ones fill from the floor up, left then right, like stacking pairs.
    one: (i: number) => {
      const g = Math.floor(i / 10), k = i % 10;
      return { x: onesX + MAT_PAD + g * (GROUP_W + GROUP_GAP) + (k % 2) * ONE_PITCH, y: floor - U - Math.floor(k / 2) * ONE_PITCH };
    },
  };
}

function words(tens: number, ones: number) {
  return `${tens} ${tens === 1 ? 'ten' : 'tens'} and ${ones} ${ones === 1 ? 'one' : 'ones'}`;
}

export default function Blocks({ state, onChange, size = 'big' }: ModelProps<'blocks'>) {
  const live = !!onChange;
  const { tens, ones } = state;
  const maxTens = maxTensOf(state);

  // A trade is drawn as ten cubes flying into a new rod; spot it from the change.
  const [prev, setPrev] = useState({ tens, ones });
  const [trading, setTrading] = useState(0);
  const [keyBase, setKeyBase] = useState(0);
  if (prev.tens !== tens || prev.ones !== ones) {
    const traded = tens === prev.tens + 1 && ones === prev.ones - 10;
    setPrev({ tens, ones });
    if (traded) { setTrading((t) => t + 1); setKeyBase((b) => b + 10); }
    else if (trading) setTrading(0);
  }
  useEffect(() => {
    if (!trading) return;
    const t = setTimeout(() => setTrading(0), 950);
    return () => clearTimeout(t);
  }, [trading]);

  const shownTens = useLeaving(tens);
  const leavingOnes = useLeaving(ones);
  const shownOnes = trading ? ones : leavingOnes;

  const tensSlots = Math.max(tens, 1, live ? Math.min(maxTens, 10) : Math.min(state.maxTens ?? 0, 10));
  const groups = ones > 10 || state.canTrade || (live && maxOnesOf(state) > 10) ? 2 : 1;
  const L = layout(tensSlots, groups);
  const box = svgBox(L.vbW, L.vbH, size === 'small' ? 0.55 : 1.45);
  const label = words(tens, ones);
  const lasso = ones >= 10 && !!state.canTrade && !trading;
  const newRod = L.rod(tens - 1);

  const picture = (
    <svg viewBox={`0 0 ${L.vbW} ${L.vbH}`} {...box} role="img" aria-label={label}>
      <rect x={P} y={P} width={L.tensW} height={MAT_H} rx={14} fill="#EEF2F8" stroke={C.line} strokeWidth={2} />
      <rect x={L.onesX} y={P} width={L.onesW} height={MAT_H} rx={14} fill={C.paperDeep} stroke={C.line} strokeWidth={2} />

      {Array.from({ length: shownTens }, (_, i) => {
        const r = L.rod(i);
        const isNew = trading && i === tens - 1;
        return (
          <g key={`t${i}`} className={i >= tens ? 'mb-out' : isNew ? 'mb-rod' : 'mb-drop'}>
            <Block x={r.x} y={r.y} n={10} />
          </g>
        );
      })}

      {lasso && (
        <rect className="mb-glow" x={L.one(0).x - 6} y={L.one(8).y - D - 6} width={GROUP_W + 12} height={5 * ONE_PITCH - 4 + D + 8} rx={10}
          fill="none" stroke={C.navy} strokeWidth={3} strokeDasharray="7 6" />
      )}

      {Array.from({ length: shownOnes }, (_, i) => {
        const o = L.one(i);
        return (
          <g key={`o${keyBase + i}`} className="mb-anim" style={{ transform: `translate(${o.x}px, ${o.y}px)`, transition: 'transform .5s cubic-bezier(.4,1.2,.5,1)' }}>
            <g className={i >= ones ? 'mb-out' : 'mb-drop'}><Block x={0} y={0} n={1} /></g>
          </g>
        );
      })}

      {trading > 0 && Array.from({ length: 10 }, (_, i) => {
        const o = L.one(i);
        // Each cube flies to its own place in the new rod.
        const dx = newRod.x - o.x, dy = newRod.y + (9 - i) * U - o.y;
        return (
          <g key={`f${trading}-${i}`} className="mb-fly" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${i * 0.025}s` }}>
            <Block x={o.x} y={o.y} n={1} />
          </g>
        );
      })}

      {live && tens > 0 && (
        <rect x={P} y={P} width={L.tensW} height={MAT_H} rx={14} fill="transparent" {...tapProps('Take away a ten', () => onChange!(removeTen(state)))} />
      )}
      {live && ones > 0 && (
        <rect x={L.onesX} y={P} width={L.onesW} height={MAT_H} rx={14} fill="transparent" {...tapProps('Take away a one', () => onChange!(removeOne(state)))} />
      )}
    </svg>
  );

  if (!live) return <div style={{ maxWidth: '100%' }}><ModelStyles />{picture}</div>;

  const tenFull = tens >= maxTens;
  const oneFull = ones >= maxOnesOf(state);
  const tradeOk = canTradeNow(state);
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      {picture}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="mb-btn" style={bigButton(76, tenFull)} disabled={tenFull} aria-label="Add a ten" onClick={() => onChange!(addTen(state))}>
          + <MiniRod />
        </button>
        <button className="mb-btn" style={bigButton(76, oneFull)} disabled={oneFull} aria-label="Add a one" onClick={() => onChange!(addOne(state))}>
          + <MiniCube />
        </button>
        {state.canTrade && (
          <button className={'mb-btn' + (tradeOk ? ' mb-pop' : '')} key={tradeOk ? 'on' : 'off'} disabled={!tradeOk} aria-label="Trade ten ones for a ten" onClick={() => onChange!(trade(state))}
            style={{ ...bigButton(76, !tradeOk), borderColor: tradeOk ? C.navy : C.line, background: tradeOk ? '#EEF2FF' : C.card }}>
            <MiniTen /><Arrow /><MiniRod />
          </button>
        )}
      </div>
    </div>
  );
}

// Button pictures: a rod, a cube, ten cubes, drawn small.

function MiniRod() {
  return <svg width={18} height={56} viewBox={`-1 ${-D - 1} ${U + D + 2} ${10 * U + D + 2}`} aria-hidden><Block x={0} y={0} n={10} /></svg>;
}

function MiniCube() {
  return <svg width={30} height={30} viewBox={`-1 ${-D - 1} ${U + D + 2} ${U + D + 2}`} aria-hidden><Block x={0} y={0} n={1} /></svg>;
}

function MiniTen() {
  return (
    <svg width={26} height={56} viewBox={`-1 ${-D - 1} ${GROUP_W + 2} ${4 * ONE_PITCH + U + D + 2}`} aria-hidden>
      {Array.from({ length: 10 }, (_, i) => <Block key={i} x={(i % 2) * ONE_PITCH} y={(4 - Math.floor(i / 2)) * ONE_PITCH} n={1} />)}
    </svg>
  );
}

function Arrow() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <path d="M3 12h15M12 5l7 7-7 7" fill="none" stroke={C.navy} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

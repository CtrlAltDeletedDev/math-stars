import { useId } from 'react';
import { ModelProps } from './types';
import { C, KID_FONT } from '@/next/theme';
import { ModelStyles, bigButton, useChangeKey } from './b-shared';
import { addCoin, coinName, coinTotal, removeCoin } from './logic-b';

// US coins, drawn: true relative sizes (the dime is the smallest even though
// it is worth more than a penny or a nickel -- a thing they have to learn), the
// penny copper, the others silver, ridged edges on the dime and quarter as on
// the real coins, a profile embossed on the face, and the value written large
// so they can count without knowing the names yet.

type Metal = { light: string; mid: string; dark: string; rim: string; ink: string };
const COPPER: Metal = { light: '#F6C7A1', mid: '#D98A55', dark: '#A65A2C', rim: '#8A4521', ink: '#4A1F08' };
const SILVER: Metal = { light: '#FFFFFF', mid: '#C9CED4', dark: '#959CA5', rim: '#727A84', ink: '#272C33' };

const SPEC: Record<number, { mm: number; metal: Metal; ridged: boolean; flip?: boolean }> = {
  1: { mm: 19.05, metal: COPPER, ridged: false, flip: true }, // Lincoln faces right
  5: { mm: 21.21, metal: SILVER, ridged: false },
  10: { mm: 17.91, metal: SILVER, ridged: true },
  25: { mm: 24.26, metal: SILVER, ridged: true },
};

/** Pixels across for a coin at 'big' size: a quarter is 86px. */
export const coinPx = (value: number, scale = 1) => Math.round((SPEC[value]?.mm ?? 20) * 3.55 * scale);

/** A bust in profile, facing left, in a 100 x 100 box. */
const BUST = 'M64 84C64 74 65 67 66 61C72 56 75 45 71 35C67 25 55 20 46 23C38 26 34 34 35 41L30.5 49.5L35 51.5C34 54 36 56 35 58C35 61 37 63 41 63.5C44 64.5 46 67 46 71L44 84Z';

export function Coin({ value, px }: { value: number; px: number }) {
  const id = useId().replace(/:/g, '');
  const s = SPEC[value] ?? { mm: 20, metal: SILVER, ridged: false };
  const m = s.metal;
  const text = `${value}¢`;
  return (
    <svg width={px} height={px} viewBox="0 0 100 100" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`g${id}`} cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor={m.light} />
          <stop offset="55%" stopColor={m.mid} />
          <stop offset="100%" stopColor={m.dark} />
        </radialGradient>
      </defs>
      <ellipse cx={51} cy={54} rx={48} ry={48} fill="#000" opacity={0.16} />
      <circle cx={50} cy={50} r={48} fill={`url(#g${id})`} stroke={m.rim} strokeWidth={2.5} />
      {s.ridged && Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return <line key={i} x1={50 + 44 * Math.cos(a)} y1={50 + 44 * Math.sin(a)} x2={50 + 47.5 * Math.cos(a)} y2={50 + 47.5 * Math.sin(a)} stroke={m.rim} strokeWidth={1.6} opacity={0.7} />;
      })}
      <circle cx={50} cy={50} r={s.ridged ? 41 : 42} fill="none" stroke={m.rim} strokeWidth={1.5} opacity={0.55} />
      <g transform={s.flip ? 'translate(100 0) scale(-1 1)' : undefined}>
        <path d={BUST} transform="translate(2 -6)" fill={m.dark} opacity={0.32} />
        <path d={BUST} transform="translate(1 -7)" fill="none" stroke={m.light} strokeWidth={1.2} opacity={0.6} />
      </g>
      <text x={50} y={66} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: KID_FONT, fontWeight: 700, fontSize: text.length > 2 ? 31 : 36, fill: m.ink, paintOrder: 'stroke', stroke: m.light, strokeWidth: 5, strokeLinejoin: 'round' }}>
        {text}
      </text>
    </svg>
  );
}

/** Bank coins are a little smaller than the tray's, so all four fit across a phone. */
const BANK = 0.82;

function describe(tray: number[]): string {
  if (!tray.length) return 'No coins';
  const counts = new Map<number, number>();
  tray.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const parts = [...counts].sort((a, b) => b[0] - a[0]).map(([v, n]) => `${n} ${n === 1 ? coinName(v) : coinName(v) === 'penny' ? 'pennies' : coinName(v) + 's'}`);
  return parts.join(', ');
}

export default function Coins({ state, onChange, size = 'big' }: ModelProps<'coins'>) {
  const live = !!onChange;
  const small = size === 'small';
  const scale = small ? 0.48 : 1;
  const total = coinTotal(state.tray);
  const bumpKey = useChangeKey(total);
  const label = `${describe(state.tray)}${state.showTotal ? `, ${total} cents` : ''}`;
  const tray = state.tray;

  const totalPill = state.showTotal && (
    <div key={bumpKey} className="mb-bump" aria-hidden style={{
      justifySelf: 'center', fontFamily: KID_FONT, fontWeight: 700, fontSize: small ? 20 : 36, lineHeight: 1,
      color: C.ink, background: C.card, border: `3px solid ${C.line}`, borderRadius: 999, padding: small ? '3px 10px' : '6px 18px',
    }}>{total}¢</div>
  );

  return (
    <div role={live ? 'group' : 'img'} aria-label={label}
      // A grid track of minmax(0, W): as wide as W where there is room, and free to shrink in a narrow tile or phone.
      style={{ display: 'grid', gridTemplateColumns: `minmax(0, ${small ? 150 : 400}px)`, justifyContent: 'center', gap: small ? 6 : 12, maxWidth: '100%', touchAction: 'manipulation' }}>
      <ModelStyles />
      {totalPill}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: small ? 4 : 10,
        minHeight: coinPx(25, scale) + (small ? 10 : 24), padding: small ? 5 : 12, borderRadius: small ? 14 : 24,
        background: C.paperDeep, boxShadow: 'inset 0 3px 6px rgba(80,60,20,.12)',
        border: tray.length ? '3px solid transparent' : `3px dashed ${C.line}`, boxSizing: 'border-box',
      }}>
        {tray.map((v, i) => {
          const coin = <Coin value={v} px={coinPx(v, scale)} />;
          if (!live) return <div key={i} className="mb-drop">{coin}</div>;
          return (
            <button key={i} className="mb-drop mb-tap" aria-label={`Take away a ${coinName(v)}`} onClick={() => onChange!(removeCoin(state, i))}
              style={{ padding: 0, border: 'none', background: 'none', minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
              {coin}
            </button>
          );
        })}
      </div>

      {live && state.bank && state.bank.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', padding: '10px 6px', borderRadius: 24, background: '#EAF3FA' }}>
          {state.bank.map((v, i) => (
            <button key={i} className="mb-btn" aria-label={`Add a ${coinName(v)}`} onClick={() => onChange!(addCoin(state, v))}
              style={{ ...bigButton(coinPx(v, BANK) + 10), width: coinPx(v, BANK) + 10, height: coinPx(25, BANK) + 12, padding: 0, borderRadius: 22, background: '#fff' }}>
              <Coin value={v} px={coinPx(v, BANK)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
